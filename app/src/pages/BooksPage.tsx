// 서재 (/books) — 투자 관련 책 목록과 내용 열람 (설계 5절 "서재" 참조).
//
// 구성: BooksPage(카탈로그 로딩) → BookListView(선택·본문 로딩).
// 선택 상태는 `?book={파일명}` 쿼리로 유지한다 — 새로고침·공유해도 같은 책이 열린다.

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertCircleFreeIcons,
  ArrowLeft02FreeIcons,
  BookOpen02FreeIcons,
  FileEmpty02FreeIcons,
  Refresh01FreeIcons,
} from '@hugeicons/core-free-icons'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MarkdownView } from '@/components/markdown-view'

// ── 모델 ───────────────────────────────────────────────────────────────

interface BookEntry {
  title: string
  filename: string
}

type BooksCatalog = BookEntry[]

type ContentState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; raw: string }
  | { status: 'error' }

// ── 유틸 ───────────────────────────────────────────────────────────────

/** 파일명 (확장자 제거, _는 공백으로) → 책 제목. */
function filenameToTitle(filename: string): string {
  return filename.replace(/\.md$/i, '').replace(/_/g, ' ')
}

/** 글로브 경로 → 파일명 추출 (경로 세그먼트 마지막). */
function extractFilename(path: string): string {
  return path.split('/').pop() ?? ''
}

/** 책 목록 로드 및 정렬. */
async function loadBooksCatalog(): Promise<BooksCatalog> {
  const globRecords = import.meta.glob('../../../docs/books/*.md', {
    query: '?raw',
    import: 'default',
  }) as Record<string, () => Promise<string>>

  const entries = Object.keys(globRecords)
    .map((path) => {
      const filename = extractFilename(path)
      const title = filenameToTitle(filename)
      return { title, filename }
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'ko'))

  return entries
}

// ── 최상위: 카탈로그 로딩 ───────────────────────────────────────────────

type CatalogState = { status: 'loading' } | { status: 'ready'; catalog: BooksCatalog } | { status: 'error' }

function BooksPage() {
  const [state, setState] = useState<CatalogState>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    loadBooksCatalog()
      .then((catalog) => {
        if (alive) setState({ status: 'ready', catalog })
      })
      .catch(() => {
        if (alive) setState({ status: 'error' })
      })
    return () => {
      alive = false
    }
  }, [])

  if (state.status === 'loading') return <BooksPageSkeleton />
  if (state.status === 'error') return <CatalogErrorState />

  const { catalog } = state
  if (catalog.length === 0) return <EmptyState />

  return <BookListView catalog={catalog} />
}

// ── BookListView: 선택·본문 로딩 ────────────────────────────────────────

function BookListView({ catalog }: { catalog: BooksCatalog }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultFilename = useMemo(() => catalog[0]?.filename ?? null, [catalog])

  const requestedFilename = searchParams.get('book')
  const selectedFilename =
    requestedFilename && catalog.some((b) => b.filename === requestedFilename)
      ? requestedFilename
      : defaultFilename

  const selectedBook = useMemo(
    () => catalog.find((b) => b.filename === selectedFilename),
    [catalog, selectedFilename],
  )

  // URL 정규화: book이 없거나 유효하지 않은 파일명을 가리키면 기본값으로 조용히 치환한다.
  useEffect(() => {
    if (!selectedFilename || requestedFilename === selectedFilename) return
    const next = new URLSearchParams(searchParams)
    next.set('book', selectedFilename)
    setSearchParams(next, { replace: true })
  }, [requestedFilename, selectedFilename, searchParams, setSearchParams])

  const [content, setContent] = useState<ContentState>({ status: 'idle' })
  const [retryTick, setRetryTick] = useState(0)

  // 책 전환 시 본문 스크롤을 최상단으로.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [selectedFilename])

  // 본문 로드
  useEffect(() => {
    if (!selectedFilename) {
      setContent({ status: 'idle' })
      return
    }

    let alive = true
    setContent({ status: 'loading' })

    const globRecords = import.meta.glob('../../../docs/books/*.md', {
      query: '?raw',
      import: 'default',
    }) as Record<string, () => Promise<string>>

    // 경로에서 파일명을 통해 로더 찾기
    const loader = Object.entries(globRecords).find(([path]) =>
      path.endsWith(`/${selectedFilename}`),
    )?.[1]

    if (!loader) {
      if (alive) setContent({ status: 'error' })
      return
    }

    loader()
      .then((raw) => {
        if (alive) setContent({ status: 'ready', raw })
      })
      .catch(() => {
        if (alive) setContent({ status: 'error' })
      })

    return () => {
      alive = false
    }
  }, [selectedFilename, retryTick])

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <BookSidebar catalog={catalog} selectedFilename={selectedFilename} />
      <div className="min-w-0 flex-1">
        <BookContent book={selectedBook} content={content} onRetry={() => setRetryTick((t) => t + 1)} />
      </div>
    </div>
  )
}

