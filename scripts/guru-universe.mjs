// 종합 스크리너(토스 프리셋 14종)에서 오늘의 대상 티커 유니버스를 뽑는다.
//
// 왜 스크립트인가: 이건 판단이 아니라 규칙 적용이다. LLM을 태울 이유가 없다.
// 백엔드는 '0단계(기본 필터)' 결과만 주고, 1~5단계 조건 강화는 프런트가 하던 일이라
// 그 규칙(SCREENER_RULES)을 여기에 옮겨 왔다. 프런트와 값이 갈리면 안 되므로
// app/src/components/screener-data-table.tsx 의 규칙을 바꾸면 여기도 같이 바꿔야 한다.
//
// 사용법:
//   node scripts/guru-universe.mjs                     # 해외, 피셔만 5단계, 나머지 0단계
//   node scripts/guru-universe.mjs --nation kr
//   node scripts/guru-universe.mjs --step 피셔=5,버리=3
//   node scripts/guru-universe.mjs --json              # 티커 배열만 JSON으로

const API = process.env.SCREENER_API ?? 'https://younginpiniti-bitcoin-ai-backend.hf.space'

// 스크리너 키 순서 = DB 컬럼 번호. 0 = 공통(종합), 1~13 = 거장.
export const SCREENER_KEYS = [
  '공통', '그레이엄', '클라먼', '파브라이', '그린블라트', '코스톨라니', '슈웨거',
  '버핏', '피셔', '뉴욕주민', '린치', '다모다란', '템플턴', '버리',
]

// 조건 강화 규칙 — 프런트 SCREENER_RULES의 이식본. 지표 값이 없으면 통과(프런트와 동일).
const RULES = {
  '피셔': {
    1: [['연평균 매출액 증감률','min',0.22],['영업이익률','min',0.11],['연평균 순이익 증감률','min',0.11],['부채비율','max',1.8]],
    2: [['연평균 매출액 증감률','min',0.25],['영업이익률','min',0.12],['연평균 순이익 증감률','min',0.12],['부채비율','max',1.6]],
    3: [['연평균 매출액 증감률','min',0.28],['영업이익률','min',0.13],['연평균 순이익 증감률','min',0.13],['부채비율','max',1.4]],
    4: [['연평균 매출액 증감률','min',0.30],['영업이익률','min',0.14],['연평균 순이익 증감률','min',0.14],['부채비율','max',1.2]],
    5: [['연평균 매출액 증감률','min',0.35],['영업이익률','min',0.15],['연평균 순이익 증감률','min',0.15],['부채비율','max',1.0]],
  },
  '버리': {
    1: [['PBR','range',[0,0.9]],['EV/EBITDA','range',[0,9]],['부채비율','max',1.8]],
    2: [['PBR','range',[0,0.8]],['EV/EBITDA','range',[0,8]],['부채비율','max',1.6]],
    3: [['PBR','range',[0,0.7]],['EV/EBITDA','range',[0,7]],['부채비율','max',1.4]],
    4: [['PBR','range',[0,0.6]],['EV/EBITDA','range',[0,6]],['부채비율','max',1.2]],
    5: [['PBR','range',[0,0.5]],['EV/EBITDA','range',[0,5]],['부채비율','max',1.0]],
  },
}

function passes(stock, [metric, op, value]) {
  const raw = stock[metric]
  if (raw === undefined || raw === null) return true
  const v = typeof raw === 'number' ? raw : Number.parseFloat(String(raw))
  if (Number.isNaN(v)) return true
  if (op === 'min') return v >= value
  if (op === 'max') return v <= value
  if (op === 'range') return v >= value[0] && v <= value[1]
  return true
}

function tighten(stocks, key, step) {
  if (!step) return stocks
  const rules = RULES[key]?.[step]
  if (!rules?.length) return stocks
  return stocks.filter((s) => rules.every((r) => passes(s, r)))
}

async function fetchPicks(key, nation) {
  const url = `${API}/toss/${encodeURIComponent(key)}?nation=${nation}&size=200`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${key}: HTTP ${res.status}`)
  return res.json()
}

export async function buildUniverse({ nation = 'us', steps = { '피셔': 5 } } = {}) {
  const perScreener = {}
  const universe = new Map() // ticker → { ticker, name, screeners: [] }

  for (const key of SCREENER_KEYS) {
    const data = await fetchPicks(key, nation)
    const kept = tighten(data.stocks ?? [], key, steps[key] ?? 0)
    perScreener[key] = { raw: (data.stocks ?? []).length, kept: kept.length, step: steps[key] ?? 0 }
    for (const s of kept) {
      let e = universe.get(s.ticker)
      if (!e) {
        e = { ticker: s.ticker, name: s.name ?? s.ticker, screeners: [] }
        universe.set(s.ticker, e)
      }
      e.screeners.push(key)
    }
  }

  const tickers = [...universe.values()].sort((a, b) => a.ticker.localeCompare(b.ticker))
  return { nation, perScreener, tickers }
}

function parseSteps(arg) {
  const steps = {}
  for (const pair of arg.split(',')) {
    const [k, v] = pair.split('=')
    if (k && v) steps[k.trim()] = Number.parseInt(v, 10)
  }
  return steps
}

if (process.argv[1]?.endsWith('guru-universe.mjs')) {
  const args = process.argv.slice(2)
  const get = (flag, fallback) => {
    const i = args.indexOf(flag)
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback
  }
  const nation = get('--nation', 'us')
  const steps = args.includes('--step') ? parseSteps(get('--step', '')) : { '피셔': 5 }

  const { perScreener, tickers } = await buildUniverse({ nation, steps })

  if (args.includes('--json')) {
    console.log(JSON.stringify(tickers.map((t) => t.ticker)))
  } else {
    for (const [k, v] of Object.entries(perScreener)) {
      const stepNote = v.step ? ` (${v.step}단계 → ${v.kept})` : ''
      console.log(`${k.padEnd(12)} ${String(v.raw).padStart(4)}${stepNote}`)
    }
    console.log(`\n중복 제거 유니버스: ${tickers.length}종목`)
    console.log(tickers.map((t) => t.ticker).join(' '))
  }
}
