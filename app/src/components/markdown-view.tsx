// 공용 마크다운 렌더러 — react-markdown + remark-gfm. 보고서(거장·최종·토론·데이터팩) 화면과
// books 화면이 함께 재사용하는 유일한 렌더 경로. tailwind typography 플러그인 없이 컴포넌트
// 매핑으로 shadcn mira/neutral 팔레트 타이포그래피를 직접 입힌다.
//
// 가장 까다로운 요구사항은 GFM 표: 열이 아무리 많아도 페이지 자체가 가로로 스크롤되면 안 되므로
// 표마다 overflow-x-auto 컨테이너로 감싸고, 상위 트리 전체에 min-w-0을 둬 flex 자식이 내용만큼
// 늘어나 컨테이너를 뚫는 것을 막는다.
//
// 22KB짜리 토론 문서처럼 긴 문서에서 불필요한 재파싱을 피하려고 memo 처리한다 — children이
// 문자열(값 비교)이라 참조가 바뀌지 않는 한(=문서를 안 바꾸는 한) 리렌더되지 않는다.

import { memo, useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { stripLeadingHeader } from '@/lib/markdown'
import { cn } from '@/lib/utils'

export interface MarkdownViewProps {
  /** 렌더할 원문 마크다운. */
  children: string
  className?: string
  /**
   * 문서 1행의 `# 제목`과 그 바로 뒤 blockquote 메타 헤더를 숨긴다.
   * 호출부가 같은 정보를 별도 헤더 UI로 대체 표시할 때(예: ReportPage) 켠다.
   * 기본 off — 제목을 그대로 보여줘야 하는 화면(예: books)은 그대로 둔다.
   */
  hideLeadingHeader?: boolean
}

const components: Components = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        'mt-0 mb-4 font-heading text-xl font-semibold tracking-tight text-foreground first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        'mt-8 mb-3 border-b border-border pb-2 font-heading text-base font-semibold text-foreground first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn('mt-6 mb-2 font-heading text-sm font-semibold text-foreground first:mt-0', className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4 className={cn('mt-4 mb-2 text-sm font-semibold text-foreground first:mt-0', className)} {...props} />
  ),
  h5: ({ className, ...props }) => (
    <h5 className={cn('mt-4 mb-1.5 text-xs font-semibold text-foreground first:mt-0', className)} {...props} />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn('mt-4 mb-1.5 text-xs font-semibold text-muted-foreground first:mt-0', className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn('mb-4 text-sm leading-relaxed text-foreground last:mb-0', className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        'text-foreground underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground',
        className,
      )}
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  strong: ({ className, ...props }) => <strong className={cn('font-semibold text-foreground', className)} {...props} />,
  em: ({ className, ...props }) => <em className={cn('italic', className)} {...props} />,
  del: ({ className, ...props }) => (
    <del className={cn('text-muted-foreground line-through', className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        'mb-4 list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground marker:text-muted-foreground last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        'mb-4 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-foreground marker:text-muted-foreground last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => <li className={cn('[&>ol]:mt-1 [&>ul]:mt-1', className)} {...props} />,
  input: ({ className, ...props }) => (
    <input className={cn('mr-1.5 align-middle accent-foreground', className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        'my-4 border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground [&>p]:mb-1 [&>p]:last:mb-0',
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => <hr className={cn('my-8 border-t border-border', className)} {...props} />,
  code: ({ className, ...props }) => (
    <code
      className={cn('rounded bg-muted px-1 py-0.5 font-mono text-[0.8125rem] text-foreground', className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        'mb-4 overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed text-foreground last:mb-0 [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-xs',
        className,
      )}
      {...props}
    />
  ),
  img: ({ className, alt, ...props }) => (
    <img className={cn('my-4 max-w-full rounded-lg border border-border', className)} alt={alt ?? ''} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="my-4 min-w-0 overflow-x-auto rounded-lg border border-border">
      <table className={cn('w-full border-collapse text-xs leading-relaxed', className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn('bg-muted/60 [&_tr]:border-b [&_tr]:border-border', className)} {...props} />
  ),
  tbody: ({ className, ...props }) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />,
  tr: ({ className, ...props }) => (
    <tr className={cn('border-b border-border last:border-0', className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn('whitespace-nowrap px-3 py-2 text-left align-middle font-medium text-muted-foreground', className)}
      {...props}
    />
  ),
  td: ({ className, ...props }) => <td className={cn('px-3 py-2 align-top text-foreground', className)} {...props} />,
}

function MarkdownViewImpl({ children, className, hideLeadingHeader = false }: MarkdownViewProps) {
  const source = useMemo(
    () => (hideLeadingHeader ? stripLeadingHeader(children) : children),
    [children, hideLeadingHeader],
  )

  return (
    <div className={cn('min-w-0', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}

export const MarkdownView = memo(MarkdownViewImpl)
