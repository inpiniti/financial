/**
 * Vercel Serverless Function: /api/guru/collect
 */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
const Y1 = 'https://query1.finance.yahoo.com'

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

function series(ts, type) {
  const row = (ts?.timeseries?.result ?? []).find((r) => r[type])
  if (!row) return []
  return row[type]
    .filter(Boolean)
    .map((p) => ({ date: p.asOfDate, value: raw(p.reportedValue) }))
    .filter((p) => p.value !== null)
}
const last = (s) => (s.length ? s[s.length - 1].value : null)

function cagr(s) {
  if (s.length < 2) return null
  const a = s[0].value
  const b = s[s.length - 1].value
  const years = s.length - 1
  if (!a || !b || a <= 0 || b <= 0) return null
  return (b / a) ** (1 / years) - 1
}

async function buildCore(ticker, today = new Date().toISOString().slice(0, 10)) {
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
  ].join(',')

  const [qs, ts] = await Promise.all([
    fetch(`${Y1}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${crumb}`, {
      headers: { 'User-Agent': UA, Cookie: cookie },
    }).then((r) => r.json()),
    fetch(`${Y1}/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(ticker)}?type=${types}&period1=0&period2=9999999999&crumb=${crumb}`, {
      headers: { 'User-Agent': UA, Cookie: cookie },
    }).then((r) => r.json()),
  ])

  const r = qs?.quoteSummary?.result?.[0]
  if (!r) throw new Error(`quoteSummary 실패: ${ticker}`)

  const sd = r.summaryDetail ?? {}
  const ks = r.defaultKeyStatistics ?? {}
  const fd = r.financialData ?? {}
  const prof = r.assetProfile ?? {}
  const hold = r.majorHoldersBreakdown ?? {}
  const pr = r.price ?? {}

  const rev = series(ts, 'annualTotalRevenue')
  const gp = series(ts, 'annualGrossProfit')
  const oi = series(ts, 'annualOperatingIncome')
  const ni = series(ts, 'annualNetIncome')
  const eps = series(ts, 'annualDilutedEPS')
  const fcf = series(ts, 'annualFreeCashFlow')
  const debt = series(ts, 'annualTotalDebt')
  const eq = series(ts, 'annualStockholdersEquity')
  const ca = series(ts, 'annualCurrentAssets')
  const cl = series(ts, 'annualCurrentLiabilities')

  const price = raw(pr.regularMarketPrice) ?? raw(sd.regularMarketOpen)
  const hi = raw(sd.fiftyTwoWeekHigh)
  const lo = raw(sd.fiftyTwoWeekLow)
  const pos = price && hi && lo && hi > lo ? ((price - lo) / (hi - lo)) * 100 : null

  const cur = pr.currency ?? 'USD'
  const revL = last(rev)
  const netDebt = (last(debt) ?? 0) - (raw(fd.totalCash) ?? 0)

  const rec = (r.recommendationTrend?.trend ?? [])[0] ?? {}
  const grades = [
    `강력매수 ${rec.strongBuy ?? 0}`,
    `매수 ${rec.buy ?? 0}`,
    `보유 ${rec.hold ?? 0}`,
    `매도 ${(rec.sell ?? 0) + (rec.strongSell ?? 0)}`,
  ].join(' / ')

  const earnDate = r.calendarEvents?.earnings?.earningsDate?.[0]?.fmt ?? NA
  const summary = prof.longBusinessSummary?.slice(0, 300)?.trim()

  const L = []
  L.push(`# ${ticker} 핵심 데이터 — ${today}`)
  L.push('')
  if (pr.longName || pr.shortName) L.push(pr.longName ?? pr.shortName)
  if (summary) L.push(summary)
  L.push(`섹터: ${prof.sector ?? NA} / ${prof.industry ?? NA}`)
  L.push('')
  L.push('| 가격 | 값 | 밸류에이션 | 값 |')
  L.push('|---|---|---|---|')
  L.push(`| 현재가 | ${fx(price)} ${cur} | PER(t) | ${mult(raw(sd.trailingPE))} |`)
  L.push(`| 시가총액 | ${money(raw(sd.marketCap) ?? raw(pr.marketCap))} | PER(f) | ${mult(raw(sd.forwardPE))} |`)
  L.push(`| 52주 고/저 | ${fx(hi)} / ${fx(lo)} | PBR | ${mult(raw(ks.priceToBook))} |`)
  L.push(`| 52주 위치 | ${pos === null ? NA : pos.toFixed(0) + '%'} | PSR | ${mult(raw(ks.priceToSalesTrailing12Months) ?? raw(sd.priceToSalesTrailing12Months))} |`)
  L.push(`| 배당수익률 | ${pct(raw(sd.dividendYield))} | EV/EBITDA | ${mult(raw(ks.enterpriseToEbitda))} |`)
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
  L.push(`- 애널리스트: ${grades} · 목표가 ${fx(raw(fd.targetMeanPrice))} (${fd.numberOfAnalystOpinions?.raw ?? NA}명)`)
  L.push(`- 차기 실적 발표: ${earnDate}`)
  L.push('')
  L.push(`> 출처: Yahoo Finance, 조회일 ${today}. 값이 없으면 '${NA}'.`)

  return L.join('\n') + '\n'
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const ticker = req.query?.ticker || new URL(req.url, 'http://localhost').searchParams.get('ticker')
  if (!ticker) {
    return res.status(400).json({ error: 'ticker 파라미터가 필요합니다.' })
  }

  try {
    let coreData
    if (/^\d{6}$/.test(ticker)) {
      try {
        coreData = await buildCore(`${ticker}.KS`)
      } catch {
        coreData = await buildCore(`${ticker}.KQ`)
      }
    } else {
      coreData = await buildCore(ticker)
    }

    return res.status(200).json({ success: true, ticker, coreData })
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message })
  }
}
