import { describe, expect, it } from 'vitest'
import { stripLeadingHeader } from './markdown'

// 실측 포맷(거장 1줄 메타·최종 1줄 메타·데이터팩 2줄 메타·토론 2줄 메타) 기준 픽스처.

describe('stripLeadingHeader', () => {
  it('제목 + 거장 헤더(메타 1줄)를 제거한다', () => {
    const src = [
      '# 005930 투자 보고서 — 워런-버핏',
      '> 날짜: 2026-07-10 | 투자의견: 관망 | 확신도: 8/10',
      '',
      '## 한 줄 결론',
      '본문 …',
    ].join('\n')

    expect(stripLeadingHeader(src)).toBe(['## 한 줄 결론', '본문 …'].join('\n'))
  })

  it('제목 + 최종보고서 헤더(메타 1줄)를 제거한다', () => {
    const src = [
      '# 005930 최종 투자 보고서',
      '> 날짜: 2026-07-10 | 종합 의견: **매도** | 표결: 매수 1·보유 1·매도 6·관망 5',
      '',
      '## 종합 결론',
      '본문',
    ].join('\n')

    expect(stripLeadingHeader(src)).toBe(['## 종합 결론', '본문'].join('\n'))
  })

  it('연속된 blockquote 여러 줄(데이터팩·토론)을 모두 제거한다', () => {
    const src = [
      '# 005930 (삼성전자) 공용 데이터 팩',
      '',
      '> 작성일: 2026-07-10 | 데이터 소스: Yahoo Finance API',
      '> 티커 해석: `005930` = 삼성전자 보통주',
      '',
      '## 1. 기업 개요',
      '본문',
    ].join('\n')

    expect(stripLeadingHeader(src)).toBe(['## 1. 기업 개요', '본문'].join('\n'))
  })

  it('제목만 있고 blockquote가 없으면 제목만 제거한다', () => {
    const src = ['# 제목만 있음', '', '본문 바로 시작'].join('\n')
    expect(stripLeadingHeader(src)).toBe('본문 바로 시작')
  })

  it('제목으로 시작하지 않으면 원문을 그대로 돌려준다', () => {
    const src = '본문이 제목 없이 바로 시작하는 문서\n다음 줄'
    expect(stripLeadingHeader(src)).toBe(src)
  })

  it('빈 문자열은 그대로 돌려준다 (throw 없음)', () => {
    expect(stripLeadingHeader('')).toBe('')
  })

  it('앞쪽 빈 줄이 있어도 제목을 찾아낸다', () => {
    const src = ['', '  ', '# 제목', '> 메타', '', '본문'].join('\n')
    expect(stripLeadingHeader(src)).toBe('본문')
  })
})
