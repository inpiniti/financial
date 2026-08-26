// guru_votes 표결 테이블 읽기 전용 클라이언트 (테이블 정의: scripts/guru-votes.sql).
//
// 쓰기는 service_role 키를 쓰는 scripts/guru-db.mjs만 한다. 화면은 anon(publishable) 키로
// select만 하므로 supabase-js를 얹지 않고 PostgREST에 fetch 한 번 하는 걸로 끝낸다.
//
// 점수 규약: 0 매수 / 1 보유 / 2 관망 / 3 매도, NULL = 미판정.
// 컬럼 g1~g13이 어느 거장인지는 guru-db.mjs의 GURU_COLUMNS와 같은 순서이며,
// 각 칸의 키는 GURUS_INFO.screenerKey와 일치한다(그레이엄·클라먼·…).

import type { Tally, Verdict } from '@/lib/meta'
import { GURUS_INFO } from '@/lib/gurus'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** 점수 인덱스 → 의견. guru-db.mjs의 SCORE와 같은 순서다. */
export const SCORE_VERDICT: Verdict[] = ['매수', '보유', '관망', '매도']

/** 컬럼 g1~g13 ↔ 거장. 순서는 종합 스크리너 프리셋 순서와 동일하다. */
export const VOTE_COLUMNS: { col: string; screenerKey: string }[] = [
  { col: 'g1', screenerKey: '그레이엄' },
  { col: 'g2', screenerKey: '클라먼' },
  { col: 'g3', screenerKey: '파브라이' },
  { col: 'g4', screenerKey: '그린블라트' },
  { col: 'g5', screenerKey: '코스톨라니' },
  { col: 'g6', screenerKey: '슈웨거' },
  { col: 'g7', screenerKey: '버핏' },
  { col: 'g8', screenerKey: '피셔' },
  { col: 'g9', screenerKey: '뉴욕주민' },
  { col: 'g10', screenerKey: '린치' },
  { col: 'g11', screenerKey: '다모다란' },
  { col: 'g12', screenerKey: '템플턴' },
  { col: 'g13', screenerKey: '버리' },
]

/** 거장 한 명의 판정 한 칸. */
export interface GuruVote {
  screenerKey: string
  name: string
  verdict: Verdict | null
}

/** 화면에서 쓰는 표결 한 행. */
export interface VoteRow {
  date: string
  ticker: string
  name: string
  nation: string
  screeners: string[]
  /** 종합(g0) — 13인 최빈값. 미판정이면 null. */
  overall: Verdict | null
  /** 판정된 거장 수 */
  votedCount: number
  tally: Tally
  votes: GuruVote[]
  updatedAt: string | null
}

interface RawRow {
  d: string
  ticker: string
  name: string | null
  nation: string | null
  screeners: string[] | null
  g0: number | null
  updated_at: string | null
  [col: string]: unknown
}

export function isVotesConfigured(): boolean {
  return Boolean(URL && KEY)
}

async function rest<T>(query: string): Promise<T> {
  if (!URL || !KEY) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 설정되지 않았습니다.')
  }
  const res = await fetch(`${URL}/rest/v1/guru_votes?${query}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`)
  return (await res.json()) as T
}

const nameOf = (screenerKey: string) =>
  GURUS_INFO.find((g) => g.screenerKey === screenerKey)?.name ?? screenerKey

const verdictOf = (v: unknown): Verdict | null =>
  typeof v === 'number' && v >= 0 && v <= 3 ? SCORE_VERDICT[v] : null

function toRow(raw: RawRow): VoteRow {
  const votes = VOTE_COLUMNS.map(({ col, screenerKey }) => ({
    screenerKey,
    name: nameOf(screenerKey),
    verdict: verdictOf(raw[col]),
  }))
  const tally: Tally = { 매수: 0, 보유: 0, 관망: 0, 매도: 0 }
  for (const v of votes) if (v.verdict) tally[v.verdict] += 1

  return {
    date: raw.d,
    ticker: raw.ticker,
    name: raw.name ?? raw.ticker,
    nation: raw.nation ?? 'us',
    screeners: raw.screeners ?? [],
    overall: verdictOf(raw.g0),
    votedCount: votes.filter((v) => v.verdict).length,
    tally,
    votes,
    updatedAt: raw.updated_at,
  }
}

/** 표결이 존재하는 날짜 목록(최신순). PostgREST에 distinct가 없어 클라이언트에서 중복을 없앤다. */
export async function fetchVoteDates(): Promise<string[]> {
  const rows = await rest<{ d: string }[]>('select=d&order=d.desc')
  return Array.from(new Set(rows.map((r) => r.d)))
}

/** 해당 날짜의 표결 전체. 종합 점수 오름차순(=매수 → 매도) → 티커 순. */
export async function fetchVotesByDate(date: string): Promise<VoteRow[]> {
  const rows = await rest<RawRow[]>(
    `d=eq.${encodeURIComponent(date)}&select=*&order=g0.asc.nullslast,ticker.asc`,
  )
  return rows.map(toRow)
}

/** 한 종목의 표결 이력 전체(날짜 오름차순). 펼친 행의 일자별 히트맵이 쓴다. */
export async function fetchVotesByTicker(ticker: string): Promise<VoteRow[]> {
  const rows = await rest<RawRow[]>(
    `ticker=eq.${encodeURIComponent(ticker)}&select=*&order=d.asc`,
  )
  return rows.map(toRow)
}
