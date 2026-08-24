// 한 종목의 '핵심 데이터' 마크다운(약 1.5KB)을 무료 Yahoo 엔드포인트로 만든다.
//
// 왜 스크립트인가: 이건 수집·계산이지 판단이 아니다. 예전엔 guru-data 서브에이전트가
// curl+파싱을 했는데 종목당 약 2.8만 토큰과 90초가 들었다. 결정론적 스크립트로 옮기면
// 둘 다 0에 수렴하고, 종목마다 항목이 들쭉날쭉해지는 문제도 사라진다.
//
// 사용법:
//   node scripts/guru-core.mjs AAPL                    # stdout으로 마크다운
//   node scripts/guru-core.mjs AAPL --out <경로>
// 한국 종목은 티커에 .KS / .KQ 를 붙인다.

import fs from 'node:fs'
import path from 'node:path'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const Y1 = 'https://query1.finance.yahoo.com'

async function getJson(url, cookie) {
  const headers = { 'User-Agent': UA }
  if (cookie) headers.Cookie = cookie
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url.slice(0, 90)}`)
  return res.json()
}

/** quoteSummary는 쿠키+crumb가 필요하다. 프로세스당 한 번만 받아 재사용. */
let auth = null
async function getAuth() {
  if (auth) return auth
  const res = await fetch('https://fc.yahoo.com', { headers: { 'User-Agent': UA } })
  const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ')
  const crumbRes = await fetch(`${Y1}/v1/test/getcrumb`, {
    headers: { 'User-Agent': UA, Cookie: cookie },
  })
  auth = { cookie, crumb: (await crumbRes.text()).trim() }
  return auth
}

// ── 포맷터 (전부 null 안전 — 값이 없으면 '확인 불가') ──────────────────
const NA = '확인 불가'
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const raw = (o) => num(o?.raw)
const fx = (v, d = 2) => (num(v) === null ? NA : v.toFixed(d))
const pct = (v, d = 1) => (num(v) === null ? NA : `${(v * 100).toFixed(d)}%`)
const mult = (v) => (num(v) === null ? NA : `${v.toFixed(1)}x`)
const money = (v) => {
  if (num(v) === null) return NA
  const a = Math.abs(v)
  if (a >= 1e12) return `${(v / 1e12).toFixed(2)}T`
  if (a >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (a >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  return v.toFixed(0)
}
const ratio = (a, b) => (num(a) !== null && num(b) ? a / b : null)

/** fundamentals-timeseries 응답에서 타입별 [{date, value}] 시계열을 뽑는다. */
function series(ts, type) {
  const row = (ts?.timeseries?.result ?? []).find((r) => r[type])
  if (!row) return []
  return row[type]
    .filter(Boolean)
    .map((p) => ({ date: p.asOfDate, value: raw(p.reportedValue) }))
    .filter((p) => p.value !== null)
}
const last = (s) => (s.length ? s[s.length - 1].value : null)

/** 시계열 처음→끝 연평균 성장률. 부호가 바뀌면 의미가 없으므로 null. */
function cagr(s) {
  if (s.length < 2) return null
  const a = s[0].value
  const b = s[s.length - 1].value
  const years = s.length - 1
  if (!a || !b || a <= 0 || b <= 0) return null
  return (b / a) ** (1 / years) - 1
}

export async function buildCore(ticker, today = new Date().toISOString().slice(0, 10)) {
  const { cookie, crumb } = await getAuth()

  const modules = [
    'summaryDetail',
    'defaultKeyStatistics',
    'financialData',
    'recommendationTrend',
    'majorHoldersBreakdown',
    'calendarEvents',
    'assetProfile',
    'price',
  ].join(',')

  const types = [
    'annualTotalRevenue',
    'annualGrossProfit',
    'annualOperatingIncome',
    'annualNetIncome',
    'annualDilutedEPS',
    'annualFreeCashFlow',
    'annualTotalDebt',
    'annualStockholdersEquity',
    'annualCurrentAssets',
    'annualCurrentLiabilities',
    'annualCashAndCashEquivalents',
  ].join(',')
  const now = Math.floor(Date.now() / 1000)

  const [chart, qs, ts] = await Promise.all([
    getJson(`${Y1}/v8/finance/chart/${encodeURIComponent(ticker)}?range=1y&interval=1wk`),
    getJson(
      `${Y1}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`,
      cookie,
    ),
    getJson(
      `${Y1}/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(ticker)}?type=${types}&period1=1420070400&period2=${now}`,
    ),
  ])

  const meta = chart?.chart?.result?.[0]?.meta ?? {}
  const r = qs?.quoteSummary?.result?.[0] ?? {}
  const sd = r.summaryDetail ?? {}
  const ks = r.defaultKeyStatistics ?? {}
  const fd = r.financialData ?? {}
  const prof = r.assetProfile ?? {}
  const cal = r.calendarEvents ?? {}
  const hold = r.majorHoldersBreakdown ?? {}

  const price = num(meta.regularMarketPrice)
  const hi = num(meta.fiftyTwoWeekHigh)
  const lo = num(meta.fiftyTwoWeekLow)
  const pos =
    price !== null && hi !== null && lo !== null && hi > lo ? ((price - lo) / (hi - lo)) * 100 : null

  // 최근 3개 회계연도만 본다 (표결 판단에 5년치는 과하다).
  const cut = (s) => s.slice(-3)
  const rev = cut(series(ts, 'annualTotalRevenue'))
  const eps = cut(series(ts, 'annualDilutedEPS'))
  const gp = cut(series(ts, 'annualGrossProfit'))
  const oi = cut(series(ts, 'annualOperatingIncome'))
  const ni = cut(series(ts, 'annualNetIncome'))
  const fcf = cut(series(ts, 'annualFreeCashFlow'))
  const ca = cut(series(ts, 'annualCurrentAssets'))
  const cl = cut(series(ts, 'annualCurrentLiabilities'))
  const debt = cut(series(ts, 'annualTotalDebt'))
  const eq = cut(series(ts, 'annualStockholdersEquity'))
  const cash = cut(series(ts, 'annualCashAndCashEquivalents'))

  const revL = last(rev)
  const netDebt =
    num(last(debt)) !== null && num(last(cash)) !== null ? last(debt) - last(cash) : null

  // 애널리스트 등급 분포: recommendationTrend의 최근(0m) 구간.
  const rt = r.recommendationTrend?.trend?.[0]
  const grades = rt
    ? `강력매수 ${rt.strongBuy} / 매수 ${rt.buy} / 보유 ${rt.hold} / 매도 ${rt.sell + rt.strongSell}`
    : NA

  const earnRaw = num(cal?.earnings?.earningsDate?.[0]?.raw)
  const earnDate =
    cal?.earnings?.earningsDate?.[0]?.fmt ??
    (earnRaw ? new Date(earnRaw * 1000).toISOString().slice(0, 10) : NA)

  const cur = meta.currency ?? ''
  const summary = prof.longBusinessSummary
    ? prof.longBusinessSummary.split('. ')[0] + '.'
    : (r.price?.longName ?? ticker)

  const L = []
  L.push(`# ${ticker} 핵심 데이터 — ${today}`)
  L.push('')
  L.push(summary)
  L.push(`섹터: ${prof.sector ?? NA} / ${prof.industry ?? NA}`)
  L.push('')
  L.push('| 가격 | 값 | 밸류에이션 | 값 |')
  L.push('|---|---|---|---|')
  L.push(`| 현재가 | ${fx(price)} ${cur} | PER(t) | ${mult(raw(sd.trailingPE))} |`)
  L.push(
    `| 시가총액 | ${money(raw(sd.marketCap) ?? raw(r.price?.marketCap))} | PER(f) | ${mult(raw(sd.forwardPE))} |`,
  )
  L.push(`| 52주 고/저 | ${fx(hi)} / ${fx(lo)} | PBR | ${mult(raw(ks.priceToBook))} |`)
  L.push(
    `| 52주 위치 | ${pos === null ? NA : pos.toFixed(0) + '%'} | PSR | ${mult(raw(ks.priceToSalesTrailing12Months) ?? raw(sd.priceToSalesTrailing12Months))} |`,
  )
  L.push(
    `| 배당수익률 | ${pct(raw(sd.dividendYield))} | EV/EBITDA | ${mult(raw(ks.enterpriseToEbitda))} |`,
  )
  L.push('')
  L.push('| 성장·수익성 | 값 | 안전성·수급 | 값 |')
  L.push('|---|---|---|---|')
  L.push(`| 매출 3년 CAGR | ${pct(cagr(rev))} | 유동비율 | ${fx(ratio(last(ca), last(cl)))} |`)
  L.push(`| EPS 3년 CAGR | ${pct(cagr(eps))} | 총부채/자본 | ${fx(ratio(last(debt), last(eq)))} |`)
  L.push(`| 매출총이익률 | ${pct(ratio(last(gp), revL))} | 순부채 | ${money(netDebt)} |`)
  L.push(`| 영업이익률 | ${pct(ratio(last(oi), revL))} | 공매도 비율 | ${pct(raw(ks.shortPercentOfFloat))} |`)
  L.push(`| 순이익률 | ${pct(ratio(last(ni), revL))} | 내부자 지분 | ${pct(raw(hold.insidersPercentHeld))} |`)
  L.push(`| ROE | ${pct(raw(fd.returnOnEquity))} | 기관 지분 | ${pct(raw(hold.institutionsPercentHeld))} |`)
  L.push(`| FCF | ${money(last(fcf))} | 베타 | ${fx(raw(ks.beta))} |`)
  L.push('')
  L.push(`- 최근 분기 성장: 매출 ${pct(raw(fd.revenueGrowth))} YoY / 이익 ${pct(raw(fd.earningsGrowth))} YoY`)
  L.push(
    `- 애널리스트: ${grades} · 목표가 ${fx(raw(fd.targetMeanPrice))} (${fd.numberOfAnalystOpinions?.raw ?? NA}명)`,
  )
  L.push(`- 차기 실적 발표: ${earnDate}`)
  L.push('')
  L.push(`> 출처: Yahoo Finance, 조회일 ${today}. 값이 없으면 '${NA}'.`)

  return L.join('\n') + '\n'
}

