// 포트폴리오 조언 문서 목록 (docs/report/{date}/포트폴리오/*.md).
// catalog.ts와 같은 구조: 경로 목록 → 엔트리 변환은 순수 함수 buildAdviceList로 두고,
// 실제 glob 연결은 얇은 어댑터 loadAdvices()가 감싼다.

import type { RawLoader } from './catalog'

export interface AdviceEntry {
  date: string // '2026-07-22'
  filename: string // '포트폴리오_조언.md'
  title: string // 파일명에서 확장자 제거, _ → 공백
  load: RawLoader
}

/**
 * `…/docs/report/{date}/포트폴리오/{file}.md` 경로만 골라 엔트리로 변환한다.
 * 날짜 내림차순(최신 먼저), 같은 날짜 안에서는 파일명 오름차순.
 */
export function buildAdviceList(
  paths: string[],
  loadRaw: (path: string) => Promise<string>,
): AdviceEntry[] {
  const entries: AdviceEntry[] = []

  for (const p of paths) {
    const parts = p.replace(/\\/g, '/').split('/')
    const reportIdx = parts.lastIndexOf('report')
    if (reportIdx < 0) continue

    const date = parts[reportIdx + 1]
    const author = parts[reportIdx + 2]
    const file = parts[reportIdx + 3]
    if (!date || author !== '포트폴리오' || !file?.toLowerCase().endsWith('.md')) continue

    entries.push({
      date,
      filename: file,
      title: file.replace(/\.md$/i, '').replace(/_/g, ' '),
      load: () => loadRaw(p),
    })
  }

  return entries.sort(
    (a, b) => b.date.localeCompare(a.date) || a.filename.localeCompare(b.filename, 'ko'),
  )
}

export function loadAdvices(): AdviceEntry[] {
  const adviceGlob = import.meta.glob('../../../docs/report/*/포트폴리오/*.md', {
    query: '?raw',
    import: 'default',
  }) as Record<string, () => Promise<string>>

  return buildAdviceList(Object.keys(adviceGlob), (p) => adviceGlob[p]())
}
