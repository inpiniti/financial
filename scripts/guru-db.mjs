// guru-report 표결 결과를 Supabase에 쌓는다. (테이블 정의: scripts/guru-votes.sql)
//
// 흐름은 두 단계다 — 먼저 오늘의 대상 종목을 행으로 깔고(seed), 그 다음 종목별로
// 13인의 판정이 나오는 대로 그 행을 채운다(put). 중간에 끊겨도 채워진 데까지 남는다.
//
// 사용법:
//   node scripts/guru-db.mjs seed [YYYY-MM-DD]         # 스크리너 유니버스를 행으로 생성
//   node scripts/guru-db.mjs put <날짜> <티커> < votes.txt
//   node scripts/guru-db.mjs show <날짜>                # 저장된 표를 콘솔에 출력
//   node scripts/guru-db.mjs todo <날짜>                # 아직 판정 안 된 티커만 출력
//
// put의 입력은 guru-vote 에이전트가 뱉은 한 줄들을 그대로 이어붙인 텍스트다:
//   인물: 워런 버핏 | 의견: 보유 | 확신도: 7 | 근거: ...
// 형식이 어긋난 줄은 조용히 건너뛴다(에이전트가 앞에 군더더기를 붙이는 일이 있다).

import fs from 'node:fs'
import path from 'node:path'
import { buildUniverse } from './guru-universe.mjs'

// ── 설정 ────────────────────────────────────────────────────────────────
// 키는 절대 코드에 박지 않는다. 저장소 루트 .env(=gitignore 대상)에서 읽는다.
function loadEnv() {
  const envPath = path.resolve(import.meta.dirname, '../.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadEnv()

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
if (!URL || !KEY) {
  console.error('.env에 SUPABASE_URL / SUPABASE_SERVICE_KEY 가 필요하다.')
  process.exit(1)
}

const TABLE = `${URL}/rest/v1/guru_votes`
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

async function rest(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init.headers ?? {}) } })
  const text = await res.text()
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : null
}

// ── 거장 ↔ 컬럼 매핑 ────────────────────────────────────────────────────
// 스크리너 프리셋 순서와 동일. 매칭은 성(姓) 키워드 부분일치로 한다 —
// 에이전트가 '워런 버핏'/'버핏'/'워런버핏' 중 무엇으로 답해도 같은 칸에 들어가게.
const GURU_COLUMNS = [
  { col: 'g1', key: '그레이엄', full: '벤저민 그레이엄' },
  { col: 'g2', key: '클라먼', full: '세스 클라먼' },
  { col: 'g3', key: '파브라이', full: '모니시 파브라이' },
  { col: 'g4', key: '그린블라트', full: '조엘 그린블라트' },
  { col: 'g5', key: '코스톨라니', full: '앙드레 코스톨라니' },
  { col: 'g6', key: '슈웨거', full: '잭 슈웨거' },
  { col: 'g7', key: '버핏', full: '워런 버핏' },
  { col: 'g8', key: '피셔', full: '필립 피셔' },
  { col: 'g9', key: '뉴욕주민', full: '뉴욕주민' },
  { col: 'g10', key: '린치', full: '피터 린치' },
  { col: 'g11', key: '다모다란', full: '애스워스 다모다란' },
  { col: 'g12', key: '템플턴', full: '존 템플턴' },
  { col: 'g13', key: '버리', full: '마이클 버리' },
]

export const SCORE = { 매수: 0, 보유: 1, 관망: 2, 매도: 3 }
const SCORE_LABEL = ['매수', '보유', '관망', '매도']

const VOTE_LINE = /인물:\s*([^|]+?)\s*\|\s*의견:\s*(매수|보유|관망|매도)/g

/** 표결 텍스트 → { g1: 0, g7: 1, ... }. 못 알아본 인물은 무시하고 목록으로 돌려준다. */
export function parseVotes(text) {
  const scores = {}
  const unknown = []
  for (const m of text.matchAll(VOTE_LINE)) {
    const who = m[1].replace(/\s/g, '')
    const hit = GURU_COLUMNS.find((g) => who.includes(g.key))
    if (!hit) {
      unknown.push(m[1].trim())
      continue
    }
    scores[hit.col] = SCORE[m[2]]
  }
  return { scores, unknown }
}