// ── 사이드바 ────────────────────────────────────────────────────────────

function BookSidebar({
  catalog,
  selectedFilename,
}: {
  catalog: BooksCatalog
  selectedFilename: string | null
}) {
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-16 lg:w-64 lg:shrink-0 lg:self-start">
      <div className="flex flex-col gap-2.5">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft02FreeIcons} className="size-3" />
          대시보드
        </Link>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <h1 className="truncate font-heading text-base font-semibold text-foreground">서재</h1>
          </div>
          <p className="text-xs text-muted-foreground">투자 관련 참고 자료</p>
        </div>
      </div>

      {/* 데스크톱: 세로 책 목록 (sticky) */}
      <nav className="hidden flex-col gap-0.5 lg:flex" aria-label="책 목록">
        {catalog.map((book) => (
          <BookNavItem
            key={book.filename}
            book={book}
            active={book.filename === selectedFilename}
          />
        ))}
      </nav>

      {/* 모바일: 상단 가로 스크롤 칩 목록 */}
      <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden" aria-label="책 목록">
        {catalog.map((book) => (
          <BookNavChip
            key={book.filename}
            book={book}
            active={book.filename === selectedFilename}
          />
        ))}
      </nav>
    </aside>
  )
}

function BookNavItem({ book, active }: { book: BookEntry; active: boolean }) {
  return (
    <Link
      to={`?book=${encodeURIComponent(book.filename)}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors',
        active
          ? 'bg-muted font-medium text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <HugeiconsIcon icon={BookOpen02FreeIcons} className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{book.title}</span>
    </Link>
  )
}

function BookNavChip({ book, active }: { book: BookEntry; active: boolean }) {
  return (
    <Link
      to={`?book=${encodeURIComponent(book.filename)}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[0.6875rem] whitespace-nowrap transition-colors',
        active
          ? 'border-transparent bg-foreground text-background'
          : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <HugeiconsIcon icon={BookOpen02FreeIcons} className="size-3" />
      <span>{book.title}</span>
    </Link>
  )
}

// ── 본문 ────────────────────────────────────────────────────────────────

function BookContent({
  book,
  content,
  onRetry,
}: {
  book: BookEntry | undefined
  content: ContentState
  onRetry: () => void
}) {
  if (!book) return <NoBookState />

  return (
    <div>
      <ContentHeader book={book} />
      {(content.status === 'idle' || content.status === 'loading') && <ContentSkeleton />}
      {content.status === 'error' && <ContentErrorState onRetry={onRetry} />}
      {content.status === 'ready' && (
        <MarkdownView key={book.filename}>{content.raw}</MarkdownView>
      )}
    </div>
  )
}

function ContentHeader({ book }: { book: BookEntry }) {
  return (
    <div className="mb-6 flex items-center gap-2 border-b border-border pb-5">
      <HugeiconsIcon icon={BookOpen02FreeIcons} className="size-4 text-muted-foreground" />
      <h2 className="font-heading text-lg font-semibold text-foreground">{book.title}</h2>
    </div>
  )
}

function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="책을 불러오고 있어요">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

function ContentErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <HugeiconsIcon icon={AlertCircleFreeIcons} className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">책을 불러오지 못했어요</p>
      <p className="text-xs text-muted-foreground">잠시 뒤에 다시 시도해 주세요</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
        <HugeiconsIcon icon={Refresh01FreeIcons} data-icon="inline-start" />
        다시 시도
      </Button>
    </div>
  )
}

function NoBookState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
      <HugeiconsIcon icon={FileEmpty02FreeIcons} className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">아직 볼 수 있는 책이 없어요</p>
      <p className="text-xs text-muted-foreground">새 책을 추가하면 여기에 나타나요</p>
    </div>
  )
}

// ── 카탈로그 레벨 상태 ──────────────────────────────────────────────────

function BooksPageSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8"
      aria-busy="true"
      aria-label="서재를 불러오고 있어요"
    >
      <div className="flex flex-col gap-3 lg:w-64 lg:shrink-0">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <ContentSkeleton />
      </div>
    </div>
  )
}

function CatalogErrorState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-20 text-center">
      <p className="text-sm font-medium text-foreground">서재를 불러오지 못했어요</p>
      <p className="text-xs text-muted-foreground">잠시 뒤 새로고침해 주세요</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-20 text-center">
      <HugeiconsIcon icon={FileEmpty02FreeIcons} className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">서재가 비어있어요</p>
      <p className="text-xs text-muted-foreground">새 책을 추가하면 여기에 나타나요</p>
    </div>
  )
}

export default BooksPage