if (process.argv[1]?.endsWith('guru-core.mjs')) {
  const args = process.argv.slice(2)
  const flagIdx = (f) => args.indexOf(f)
  const outFile = flagIdx('--out') >= 0 ? args[flagIdx('--out') + 1] : null
  const outDir = flagIdx('--out-dir') >= 0 ? args[flagIdx('--out-dir') + 1] : null
  const tickers = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out' && args[i - 1] !== '--out-dir')

  if (!tickers.length) {
    console.error('사용법: node scripts/guru-core.mjs <티커...> [--out <파일>] [--out-dir <폴더>]')
    process.exit(1)
  }

  // 여러 종목을 한 프로세스에서 처리한다 — crumb 발급이 1회로 끝나고, 종목당 1초대로 떨어진다.
  const failed = []
  for (const t of tickers) {
    try {
      const md = await buildCore(t)
      if (outDir) {
        const out = path.join(outDir, `${t}.md`)
        fs.mkdirSync(outDir, { recursive: true })
        fs.writeFileSync(out, md, 'utf8')
        console.error(`${t.padEnd(6)} ${String(Buffer.byteLength(md)).padStart(5)}B → ${out}`)
      } else if (outFile) {
        fs.mkdirSync(path.dirname(outFile), { recursive: true })
        fs.writeFileSync(outFile, md, 'utf8')
        console.error(`${t}: ${Buffer.byteLength(md)}바이트 → ${outFile}`)
      } else {
        process.stdout.write(md)
      }
    } catch (e) {
      failed.push(`${t} (${e.message})`)
      console.error(`${t.padEnd(6)} 실패: ${e.message}`)
    }
  }
  if (failed.length) console.error(`\n실패 ${failed.length}건: ${failed.join(', ')}`)
}
