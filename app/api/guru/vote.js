// Configuration for Vercel Serverless Function (increase timeout to 60 seconds)
export const config = { maxDuration: 60 }

/**
 * Vercel Serverless Function: /api/guru/vote
 *
 * 모드 A (Supabase 저장 전용): { ticker, date, name, nation, scores, saveOnly: true }
 * 모드 B (단일 거장 판정):      { ticker, date, coreData, nation, name, guruIndex: 0~12 }
 * 모드 C (하위 호환 배치):      { ticker, date, coreData, nation, name }  ← 타임아웃 위험
 */

const REMOTE_GEMINI_ENDPOINT =
  process.env.GEMINI_API_ENDPOINT || 'https://simulation-inpiniti.vercel.app/api/simple/gemini'

const GURU_COLUMNS = [
  { col: 'g1',  key: '그레이엄',   name: '벤저민 그레이엄',   desc: '담배꽁초 정통 가치투자: PBR·유동비율·청산가치·안전마진' },
  { col: 'g2',  key: '클라먼',     name: '세스 클라먼',       desc: '철저한 안전마진, 하방 위험 보호, 밸류에이션 매력' },
  { col: 'g3',  key: '파브라이',   name: '모니시 파브라이',   desc: '단도 투자(저위험 고수익), 극단적 저평가, FCF' },
  { col: 'g4',  key: '그린블라트', name: '조엘 그린블라트',   desc: '마법공식: 자본수익률(ROC/ROE) + 이익수익률(EV/EBITDA)' },
  { col: 'g5',  key: '코스톨라니', name: '앙드레 코스톨라니', desc: '코스톨라니 달걀 모형 국면(과매도 탈출 등), 소신파 관점' },
  { col: 'g6',  key: '슈웨거',     name: '잭 슈웨거',         desc: '마켓 위저드: 추세 추종, 모멘텀, 손익비와 손절가 설정 가능 여부' },
  { col: 'g7',  key: '버핏',       name: '워런 버핏',         desc: '지속 해자·ROE·영업이익률·튼튼한 재무·현금흐름' },
  { col: 'g8',  key: '피셔',       name: '필립 피셔',         desc: '성장 잠재력, R&D 역량, 신제품 개발 의지' },
  { col: 'g9',  key: '뉴욕주민',   name: '뉴욕주민',          desc: '어닝스 모멘텀(실적 서프라이즈), 월가 트레이딩 펀더멘털' },
  { col: 'g10', key: '린치',       name: '피터 린치',         desc: '6유형 분류(고성장/대형우량/회생/경기순환/자산/저성장), PEG' },
  { col: 'g11', key: '다모다란',   name: '애스워스 다모다란', desc: '현재 주가에 내포된 기대치 역산, 내재가치 대비 안전마진' },
  { col: 'g12', key: '템플턴',     name: '존 템플턴',         desc: '비관론 속 역발상 바겐헌팅, 52주 신저가/낙폭과대, 배당' },
  { col: 'g13', key: '버리',       name: '마이클 버리',       desc: '숨은 부실 및 회계 위험 검증, 데이터 불확실 시 관망' },
]

const SCORE = { 매수: 0, 보유: 1, 관망: 2, 매도: 3 }
const SCORE_LABEL = ['매수', '보유', '관망', '매도']
const VOTE_LINE = /인물:\s*([^|]+?)\s*\|\s*의견:\s*(매수|보유|관망|매도)/

