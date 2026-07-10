import { describe, expect, it } from 'vitest'
import { buildCatalog } from './catalog'
import { parseTickerMap } from './meta'

// 경로 배열 픽스처 기반. glob 결과가 테스트 환경에 없으므로, 순수 buildCatalog에
// 합성 경로 목록 + loadRaw 스텁 + 티커 매핑을 주입해 검증한다.
// 설계 예시(../../docs/report/…)와 동일한 접두로 두어 접두 깊이 무관함도 함께 확인한다.

const DATE = '2026-07-10'

// 거장 13인 (폴더명, '-'는 공백으로 표시됨)
const GURU_FOLDERS = [
  '워런-버핏',
  '벤저민-그레이엄',
  '세스-클라먼',
  '잭-슈웨거',
  '필립-피셔',
  '앙드레-코스톨라니',
  '피터-린치',
  '모니시-파브라이',
  '조엘-그린블라트',
  '마이클-버리',
  '뉴욕주민',
  '존-템플턴',
  '애스워스-다모다란',
]

const base = (author: string, file: string) =>
  `../../docs/report/${DATE}/${author}/${file}`

// 픽스처: 경로 → 본문
const files = new Map<string, string>()

function guruHeader(folder: string, verdict: string, conf: number) {
  return `# 005930 투자 보고서 — ${folder}\n> 날짜: ${DATE} | 투자의견: ${verdict} | 확신도: ${conf}/10\n\n본문`
}

// 005930 — 거장 13인 + _data + 최종 + 토론 (final)
for (const g of GURU_FOLDERS) {
  files.set(base(g, '005930.md'), guruHeader(g, '관망', 7))
}
files.set(base('_data', '005930.md'), '# 005930 데이터 팩\n> 작성일')
files.set(
  base('최종', '005930_최종보고서.md'),
  '# 005930 최종 투자 보고서\n> 날짜: 2026-07-10 | 종합 의견: **매도 (신규 진입 보류)** | 표결: 매수 1·보유 1·매도 6·관망 5\n\n## 종합 결론\n다수는 매도(6인)',
)
files.set(base('최종', '005930_토론.md'), '# 005930 원탁 토론\n본문')

// 000660 — 거장 13인 + _data, 최종 없음 (in-progress)
for (const g of GURU_FOLDERS) {
  files.set(base(g, '000660.md'), guruHeader(g, '매수', 6))
}
files.set(base('_data', '000660.md'), '# 000660 데이터 팩')

const paths = [...files.keys()]
const loadRaw = async (p: string) => files.get(p) ?? ''
const names = parseTickerMap('005930 : 삼성전자\n000660 : 하이닉스')

describe('buildCatalog', () => {
  it('날짜 키에 티커 2개를 담는다', async () => {
    const cat = await buildCatalog(paths, loadRaw, names)
    const reports = cat.get(DATE)
    expect(reports).toBeDefined()
    expect(reports!.map((r) => r.ticker).sort()).toEqual(['000660', '005930'])
  })

  it('interest ticker 매핑으로 name을 채운다', async () => {
    const cat = await buildCatalog(paths, loadRaw, names)
    const r = cat.get(DATE)!.find((x) => x.ticker === '005930')!
    expect(r.name).toBe('삼성전자')
  })

  it('매핑에 없으면 ticker를 name으로 사용', async () => {
    const cat = await buildCatalog(paths, loadRaw, new Map())
    expect(cat.get(DATE)!.find((x) => x.ticker === '005930')!.name).toBe('005930')
  })

  it('005930: 최종 존재 → status final, 표결/종합의견 추출', async () => {
    const cat = await buildCatalog(paths, loadRaw, names)
    const r = cat.get(DATE)!.find((x) => x.ticker === '005930')!
    expect(r.status).toBe('final')
    expect(r.tally).toEqual({ 매수: 1, 보유: 1, 매도: 6, 관망: 5 })
    expect(r.finalVerdict).toBe('매도 (신규 진입 보류)')
    expect(r.final).toBeTypeOf('function')
    expect(r.debate).toBeTypeOf('function')
  })

  it('000660: 최종 없음 → status in-progress, 표결/종합의견 없음', async () => {
    const cat = await buildCatalog(paths, loadRaw, names)
    const r = cat.get(DATE)!.find((x) => x.ticker === '000660')!
    expect(r.status).toBe('in-progress')
    expect(r.final).toBeUndefined()
    expect(r.debate).toBeUndefined()
    expect(r.tally).toBeUndefined()
    expect(r.finalVerdict).toBeUndefined()
  })

  it('거장 13인을 표시명으로 정렬해 담고 폴더명도 보존', async () => {
    const cat = await buildCatalog(paths, loadRaw, names)
    const r = cat.get(DATE)!.find((x) => x.ticker === '005930')!
    expect(r.gurus).toHaveLength(13)

    // 표시명은 '-' → ' '
    const 워런 = r.gurus.find((g) => g.folder === '워런-버핏')!
    expect(워런.guru).toBe('워런 버핏')

    // 정렬 확인 (한국어 로케일)
    const names_ = r.gurus.map((g) => g.guru)
    const sorted = [...names_].sort((a, b) => a.localeCompare(b, 'ko'))
    expect(names_).toEqual(sorted)

    // 헤더 메타 추출
    expect(워런.verdict).toBe('관망')
    expect(워런.confidence).toBe(7)
  })

  it('_data 를 연결하고 본문 lazy 로더로 노출', async () => {
    const cat = await buildCatalog(paths, loadRaw, names)
    const r = cat.get(DATE)!.find((x) => x.ticker === '005930')!
    expect(r.data).toBeTypeOf('function')
    await expect(r.data!()).resolves.toContain('데이터 팩')
  })

  it('거장 본문 lazy 로더가 원문을 돌려준다', async () => {
    const cat = await buildCatalog(paths, loadRaw, names)
    const r = cat.get(DATE)!.find((x) => x.ticker === '005930')!
    const 워런 = r.gurus.find((g) => g.folder === '워런-버핏')!
    await expect(워런.load()).resolves.toContain('투자의견: 관망')
  })

  it('여러 날짜를 내림차순으로 정렬', async () => {
    const extra = [...paths, `../../docs/report/2026-07-09/워런-버핏/005930.md`]
    files.set('../../docs/report/2026-07-09/워런-버핏/005930.md', guruHeader('워런-버핏', '보유', 5))
    const cat = await buildCatalog(extra, loadRaw, names)
    expect([...cat.keys()]).toEqual(['2026-07-10', '2026-07-09'])
  })

  it('알 수 없는 경로는 조용히 무시 (throw 없음)', async () => {
    const cat = await buildCatalog(['garbage', '/no/report/here.md', ...paths], loadRaw, names)
    expect(cat.get(DATE)!.length).toBe(2)
  })
})
