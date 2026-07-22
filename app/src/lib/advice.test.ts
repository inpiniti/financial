import { describe, expect, it } from 'vitest'
import { buildAdviceList } from './advice'

const loadRaw = async (p: string) => `raw:${p}`

describe('buildAdviceList', () => {
  it('포트폴리오 폴더의 md만 골라 날짜 내림차순으로 정렬한다', async () => {
    const paths = [
      '../../../docs/report/2026-07-22/포트폴리오/포트폴리오_조언.md',
      '../../../docs/report/2026-07-23/포트폴리오/포트폴리오_조언.md',
      '../../../docs/report/2026-07-22/최종/AMZN_최종보고서.md', // 제외
      '../../../docs/report/2026-07-22/_data/AMZN.md', // 제외
      '../../../docs/report/2026-07-22/워런-버핏/AMZN.md', // 제외
    ]
    const list = buildAdviceList(paths, loadRaw)

    expect(list.map((a) => a.date)).toEqual(['2026-07-23', '2026-07-22'])
    expect(list[0].filename).toBe('포트폴리오_조언.md')
    expect(list[0].title).toBe('포트폴리오 조언')
    await expect(list[0].load()).resolves.toContain('2026-07-23')
  })

  it('report 세그먼트가 없는 경로나 형식이 다른 경로는 무시한다', () => {
    const list = buildAdviceList(
      ['../../../docs/books/투자서.md', '../../../docs/report/2026-07-22/포트폴리오/메모.txt'],
      loadRaw,
    )
    expect(list).toEqual([])
  })
})
