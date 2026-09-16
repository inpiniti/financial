import type { Plugin } from 'vite'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import dotenv from 'dotenv'

// 루트 .env 및 app/.env 로드
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

dotenv.config({ path: path.join(rootDir, '.env') })
dotenv.config({ path: path.join(__dirname, '.env') })

// guru-core 및 guru-db 모듈 동적 임포트용 경로 (Windows 호환 file:// URL)
const GURU_CORE_PATH = path.join(rootDir, 'scripts', 'guru-core.mjs')
const GURU_DB_PATH = path.join(rootDir, 'scripts', 'guru-db.mjs')

/** 13인 판정 경량 최적화 시스템 프롬프트 (Vercel 타임아웃 방지용) */
const COMPACT_SYSTEM_PROMPT = `너는 13인의 투자 거장 관점에서 매수/보유/관망/매도를 판정하는 전문 에이전트다.
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

function getSystemPrompt(): string {
  return COMPACT_SYSTEM_PROMPT
}

const REMOTE_GEMINI_ENDPOINT =
  process.env.GEMINI_API_ENDPOINT || 'https://simulation-inpiniti.vercel.app/api/simple/gemini'

async function callGemini(contents: any[], systemInstruction?: string, retries = 2): Promise<string> {
  let lastErr: Error | null = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 35000)

    try {
      const res = await fetch(REMOTE_GEMINI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`원격 Gemini API 오류 (${res.status}): ${errText.slice(0, 300)}`)
      }

      const text = await res.text()
      if (!text.trim()) {
        throw new Error('원격 Gemini API에서 빈 응답을 받았습니다.')
      }
      return text
    } catch (e: any) {
      lastErr = e
      console.warn(`[GuruPlugin] Gemini call attempt ${attempt} failed: ${e.message}`)
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500))
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastErr || new Error('Gemini API 호출에 실패했습니다.')
}

export function guruPlugin(): Plugin {
  return {
    name: 'vite-plugin-guru-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || req.originalUrl || ''
        let pathname = ''
        let searchParams = new URLSearchParams()

        try {
          const parsed = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`)
          pathname = parsed.pathname
          searchParams = parsed.searchParams
        } catch {
          pathname = rawUrl.split('?')[0]
        }

        // 1. 수집 API: /api/guru/collect
        if (pathname === '/api/guru/collect') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
          res.setHeader('Content-Type', 'application/json; charset=utf-8')

          if (req.method === 'OPTIONS') {
            res.statusCode = 200
            res.end()
            return
          }

          try {
            const ticker = searchParams.get('ticker')?.trim()

            if (!ticker) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'ticker 파라미터가 필요합니다.' }))
              return
            }

            // Windows 호환 file:// URL로 dynamic import
            const { buildCore } = await import(pathToFileURL(GURU_CORE_PATH).href)
            let coreData: string

            if (/^\d{6}$/.test(ticker)) {
              try {
                coreData = await buildCore(`${ticker}.KS`)
              } catch {
                coreData = await buildCore(`${ticker}.KQ`)
              }
            } else {
              coreData = await buildCore(ticker)
            }

            res.statusCode = 200
            res.end(JSON.stringify({ success: true, ticker, coreData }))
          } catch (e: any) {
            console.error('[GuruPlugin] Collect error:', e)
            res.statusCode = 500
            res.end(JSON.stringify({ success: false, error: e.message }))
          }
          return
        }

        // 2. 판정 및 DB 저장 API: /api/guru/vote
        if (pathname === '/api/guru/vote') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.setHeader('Content-Type', 'application/json; charset=utf-8')

          if (req.method === 'OPTIONS') {
            res.statusCode = 200
            res.end()
            return
          }

          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end(JSON.stringify({ error: 'POST 요청만 지원합니다.' }))
            return
          }

          try {
            const chunks: Buffer[] = []
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
            }
            const bodyStr = Buffer.concat(chunks).toString('utf8')
            const body = JSON.parse(bodyStr)

            const { ticker, date = new Date().toISOString().slice(0, 10), coreData, nation = 'us', name = '' } = body

            if (!ticker || !coreData) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'ticker 및 coreData가 필요합니다.' }))
              return
            }

            // 1) Gemini 판정 호출
            const systemPrompt = getSystemPrompt()
            const userPrompt = `티커: ${ticker}\n날짜: ${date}\n핵심 데이터:\n${coreData}`

            const promptContents = [{ role: 'user', parts: [{ text: userPrompt }] }]
            const verdictText = await callGemini(promptContents, systemPrompt)

            // 2) 표결 파싱 및 종합 계산 (Windows 호환 file:// URL)
            const { parseVotes, synthesize } = await import(pathToFileURL(GURU_DB_PATH).href)
            const SCORE_LABEL = ['매수', '보유', '관망', '매도']
            const { scores, unknown } = parseVotes(verdictText)
            const g0 = synthesize(scores)
            const overall = typeof g0 === 'number' ? (SCORE_LABEL[g0] ?? null) : null

            const tally = { 매수: 0, 보유: 0, 관망: 0, 매도: 0 }
            for (const v of Object.values(scores)) {
              if (v === 0) tally.매수++
              else if (v === 1) tally.보유++
              else if (v === 2) tally.관망++
              else if (v === 3) tally.매도++
            }

            // 3) Supabase DB 저장
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

              const dbRes = await fetch(`${supabaseUrl}/rest/v1/guru_votes?on_conflict=d,ticker`, {
                method: 'POST',
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  Prefer: 'resolution=merge-duplicates,return=minimal',
                },
                body: JSON.stringify([patch]),
              })

              if (!dbRes.ok) {
                const errBody = await dbRes.text().catch(() => '')
                console.warn('[GuruPlugin] Supabase save error:', dbRes.status, errBody)
              }
            }

            res.statusCode = 200
            res.end(
              JSON.stringify({
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
            )
          } catch (e: any) {
            console.error('[GuruPlugin] Vote error:', e)
            res.statusCode = 500
            res.end(JSON.stringify({ success: false, error: e.message }))
          }
          return
        }

        // 3. /api/simple/gemini 프록시 요청 (필요 시 직접 프록시 처리)
        if (pathname === '/api/simple/gemini') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

          if (req.method === 'OPTIONS') {
            res.statusCode = 200
            res.end()
            return
          }

          try {
            const chunks: Buffer[] = []
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
            }
            const bodyStr = Buffer.concat(chunks).toString('utf8')

            const geminiRes = await fetch(REMOTE_GEMINI_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: bodyStr,
            })

            res.statusCode = geminiRes.status
            res.setHeader('Content-Type', geminiRes.headers.get('Content-Type') || 'text/plain; charset=utf-8')
            const streamText = await geminiRes.text()
            res.end(streamText)
          } catch (e: any) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: e.message }))
          }
          return
        }

        // 그 외 요청은 다음 미들웨어(Vite)로 전달
        next()
      })
    },
  }
}
