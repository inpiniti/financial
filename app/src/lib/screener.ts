// 토스 스크리너 API 클라이언트 (bitcoin-ai-backend의 /toss/* 엔드포인트).
//
// 크로스 도메인: 백엔드가 CORS를 `allow_origins=["*"]`로 열어두고 있고,
// 이 요청들은 쿠키를 쓰지 않는 단순 GET이라 credentials 없이 그대로 호출된다.
// (credentials를 켜면 와일드카드 origin이 무효가 되므로 절대 켜지 말 것.)
//
// 백엔드는 HuggingFace Space에서 돌아 콜드 스타트가 있다 — 첫 요청은 수십 초 걸릴 수 있다.

const API_BASE = import.meta.env.VITE_SCREENER_API ?? 'https://younginpiniti-bitcoin-ai-backend.hf.space'

export type Nation = 'kr' | 'us'

export type Guru = {
  key: string
  path: string
  name: string
  style: string
  principle: string
  filterCount: number
  measuredCount: number | null
  tighten: string | null
  loosen: string | null
  note: string | null
  aliases: string[]
}

/** 종목 한 줄. 고정 필드 + 적용된 필터에 따라 달라지는 동적 지표 컬럼. */
export type Stock = {
  ticker: string
  stockCode: string
  name: string
  logoImageUrl: string | null
  price: number | null
  prevClose: number | null
} & Record<string, unknown>

export type GuruPicks = {
  guru: string
  name: string
  style: string
  principle: string
  tighten: string | null
  loosen: string | null
  note: string | null
  filterCount: number
  totalCount: number
  count: number
  page: number
  lastPage: boolean
  stocks: Stock[]
}

/** 종목 행에서 지표 컬럼이 아닌 고정 필드 — 표 헤더를 만들 때 제외한다. */
const BASE_FIELDS = new Set([
  'ticker',
  'stockCode',
  'name',
  'logoImageUrl',
  'price',
  'prevClose',
])

export function metricColumns(stocks: Stock[]): string[] {
  const seen: string[] = []
  for (const stock of stocks) {
    for (const key of Object.keys(stock)) {
      if (!BASE_FIELDS.has(key) && !seen.includes(key)) seen.push(key)
    }
  }
  return seen
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal })
  if (!res.ok) throw new Error(`스크리너 서버 응답 오류 (HTTP ${res.status})`)
  return (await res.json()) as T
}

export async function fetchGurus(signal?: AbortSignal): Promise<Guru[]> {
  const data = await getJson<{ count: number; gurus: Guru[] }>('/toss/gurus', signal)
  return data.gurus
}

export async function fetchGuruPicks(
  guruKey: string,
  nation: Nation,
  size = 50,
  signal?: AbortSignal,
): Promise<GuruPicks> {
  return getJson<GuruPicks>(
    `/toss/${encodeURIComponent(guruKey)}?nation=${nation}&size=${size}`,
    signal,
  )
}

// ── 표시용 포맷터 ────────────────────────────────────────────
// 토스 응답의 값 규칙: 비율은 소수(0.49 = 49%), 금액은 원 단위 raw, 배수는 그대로.

const PERCENT = /(률|비율|배율)$|^ROE$|^ROA$/
const MULTIPLE = /^(PER|PBR|PSR|PFCR)$|EBITDA/
const MONEY = /^(시가총액|거래대금|주가)$/
const SHARES = /^거래량$/

export function formatMetric(label: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value !== 'number' || Number.isNaN(value)) return String(value)

  if (PERCENT.test(label)) return `${(value * 100).toFixed(1)}%`
  if (MULTIPLE.test(label)) return `${value.toFixed(1)}배`
  if (MONEY.test(label)) return formatWon(value)
  if (SHARES.test(label)) return `${Math.round(value).toLocaleString('ko-KR')}주`
  if (label.includes('연속')) return `${value}회`
  if (label.includes('애널리스트')) return value.toFixed(1)
  return value.toLocaleString('ko-KR', { maximumFractionDigits: 2 })
}

/** 원 단위 금액을 조/억으로 압축 (토스 앱과 같은 방식). */
export function formatWon(won: number): string {
  const 조 = 1_000_000_000_000
  const 억 = 100_000_000
  if (Math.abs(won) >= 조) return `${(won / 조).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}조원`
  if (Math.abs(won) >= 억) return `${Math.round(won / 억).toLocaleString('ko-KR')}억원`
  return `${Math.round(won).toLocaleString('ko-KR')}원`
}

export function formatPrice(won: number | null): string {
  if (won === null) return '—'
  return `${Math.round(won).toLocaleString('ko-KR')}원`
}

/** 전일 종가 대비 등락률 (%). 둘 중 하나라도 없으면 null. */
export function changeRate(price: number | null, prevClose: number | null): number | null {
  if (price === null || prevClose === null || prevClose === 0) return null
  return ((price - prevClose) / prevClose) * 100
}
