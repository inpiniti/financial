import type { Plugin } from 'vite'
import fs from 'node:fs'
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
const GURU_VOTE_AGENT_PATH = path.join(rootDir, '.claude', 'agents', 'guru-vote-all.md')

/** 13인 판정 시스템 프롬프트 캐시 */
let systemPromptCache: string | null = null
function getSystemPrompt(): string {
  if (systemPromptCache) return systemPromptCache
  try {
    const raw = fs.readFileSync(GURU_VOTE_AGENT_PATH, 'utf8')
    // frontmatter 제거
    systemPromptCache = raw.replace(/^---[\s\S]*?---\s*/, '')
  } catch (e) {
    console.error('[GuruPlugin] Failed to read guru-vote-all.md:', e)
    systemPromptCache = '너는 13인의 투자 거장 관점에서 매수/보유/관망/매도를 판정한다.'
  }
  return systemPromptCache
}

const REMOTE_GEMINI_ENDPOINT =
  process.env.GEMINI_API_ENDPOINT || 'https://simulation-inpiniti.vercel.app/api/simple/gemini'

async function callGemini(contents: any[], systemInstruction?: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000) // 60초 타임아웃

  try {
    const res = await fetch(REMOTE_GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.2,
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
    if (e.name === 'AbortError') {
      throw new Error('Gemini API 호출 시간 초과 (60초 초과)')
    }
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
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
            const { parseVotes, synthesize, SCORE_LABEL } = await import(pathToFileURL(GURU_DB_PATH).href)
            const { scores, unknown } = parseVotes(verdictText)
            const g0 = synthesize(scores)
            const overall = typeof g0 === 'number' ? (SCORE_LABEL?.[g0] ?? null) : null

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