function buildSystemInstruction(guru) {
  return `너는 ${guru.name}의 관점에서 주식 한 종목을 분석하는 전문 에이전트다.
핵심 기준: ${guru.desc}

[절대 규칙]
1. 제공된 핵심 데이터만을 근거로 ${guru.name}의 잣대에 따라 독립적으로 판정하라.
2. 의견은 반드시 '매수', '보유', '관망', '매도' 4가지 중 하나여야 한다.
3. 데이터에 '확인 불가' 항목이 많으면 그 불확실성을 관망이나 보수적 의견에 반영하라.
4. 출력은 정확히 1줄이어야 하며, 머리말/꼬리말/번호/빈 줄을 절대 포함하지 마라.

[출력 형식 (정확히 이 형식으로 1줄)]
인물: ${guru.name} | 의견: {매수|보유|관망|매도} | 확신도: {1~10} | 근거: {40자 이내}`
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

async function saveToSupabase({ ticker, date, name, nation, scores, g0 }) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST method only' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const {
      ticker,
      date = new Date().toISOString().slice(0, 10),
      coreData,
      nation = 'us',
      name = '',
      guruIndex,
      scores: accScores,
      saveOnly,
    } = body

    // ── 모드 A: Supabase 저장 전용 ──
    if (saveOnly && accScores) {
      const g0 = synthesize(accScores)
      await saveToSupabase({ ticker, date, name, nation, scores: accScores, g0 })
      return res.status(200).json({ success: true, saved: true, g0 })
    }

    if (!ticker || !coreData) {
      return res.status(400).json({ error: 'ticker and coreData are required' })
    }

    // ── 모드 B: 단일 거장 판정 (guruIndex 0~12) ──
    if (typeof guruIndex === 'number') {
      const guru = GURU_COLUMNS[guruIndex]
      if (!guru) return res.status(400).json({ error: `Invalid guruIndex: ${guruIndex}` })

      const systemInstruction = buildSystemInstruction(guru)
      const userPrompt = `티커: ${ticker}\n날짜: ${date}\n핵심 데이터:\n${coreData}`

      const geminiRes = await fetch(REMOTE_GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            maxOutputTokens: 128,
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
      const m = verdictText.match(VOTE_LINE)
      const score = m ? SCORE[m[2]] : null

      return res.status(200).json({
        success: true,
        ticker,
        guruIndex,
        col: guru.col,
        score,
        opinion: typeof score === 'number' ? SCORE_LABEL[score] : null,
        verdictText,
      })
    }

    // ── 모드 C: 하위 호환 - 전체 13인 배치 (deprecated, 타임아웃 위험) ──
    const SYSTEM_BATCH = `너는 13인의 투자 거장 관점에서 매수/보유/관망/매도를 판정하는 전문 에이전트다.
${GURU_COLUMNS.map((g, i) => `${i + 1}. ${g.name}: ${g.desc}`).join('\n')}
[절대 규칙] 출력은 정확히 13줄. 형식: 인물: {인물명} | 의견: {매수|보유|관망|매도} | 확신도: {1~10} | 근거: {40자 이내}`

    const batchRes = await fetch(REMOTE_GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `티커: ${ticker}\n날짜: ${date}\n핵심 데이터:\n${coreData}` }] }],
        systemInstruction: { parts: [{ text: SYSTEM_BATCH }] },
        generationConfig: { maxOutputTokens: 1024, temperature: 0.2, thinkingConfig: { thinkingBudget: 0 } },
      }),
    })

    if (!batchRes.ok) {
      const errText = await batchRes.text().catch(() => '')
      throw new Error(`Gemini 오류 (${batchRes.status}): ${errText.slice(0, 200)}`)
    }

    const verdictText = await batchRes.text()
    const scores = {}
    for (const m of verdictText.matchAll(/인물:\s*([^|]+?)\s*\|\s*의견:\s*(매수|보유|관망|매도)/g)) {
      const hit = GURU_COLUMNS.find((g) => m[1].replace(/\s/g, '').includes(g.key))
      if (hit) scores[hit.col] = SCORE[m[2]]
    }
    const g0 = synthesize(scores)
    const overall = typeof g0 === 'number' ? SCORE_LABEL[g0] : null
    const tally = { 매수: 0, 보유: 0, 관망: 0, 매도: 0 }
    for (const v of Object.values(scores)) {
      if (v === 0) tally.매수++
      else if (v === 1) tally.보유++
      else if (v === 2) tally.관망++
      else if (v === 3) tally.매도++
    }
    await saveToSupabase({ ticker, date, name, nation, scores, g0 })
    return res.status(200).json({ success: true, ticker, date, g0, overall, tally, scores, verdictText })
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message })
  }
}
