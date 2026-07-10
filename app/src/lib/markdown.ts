// 마크다운 원문 전처리 순수 함수 모음. I/O 없음 · 문자열 입력 → 문자열 출력.
// meta.ts와 같은 원칙: 어떤 입력에도 throw 하지 않고, 기대한 모양이 아니면 원문을
// 그대로 돌려준다 (파싱 실패는 무해해야 한다).

/**
 * 문서 맨 앞의 `# 제목` 줄과, 그 뒤(빈 줄을 건너뛴) 바로 이어지는 blockquote 블록을 제거한다.
 *
 * guru-report 문서는 한결같이 `# 제목\n> 메타…\n\n본문` 모양이다. ReportPage처럼 그 제목·메타를
 * 별도 헤더 UI로 대체 표시하는 화면에서, 본문 마크다운 안에 같은 정보가 중복 노출되지 않도록 쓴다.
 *
 * 문서가 `#` 제목으로 시작하지 않으면(기대한 모양이 아니면) 원문을 그대로 돌려준다.
 */
export function stripLeadingHeader(source: string): string {
  const lines = source.split('\n')
  let i = 0

  while (i < lines.length && lines[i].trim() === '') i++
  if (i >= lines.length || !/^#\s+\S/.test(lines[i])) return source
  i++ // 제목 줄 소비

  while (i < lines.length && lines[i].trim() === '') i++
  while (i < lines.length && lines[i].startsWith('>')) i++ // 연속된 blockquote 블록 소비

  return lines.slice(i).join('\n').replace(/^\n+/, '')
}
