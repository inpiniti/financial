// 보고서 마크다운 헤더에서 메타데이터를 뽑는 순수 파서 모듈.
// I/O 없음 · 문자열 입력 → 메타 출력. 어떤 입력에도 throw 하지 않고,
// 파싱 실패는 예외가 아니라 null(또는 빈 값)로 돌려준다. (설계 4-2절)

export type Verdict = '매수' | '보유' | '매도' | '관망'

export interface Tally {
  매수: number
  보유: number
  매도: number
  관망: number
}

export interface GuruMeta {
  verdict: Verdict | null
  confidence: number | null // 1~10
}

export interface FinalMeta {
  finalVerdict: string | null // 종합 의견 원문 (** 마크업 제거)
  tally: Tally | null
}

const VERDICT_RE = /투자의견:\s*(매수|보유|매도|관망)/
const CONFIDENCE_RE = /확신도:\s*(\d+)\s*\/\s*10/

/**
 * 거장 보고서 헤더 파싱.
 * 예: `> 날짜: 2026-07-10 | 투자의견: 관망 | 확신도: 8/10`
 */
export function parseGuruMeta(raw: string | null | undefined): GuruMeta {
  if (!raw) return { verdict: null, confidence: null }

  const verdictMatch = raw.match(VERDICT_RE)
  const verdict = (verdictMatch?.[1] as Verdict | undefined) ?? null

  const confMatch = raw.match(CONFIDENCE_RE)
  let confidence: number | null = null
  if (confMatch) {
    const n = Number.parseInt(confMatch[1], 10)
    confidence = Number.isFinite(n) && n >= 1 && n <= 10 ? n : null
  }

  return { verdict, confidence }
}

const FINAL_VERDICT_RE = /종합\s*의견:\s*([^|\n]+)/
const TALLY_LINE_RE = /표결:\s*([^\n]+)/
const TALLY_PAIR_RE = /(매수|보유|매도|관망)\s*(\d+)/g

/**
 * 최종보고서 헤더 파싱.
 * 예: `> 날짜: … | 종합 의견: **매도 (…)** | 표결: 매수 1·보유 1·매도 6·관망 5`
 */
export function parseFinalMeta(raw: string | null | undefined): FinalMeta {
  if (!raw) return { finalVerdict: null, tally: null }

  let finalVerdict: string | null = null
  const fvMatch = raw.match(FINAL_VERDICT_RE)
  if (fvMatch) {
    const cleaned = fvMatch[1].replace(/\*/g, '').trim()
    finalVerdict = cleaned.length > 0 ? cleaned : null
  }

  let tally: Tally | null = null
  const tallyLine = raw.match(TALLY_LINE_RE)
  if (tallyLine) {
    const counts: Tally = { 매수: 0, 보유: 0, 매도: 0, 관망: 0 }
    let matched = false
    for (const m of tallyLine[1].matchAll(TALLY_PAIR_RE)) {
      const key = m[1] as Verdict
      const n = Number.parseInt(m[2], 10)
      if (Number.isFinite(n)) {
        counts[key] = n
        matched = true
      }
    }
    if (matched) tally = counts
  }

  return { finalVerdict, tally }
}

const TICKER_LINE_RE = /^\s*(\S+)\s*:\s*(.+?)\s*$/

/**
 * `interest ticker.md` 내용 → Map<ticker, 한글명>.
 * 행 포맷: `{TICKER} : {한글명}` (티커에 `.` 허용, 예: `BRK.B : 버크셔 해서웨이`).
 * 형식에 맞지 않는 행은 조용히 건너뛴다.
 */
export function parseTickerMap(raw: string | null | undefined): Map<string, string> {
  const map = new Map<string, string>()
  if (!raw) return map

  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(TICKER_LINE_RE)
    if (!m) continue
    const ticker = m[1]
    const name = m[2]
    if (ticker && name) map.set(ticker, name)
  }

  return map
}
