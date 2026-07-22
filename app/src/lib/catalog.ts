// 보고서 카탈로그 계층 (설계 4-1절).
//
// 깊은 모듈: 화면은 `loadCatalog()` 또는 순수 `buildCatalog()`만 쓰고,
// glob 연결·경로 파싱·헤더 로딩 전략 같은 내부는 감춘다.
//
// 테스트 가능성의 핵심: 경로 목록 → 카탈로그 변환은 glob과 분리된
// 순수(하지만 async) 함수 `buildCatalog(paths, loadRaw, names)`로 두고,
// 실제 glob 연결은 얇은 어댑터 `loadCatalog()`가 감싼다.

import { parseFinalMeta, parseGuruMeta, parseTickerMap, type Tally, type Verdict } from './meta'

export type { Verdict, Tally } from './meta'

/** 경로 → 헤더 메타(빌드 타임 매니페스트). 있으면 본문을 읽지 않고 메타를 채운다. */
export type ReportMetaMap = Record<
  string,
  {
    verdict?: Verdict | null
    confidence?: number | null
    finalVerdict?: string | null
    tally?: Tally | null
  }
>

/** 열람 시점에 본문(raw markdown)을 로딩하는 lazy 로더. */
export type RawLoader = () => Promise<string>

export interface GuruReport {
  guru: string // 표시명 (폴더명의 '-' → ' ')
  folder: string // 원본 폴더명 (경로 복원용)
  verdict: Verdict | null
  confidence: number | null
  load: RawLoader // 거장 보고서 본문
}

export interface TickerReport {
  date: string // '2026-07-10'
  ticker: string // '005930'
  name: string // interest ticker 매핑, 없으면 ticker 그대로
  gurus: GuruReport[] // 거장 보고서들 (표시명 정렬)
  data?: RawLoader // _data/{ticker}.md
  valueDrivers?: RawLoader // _data/{ticker}_VALUE_DRIVERS.md (신규)
  summary?: RawLoader // _data/{ticker}_요약.md (13인 요약, 상세 화면에서만 노출)
  final?: RawLoader // 최종/{ticker}_최종보고서.md
  debate?: RawLoader // 최종/{ticker}_토론.md
  status: 'final' | 'in-progress' // 최종보고서 존재 여부
  tally?: Tally // 최종 헤더의 표결
  finalVerdict?: string // 최종 헤더의 종합 의견 원문
}

export type ReportCatalog = Map<string, TickerReport[]>

// ── 경로 파싱 ────────────────────────────────────────────────────────────

type ParsedPath =
  | { kind: 'guru'; date: string; ticker: string; folder: string; path: string }
  | { kind: 'data'; date: string; ticker: string; path: string }
  | { kind: 'value-drivers'; date: string; ticker: string; path: string }
  | { kind: 'summary'; date: string; ticker: string; path: string }
  | { kind: 'final'; date: string; ticker: string; path: string }
  | { kind: 'debate'; date: string; ticker: string; path: string }
  | null

/**
 * `…/docs/report/{date}/{author}/{file}.md` 경로를 파싱한다.
 * glob 키의 `../` 접두 깊이에 무관하도록 'report' 세그먼트를 기준으로 찾는다.
 * 형식에 맞지 않으면 null.
 */
