// Configuration for Vercel Serverless Function (increase timeout to 60 seconds)
export const config = { maxDuration: 60 };

/**
 * Vercel Serverless Function: /api/guru/vote
 * vite-guru-plugin.ts와 동기화된 최적화 버전
 */
const REMOTE_GEMINI_ENDPOINT =
  process.env.GEMINI_API_ENDPOINT || 'https://simulation-inpiniti.vercel.app/api/simple/gemini'

const GURU_COLUMNS = [
  { col: 'g1', key: '그레이엄' },
  { col: 'g2', key: '클라먼' },
  { col: 'g3', key: '파브라이' },
  { col: 'g4', key: '그린블라트' },
  { col: 'g5', key: '코스톨라니' },
  { col: 'g6', key: '슈웨거' },
  { col: 'g7', key: '버핏' },
  { col: 'g8', key: '피셔' },
  { col: 'g9', key: '뉴욕주민' },
  { col: 'g10', key: '린치' },
  { col: 'g11', key: '다모다란' },
  { col: 'g12', key: '템플턴' },
  { col: 'g13', key: '버리' },
]

const SCORE = { 매수: 0, 보유: 1, 관망: 2, 매도: 3 }
const SCORE_LABEL = ['매수', '보유', '관망', '매도']
const VOTE_LINE = /인물:\s*([^|]+?)\s*\|\s*의견:\s*(매수|보유|관망|매도)/g

function parseVotes(text) {
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

function synthesize(scores) {
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

/** 13인 판정 경량 최적화 시스템 프롬프트 (Vercel 타임아웃 방지용) */
const SYSTEM_INSTRUCTION = `너는 13인의 투자 거장 관점에서 매수/보유/관망/매도를 판정하는 전문 에이전트다.
13인 명단 및 핵심 기준:
1. 워런 버핏: 지속 해자, ROE, 영업이익률, 튼튼한 재무, 현금흐름
2. 필립 피셔: 성장 잠재력, R&D 역량, 신제품 개발 의지
3. 피터 린치: 6유형 분류(고성장/대형우량/회생/경기순환/자산/저성장), 이익모멘텀, PEG
4. 세스 클라먼: 철저한 안전마진, 하방 위험 보호, 밸류에이션 매력
5. 모니시 파브라이: 단도 투자(저위험 고수익), 극단적 저평가, FCF
6. 존 템플턴: 비관론 속 역발상 바겐헌팅, 52주 신저가/낙폭과대, 배당
7. 마이클 버리: 숨은 부실 및 회계 위험 검증, 데이터 불확실 시 관망
8. 앙드레 코스톨라니: 코스톨라니 달걀 모형 국면(과매도 탈출 등), 소신파 관점
9. 뉴욕주민: 어닝스 모멘텀(실적 서프라이즈), 월가 트레이딩 펀더멘털
10. 애스워스 다모다란: 현재 주가에 내포된 기대치 역산, 내재가치 대비 안전마진
11. 조엘 그린블라트: 마법공식(자본수익률 ROC/ROE + 이익수익률 EV/EBITDA 등)
12. 벤저민 그레이엄: 담배꽁초 정통 가치투자, PBR, 유동비율, 청산가치 안전마진
13. 잭 슈웨거: 마켓 위저드(추세 추종, 모멘텀, 손익비와 손절가 설정 가능 여부)

[절대 규칙]
1. 제공된 핵심 데이터만을 근거로 각 거장의 잣대에 따라 독립적으로 판정하라.
2. 의견은 반드시 '매수', '보유', '관망', '매도' 4가지 중 하나여야 한다.
3. 데이터에 '확인 불가' 항목이 많으면 그 불확실성을 관망이나 보수적 의견에 반영하라.
4. 출력은 정확히 13줄이어야 하며, 머리말/꼬리말/번호/빈 줄을 절대 포함하지 마라.

[출력 형식 (반드시 이 형식으로 13줄)]
인물: {인물명} | 의견: {매수|보유|관망|매도} | 확신도: {1~10} | 근거: {40자 이내}`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST method only' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { ticker, date = new Date().toISOString().slice(0, 10), coreData, nation = 'us', name = '' } = body

    if (!ticker || !coreData) {
      return res.status(400).json({ error: 'ticker and coreData are required' })
    }

    const userPrompt = `티커: ${ticker}\n날짜: ${date}\n핵심 데이터:\n${coreData}`
    const geminiRes = await fetch(REMOTE_GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.2,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '')
      throw new Error(`Gemini 오류 (${geminiRes.status}): ${errText.slice(0, 200)}`)
    }

    const verdictText = await geminiRes.text()
    const { scores, unknown } = parseVotes(verdictText)
    const g0 = synthesize(scores)
    const overall = typeof g0 === 'number' ? SCORE_LABEL[g0] : null

    const tally = { 매수: 0, 보유: 0, 관망: 0, 매도: 0 }
    for (const v of Object.values(scores)) {
      if (v === 0) tally.매수++
      else if (v === 1) tally.보유++
      else if (v === 2) tally.관망++
      else if (v === 3) tally.매도++
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const patch = {
        d: date,
        ticker,
        name: name || ticker,
        nation,
        ...scores,
        g0,
        updated_at: new Date().toISOString(),
      }

      await fetch(`${supabaseUrl}/rest/v1/guru_votes?on_conflict=d,ticker`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify([patch]),
      }).catch((e) => console.warn('Supabase save error:', e))
    }

    return res.status(200).json({
      success: true,
      ticker,
      date,
      g0,
      overall,
      tally,
      scores,
      unknown,
      verdictText,
    })
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message })
  }
}