/** 13인 점수 → 종합(g0). 최빈값, 동률이면 보수적인 쪽(점수가 큰 쪽). */
export function synthesize(scores) {
  const counts = [0, 0, 0, 0]
  let total = 0
  for (const g of GURU_COLUMNS) {
    const v = scores[g.col]
    if (typeof v === 'number') {
      counts[v] += 1
      total += 1
    }
  }
  if (total === 0) return null
  let top = 3
  for (let v = 3; v >= 0; v -= 1) if (counts[v] > counts[top]) top = v
  return top
}

// ── 명령 ────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10)

async function seed(d, nation, steps) {
  const { tickers, perScreener } = await buildUniverse({ nation, steps })
  const rows = tickers.map((t) => ({
    d,
    ticker: t.ticker,
    name: t.name,
    nation,
    screeners: t.screeners,
  }))
  // 이미 있는 행의 점수를 지우면 안 되므로 merge-duplicates. 점수 컬럼은 보내지 않는다.
  await rest(`${TABLE}?on_conflict=d,ticker`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  })
  for (const [k, v] of Object.entries(perScreener)) {
    if (v.raw) console.error(`  ${k.padEnd(12)} ${v.raw}${v.step ? ` (${v.step}단계 → ${v.kept})` : ''}`)
  }
  console.error(`\n${d} · ${nation} · ${rows.length}종목 저장`)
  console.log(rows.map((r) => r.ticker).join(' '))
}

async function put(d, ticker, text) {
  const { scores, unknown } = parseVotes(text)
  const n = Object.keys(scores).length
  if (n === 0) throw new Error('표결 줄을 하나도 못 읽었다. 형식: 인물: X | 의견: 매수')
  const patch = { ...scores, g0: synthesize(scores), updated_at: new Date().toISOString() }
  await rest(`${TABLE}?d=eq.${d}&ticker=eq.${encodeURIComponent(ticker)}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(patch),
  })
  const tally = [0, 0, 0, 0]
  for (const v of Object.values(scores)) tally[v] += 1
  console.error(
    `${ticker}: ${n}인 · 매수${tally[0]} 보유${tally[1]} 관망${tally[2]} 매도${tally[3]} → 종합 ${SCORE_LABEL[patch.g0]}` +
      (unknown.length ? ` · 미매칭: ${unknown.join(', ')}` : ''),
  )
}

async function show(d) {
  const rows = await rest(`${TABLE}?d=eq.${d}&select=*&order=g0.asc,ticker.asc`)
  if (!rows.length) return console.log(`${d}: 행 없음`)
  const cols = GURU_COLUMNS.map((g) => g.col)
  console.log(['티커'.padEnd(6), '종합', ...cols.map((c) => c.padStart(3))].join(' '))
  for (const r of rows) {
    console.log(
      [
        r.ticker.padEnd(6),
        (r.g0 === null ? '—' : SCORE_LABEL[r.g0]).padEnd(4),
        ...cols.map((c) => String(r[c] ?? '·').padStart(3)),
      ].join(' '),
    )
  }
  const done = rows.filter((r) => r.g0 !== null).length
  console.log(`\n${done}/${rows.length} 완료`)
}

async function todo(d) {
  const rows = await rest(`${TABLE}?d=eq.${d}&g0=is.null&select=ticker&order=ticker.asc`)
  console.log(rows.map((r) => r.ticker).join(' '))
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

const [cmd, ...rest_] = process.argv.slice(2)
if (process.argv[1]?.endsWith('guru-db.mjs')) try {
  if (cmd === 'seed') {
    const d = rest_[0] && /^\d{4}-\d{2}-\d{2}$/.test(rest_[0]) ? rest_[0] : today()
    const nIdx = rest_.indexOf('--nation')
    await seed(d, nIdx >= 0 ? rest_[nIdx + 1] : 'us', { 피셔: 5 })
  } else if (cmd === 'put') {
    await put(rest_[0], rest_[1], readStdin())
  } else if (cmd === 'show') {
    await show(rest_[0] ?? today())
  } else if (cmd === 'todo') {
    await todo(rest_[0] ?? today())
  } else {
    console.error('명령: seed | put | show | todo  (자세한 건 파일 상단 주석)')
    process.exit(1)
  }
} catch (e) {
  console.error(`실패: ${e.message}`)
  process.exit(1)
}