function parseReportPath(rawPath: string): ParsedPath {
  const parts = rawPath.replace(/\\/g, '/').split('/')
  const reportIdx = parts.lastIndexOf('report')
  if (reportIdx < 0) return null

  const date = parts[reportIdx + 1]
  const author = parts[reportIdx + 2]
  const file = parts[reportIdx + 3]
  if (!date || !author || !file) return null

  const base = file.replace(/\.md$/i, '')

  if (author === '_data') {
    if (base.endsWith('_VALUE_DRIVERS')) {
      const ticker = base.slice(0, -'_VALUE_DRIVERS'.length)
      return { kind: 'value-drivers', date, ticker, path: rawPath }
    }
    if (base.endsWith('_요약')) {
      const ticker = base.slice(0, -'_요약'.length)
      return { kind: 'summary', date, ticker, path: rawPath }
    }
    return { kind: 'data', date, ticker: base, path: rawPath }
  }

  if (author === '최종') {
    // {ticker}_최종보고서 | {ticker}_토론
    const usIdx = base.indexOf('_')
    if (usIdx < 0) return null
    const ticker = base.slice(0, usIdx)
    const suffix = base.slice(usIdx + 1)
    if (suffix === '최종보고서') return { kind: 'final', date, ticker, path: rawPath }
    if (suffix === '토론') return { kind: 'debate', date, ticker, path: rawPath }
    return null
  }

  // 포트폴리오 조언 문서는 거장 보고서가 아니다 — advice.ts가 별도로 다룬다.
  if (author === '포트폴리오') return null

  // 그 외 = 거장 폴더 (폴더명 = 거장, 파일명 = ticker)
  return { kind: 'guru', date, ticker: base, folder: author, path: rawPath }
}

// ── 카탈로그 빌드 (순수 · glob 비의존) ──────────────────────────────────

interface TickerAccumulator {
  date: string
  ticker: string
  gurus: { folder: string; path: string }[]
  dataPath?: string
  valueDriversPath?: string
  summaryPath?: string
  finalPath?: string
  debatePath?: string
}

/**
 * 경로 배열 → ReportCatalog. glob에 의존하지 않는 순수(async) 함수.
 *
 * @param paths     보고서 md 경로 목록
 * @param loadRaw   경로 → 본문 raw markdown 로더 (헤더 메타 추출 및 lazy 본문 로딩에 사용)
 * @param names     ticker → 한글명 매핑 (interest ticker.md, 없으면 ticker 그대로)
 * @param metaByPath 경로 → 헤더 메타 매니페스트. 주면 본문을 읽지 않고 이 값으로 메타를 채운다
 *                   (첫 화면에서 수백 개 본문 fetch를 없애는 핵심). 없으면 loadRaw로 본문을 읽어 파싱.
 *
 * 대시보드가 표결·의견 배지를 보여줘야 하므로 헤더 메타(verdict·confidence·tally·finalVerdict)가
 * 필요하다. 빌드 타임 매니페스트가 있으면 그걸 쓰고, 없을 때만(예: 테스트) 본문을 읽는다.
 * 데이터팩·토론은 메타가 없으므로 로딩하지 않고 lazy 로더만 노출한다.
 */
