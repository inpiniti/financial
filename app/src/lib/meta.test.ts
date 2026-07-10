import { describe, expect, it } from 'vitest'
import { parseFinalMeta, parseGuruMeta, parseTickerMap } from './meta'

// 실측 포맷 그대로의 합성 픽스처. (docs/ 원본은 읽지 않고 재현한다)

describe('parseGuruMeta', () => {
  const header = [
    '# 005930 투자 보고서 — 워런-버핏 (워런 버핏의 재무제표 활용법)',
    '> 날짜: 2026-07-10 | 투자의견: 관망 | 확신도: 8/10',
    '',
    '## 한 줄 결론',
    '본문 …',
    '',
    '**투자의견: 관망 | 확신도: 8/10**',
  ].join('\n')

  it('헤더에서 투자의견과 확신도를 뽑는다', () => {
    expect(parseGuruMeta(header)).toEqual({ verdict: '관망', confidence: 8 })
  })

  it('네 가지 의견을 모두 인식한다', () => {
    for (const v of ['매수', '보유', '매도', '관망'] as const) {
      const raw = `> 날짜: 2026-07-10 | 투자의견: ${v} | 확신도: 5/10`
      expect(parseGuruMeta(raw).verdict).toBe(v)
    }
  })

  it('헤더가 없으면 null (throw 하지 않음)', () => {
    expect(parseGuruMeta('# 제목만 있고 메타 없음\n본문')).toEqual({
      verdict: null,
      confidence: null,
    })
  })

  it('빈/누락 입력에도 null', () => {
    expect(parseGuruMeta('')).toEqual({ verdict: null, confidence: null })
    expect(parseGuruMeta(null)).toEqual({ verdict: null, confidence: null })
    expect(parseGuruMeta(undefined)).toEqual({ verdict: null, confidence: null })
  })

  it('범위를 벗어난 확신도는 null', () => {
    expect(parseGuruMeta('투자의견: 매수 | 확신도: 0/10').confidence).toBeNull()
    expect(parseGuruMeta('투자의견: 매수 | 확신도: 11/10').confidence).toBeNull()
  })

  it('깨진 헤더(의견만 있고 확신도 없음)는 부분 파싱', () => {
    expect(parseGuruMeta('투자의견: 매도 뭔가 깨짐')).toEqual({
      verdict: '매도',
      confidence: null,
    })
  })
})

describe('parseFinalMeta', () => {
  const header = [
    '# 005930 최종 투자 보고서',
    '> 날짜: 2026-07-10 | 종합 의견: **매도 (신규 진입 보류 · 보유자 비중 축소)** | 표결: 매수 1·보유 1·매도 6·관망 5',
    '',
    '## 종합 결론',
    '13인 표결의 단순 다수는 매도(6인)이며 …', // 본문의 "매도(6인)"에 오염되면 안 됨
  ].join('\n')

  it('종합 의견을 ** 마크업 제거하고 뽑는다', () => {
    expect(parseFinalMeta(header).finalVerdict).toBe(
      '매도 (신규 진입 보류 · 보유자 비중 축소)',
    )
  })

  it('표결 카운트를 정확히 뽑는다', () => {
    expect(parseFinalMeta(header).tally).toEqual({ 매수: 1, 보유: 1, 매도: 6, 관망: 5 })
  })

  it('** 없는 종합 의견도 처리', () => {
    const raw = '> 종합 의견: 매수 | 표결: 매수 10·보유 3·매도 0·관망 0'
    expect(parseFinalMeta(raw).finalVerdict).toBe('매수')
    expect(parseFinalMeta(raw).tally).toEqual({ 매수: 10, 보유: 3, 매도: 0, 관망: 0 })
  })

  it('헤더가 없으면 finalVerdict·tally 모두 null', () => {
    expect(parseFinalMeta('# 제목\n본문뿐')).toEqual({ finalVerdict: null, tally: null })
  })

  it('빈/누락 입력에도 null', () => {
    expect(parseFinalMeta('')).toEqual({ finalVerdict: null, tally: null })
    expect(parseFinalMeta(null)).toEqual({ finalVerdict: null, tally: null })
    expect(parseFinalMeta(undefined)).toEqual({ finalVerdict: null, tally: null })
  })
})

describe('parseTickerMap', () => {
  const raw = [
    'NVDA : 엔비디아',
    'BRK.B : 버크셔 해서웨이',
    '005930 : 삼성전자',
    '000660 : 하이닉스',
    '', // 빈 줄
    '잘못된 행 형식', // 콜론 없음 → 무시
  ].join('\n')

  it('티커 → 한글명 Map을 만든다', () => {
    const map = parseTickerMap(raw)
    expect(map.get('005930')).toBe('삼성전자')
    expect(map.get('000660')).toBe('하이닉스')
    expect(map.get('NVDA')).toBe('엔비디아')
  })

  it('티커에 점(.)이 포함돼도 처리 (BRK.B)', () => {
    expect(parseTickerMap(raw).get('BRK.B')).toBe('버크셔 해서웨이')
  })

  it('형식에 맞지 않는 행은 건너뛴다', () => {
    const map = parseTickerMap(raw)
    expect(map.size).toBe(4)
    expect(map.has('잘못된')).toBe(false)
  })

  it('빈/누락 입력에도 빈 Map', () => {
    expect(parseTickerMap('').size).toBe(0)
    expect(parseTickerMap(null).size).toBe(0)
    expect(parseTickerMap(undefined).size).toBe(0)
  })
})
