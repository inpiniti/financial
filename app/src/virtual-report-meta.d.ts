// vite-report-meta 플러그인이 제공하는 가상 모듈 타입.
declare module 'virtual:report-meta' {
  export interface ReportMetaEntry {
    verdict?: '매수' | '보유' | '매도' | '관망' | null
    confidence?: number | null
    finalVerdict?: string | null
    tally?: { 매수: number; 보유: number; 매도: number; 관망: number } | null
  }
  /** glob 키(`../../../docs/report/{date}/{author}/{file}.md`) → 헤더 메타. */
  export const reportMeta: Record<string, ReportMetaEntry>
}