export async function buildCatalog(
  paths: string[],
  loadRaw: (path: string) => Promise<string>,
  names: Map<string, string> = new Map(),
  metaByPath?: ReportMetaMap,
): Promise<ReportCatalog> {
  // 1) date → ticker → accumulator 로 그룹화
  const byDate = new Map<string, Map<string, TickerAccumulator>>()

  for (const p of paths) {
    const parsed = parseReportPath(p)
    if (!parsed) continue

    let tickers = byDate.get(parsed.date)
    if (!tickers) {
      tickers = new Map()
      byDate.set(parsed.date, tickers)
    }
    let acc = tickers.get(parsed.ticker)
    if (!acc) {
      acc = { date: parsed.date, ticker: parsed.ticker, gurus: [] }
      tickers.set(parsed.ticker, acc)
    }

    switch (parsed.kind) {
      case 'guru':
        acc.gurus.push({ folder: parsed.folder, path: parsed.path })
        break
      case 'data':
        acc.dataPath = parsed.path
        break
      case 'value-drivers':
        acc.valueDriversPath = parsed.path
        break
      case 'summary':
        acc.summaryPath = parsed.path
        break
      case 'final':
        acc.finalPath = parsed.path
        break
      case 'debate':
        acc.debatePath = parsed.path
        break
    }
  }

  // 2) accumulator → TickerReport (헤더 메타 추출)
  const catalog: ReportCatalog = new Map()

  // 날짜 내림차순 (최신 먼저)
  const dates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))

  for (const date of dates) {
    const tickers = byDate.get(date)!
    const reports: TickerReport[] = []

    // ticker 오름차순
    const tickerKeys = [...tickers.keys()].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

    for (const tk of tickerKeys) {
      const acc = tickers.get(tk)!

      // 거장 보고서: 매니페스트가 있으면 그걸로, 없으면 본문 로딩 → 메타 추출. 표시명 정렬.
      const gurus: GuruReport[] = await Promise.all(
        acc.gurus.map(async (g) => {
          const meta = metaByPath
            ? {
                verdict: metaByPath[g.path]?.verdict ?? null,
                confidence: metaByPath[g.path]?.confidence ?? null,
              }
            : parseGuruMeta(await loadRaw(g.path))
          return {
            guru: g.folder.replace(/-/g, ' '),
            folder: g.folder,
            verdict: meta.verdict,
            confidence: meta.confidence,
            load: () => loadRaw(g.path),
          }
        }),
      )
      gurus.sort((a, b) => a.guru.localeCompare(b.guru, 'ko'))

      const report: TickerReport = {
        date,
        ticker: tk,
        name: names.get(tk) ?? tk,
        gurus,
        status: acc.finalPath ? 'final' : 'in-progress',
      }

      if (acc.dataPath) report.data = () => loadRaw(acc.dataPath!)
      if (acc.valueDriversPath) report.valueDrivers = () => loadRaw(acc.valueDriversPath!)
      if (acc.summaryPath) report.summary = () => loadRaw(acc.summaryPath!)
      if (acc.debatePath) report.debate = () => loadRaw(acc.debatePath!)

      if (acc.finalPath) {
        const finalPath = acc.finalPath
        report.final = () => loadRaw(finalPath)
        const fmeta = metaByPath
          ? {
              finalVerdict: metaByPath[finalPath]?.finalVerdict ?? null,
              tally: metaByPath[finalPath]?.tally ?? null,
            }
          : parseFinalMeta(await loadRaw(finalPath))
        if (fmeta.finalVerdict) report.finalVerdict = fmeta.finalVerdict
        if (fmeta.tally) report.tally = fmeta.tally
      }

      reports.push(report)
    }

    catalog.set(date, reports)
  }

  return catalog
}

// ── glob 어댑터 (얇은 껍데기) ───────────────────────────────────────────

/**
 * 실제 `docs/` 를 glob으로 스캔해 카탈로그를 만든다.
 * glob 결과는 테스트 환경에 없으므로 로직은 buildCatalog에 두고 여기서는 연결만 한다.
 *
 * 성능: 헤더 메타는 빌드/개발 타임에 미리 뽑은 `virtual:report-meta` 매니페스트로 채운다.
 * 덕분에 첫 화면에서 보고서 본문(수백 개 md 청크)을 하나도 fetch 하지 않는다.
 * glob 로더는 lazy — 열람 시에만 해당 청크를 받는다.
 */
export async function loadCatalog(): Promise<ReportCatalog> {
  const reportGlob = import.meta.glob('../../../docs/report/**/*.md', {
    query: '?raw',
    import: 'default',
  }) as Record<string, () => Promise<string>>

  const tickerGlob = import.meta.glob('../../../docs/interest ticker.md', {
    query: '?raw',
    import: 'default',
  }) as Record<string, () => Promise<string>>

  const { reportMeta } = await import('virtual:report-meta')
  const names = await loadTickerNames(tickerGlob)
  const paths = Object.keys(reportGlob)
  return buildCatalog(paths, (p) => reportGlob[p](), names, reportMeta)
}

async function loadTickerNames(
  tickerGlob: Record<string, () => Promise<string>>,
): Promise<Map<string, string>> {
  const loader = Object.values(tickerGlob)[0]
  if (!loader) return new Map()
  return parseTickerMap(await loader())
}
