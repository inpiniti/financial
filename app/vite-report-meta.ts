// 빌드/개발 타임에 docs/report 의 마크다운 헤더만 스캔해 메타데이터 매니페스트를
// 가상 모듈 `virtual:report-meta` 로 노출한다.
//
// 왜 필요한가: 대시보드/보고서 뷰는 카드 배지(투자의견·확신도·표결·종합의견)를 그리려고
// 예전엔 런타임에 모든 보고서 본문(수백 개 md 청크)을 fetch 했다 → 첫 화면이 흰 화면으로
// 수십 초. 헤더 메타는 파일 내용이 바뀌지 않는 한 고정이므로, 서버/빌드에서 미리 뽑아
// JS로 인라인해 두면 첫 화면에서 본문을 한 개도 받지 않아도 된다. 본문은 열람 시 lazy 로딩.
//
// 키 형식은 catalog.ts 의 `import.meta.glob('../../../docs/report/**/*.md')` 결과 키와
// 정확히 일치시킨다: `../../../docs/report/{date}/{author}/{file}.md`.

import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const VIRTUAL_ID = 'virtual:report-meta'
const RESOLVED_ID = '\0' + VIRTUAL_ID

const GLOB_PREFIX = '../../../docs/report/'

// meta.ts 의 파서와 동일한 정규식 (헤더 포맷은 고정 — 얇은 복제로 config↔src 결합을 피한다).
const VERDICT_RE = /투자의견:\s*(매수|보유|매도|관망)/
const CONFIDENCE_RE = /확신도:\s*(\d+)\s*\/\s*10/
const FINAL_VERDICT_RE = /종합\s*의견:\s*([^|\n]+)/
const TALLY_LINE_RE = /표결:\s*([^\n]+)/
const TALLY_PAIR_RE = /(매수|보유|매도|관망)\s*(\d+)/g

export interface ReportMetaEntry {
  verdict?: string | null
  confidence?: number | null
  finalVerdict?: string | null
  tally?: { 매수: number; 보유: number; 매도: number; 관망: number } | null
}

function parseGuru(raw: string): ReportMetaEntry {
  const vm = raw.match(VERDICT_RE)
  const cm = raw.match(CONFIDENCE_RE)
  let confidence: number | null = null
  if (cm) {
    const n = Number.parseInt(cm[1], 10)
    confidence = Number.isFinite(n) && n >= 1 && n <= 10 ? n : null
  }
  return { verdict: (vm?.[1] as string | undefined) ?? null, confidence }
}

function parseFinal(raw: string): ReportMetaEntry {
  let finalVerdict: string | null = null
  const fv = raw.match(FINAL_VERDICT_RE)
  if (fv) {
    const cleaned = fv[1].replace(/\*/g, '').trim()
    finalVerdict = cleaned.length > 0 ? cleaned : null
  }
  let tally: ReportMetaEntry['tally'] = null
  const tl = raw.match(TALLY_LINE_RE)
  if (tl) {
    const counts = { 매수: 0, 보유: 0, 매도: 0, 관망: 0 }
    let matched = false
    for (const m of tl[1].matchAll(TALLY_PAIR_RE)) {
      const n = Number.parseInt(m[2], 10)
      if (Number.isFinite(n)) {
        counts[m[1] as keyof typeof counts] = n
        matched = true
      }
    }
    if (matched) tally = counts
  }
  return { finalVerdict, tally }
}

/** report 루트를 재귀 스캔해 헤더 메타만 뽑는다. 키 = glob 키와 동일한 상대경로. */
function scan(reportRoot: string): Record<string, ReportMetaEntry> {
  const meta: Record<string, ReportMetaEntry> = {}
  if (!fs.existsSync(reportRoot)) return meta

  // {date}/{author}/{file}.md 만 대상. 그 외 깊이는 무시.
  for (const date of fs.readdirSync(reportRoot)) {
    const dateDir = path.join(reportRoot, date)
    if (!fs.statSync(dateDir).isDirectory()) continue

    for (const author of fs.readdirSync(dateDir)) {
      const authorDir = path.join(dateDir, author)
      if (!fs.statSync(authorDir).isDirectory()) continue

      for (const file of fs.readdirSync(authorDir)) {
        if (!file.toLowerCase().endsWith('.md')) continue

        // 메타가 필요한 파일만 읽는다: 거장 본문 + 최종보고서.
        const base = file.replace(/\.md$/i, '')
        let entry: ReportMetaEntry | null = null
        if (author === '_data' || author === '포트폴리오') {
          entry = null
        } else if (author === '최종') {
          if (base.endsWith('_최종보고서')) {
            entry = parseFinal(fs.readFileSync(path.join(authorDir, file), 'utf8'))
          }
        } else {
          entry = parseGuru(fs.readFileSync(path.join(authorDir, file), 'utf8'))
        }

        if (entry) {
          const key = `${GLOB_PREFIX}${date}/${author}/${file}`
          meta[key] = entry
        }
      }
    }
  }

  return meta
}

/** docs/report 의 보고서 헤더 메타를 가상 모듈로 제공하는 플러그인. */
export function reportMetaPlugin(): Plugin {
  // 플러그인 파일(app/) 기준 ../docs/report = 저장소의 docs/report.
  const reportRoot = path.resolve(import.meta.dirname, '../docs/report')
  let cache: string | null = null

  const build = () => {
    if (cache === null) {
      cache = `export const reportMeta = ${JSON.stringify(scan(reportRoot))}\n`
    }
    return cache
  }

  return {
    name: 'report-meta',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id === RESOLVED_ID) return build()
    },
    configureServer(server) {
      // 개발 중 보고서 md가 바뀌면 매니페스트를 무효화하고 전체 리로드.
      server.watcher.add(reportRoot)
      const onChange = (file: string) => {
        if (!file.replace(/\\/g, '/').includes('/docs/report/') || !file.endsWith('.md')) return
        cache = null
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', onChange)
      server.watcher.on('change', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}
