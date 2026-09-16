// 거장 스크리너 데이터테이블 — 거장 하나를 받아 토스 스크리너 결과를 shadcn Table +
// @tanstack/react-table로 렌더한다. 거장 선택 탭은 이 컴포넌트의 관심사가 아니다
// (그건 상위 페이지가 props로 screenerKey를 바꿔가며 담당한다).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01FreeIcons,
  ArrowUp01FreeIcons,
  ArrowUpDownFreeIcons,
  RefreshFreeIcons,
} from '@hugeicons/core-free-icons'
import {
  changeRate,
  fetchGuruPicks,
  formatMetric,
  formatPrice,
  metricColumns,
} from '@/lib/screener'
import type { GuruPicks, Nation, Stock } from '@/lib/screener'
import { fetchCompletedTickers, getTodayString, upsertVoteResult } from '@/lib/votes'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'

/** 표 한 행 — 고정 필드 + 동적 지표 값을 한 곳에 모은다(정렬용 raw 값 포함). */
type Row = Stock & { changePercent: number | null }

interface FilterRule {
  metric: string
  op: 'min' | 'max' | 'range'
  value: number | [number, number]
}

const SCREENER_RULES: Record<string, Record<number, FilterRule[]>> = {
  '공통': {
    0: [],
    1: [
      { metric: '영업이익률', op: 'min', value: 0.11 },
      { metric: 'ROE', op: 'min', value: 0.11 }
    ],
    2: [
      { metric: '영업이익률', op: 'min', value: 0.12 },
      { metric: 'ROE', op: 'min', value: 0.12 },
      { metric: '이자보상배율', op: 'min', value: 4.0 }
    ],
    3: [
      { metric: '영업이익률', op: 'min', value: 0.13 },
      { metric: 'ROE', op: 'min', value: 0.13 },
      { metric: '이자보상배율', op: 'min', value: 4.0 },
      { metric: '시가총액', op: 'min', value: 4000 * 100_000_000 }
    ],
    4: [
      { metric: '영업이익률', op: 'min', value: 0.14 },
      { metric: 'ROE', op: 'min', value: 0.14 },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '시가총액', op: 'min', value: 4500 * 100_000_000 },
      { metric: '부채비율', op: 'max', value: 0.9 }
    ],
    5: [
      { metric: '영업이익률', op: 'min', value: 0.15 },
      { metric: 'ROE', op: 'min', value: 0.15 },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '시가총액', op: 'min', value: 5000 * 100_000_000 },
      { metric: '부채비율', op: 'max', value: 0.8 }
    ]
  },
  '그레이엄': {
    0: [],
    1: [
      { metric: 'PER', op: 'range', value: [0, 14] },
      { metric: 'PBR', op: 'range', value: [0, 1.4] }
    ],
    2: [
      { metric: 'PER', op: 'range', value: [0, 13] },
      { metric: 'PBR', op: 'range', value: [0, 1.3] },
      { metric: '유동비율', op: 'min', value: 2.1 }
    ],
    3: [
      { metric: 'PER', op: 'range', value: [0, 12] },
      { metric: 'PBR', op: 'range', value: [0, 1.2] },
      { metric: '유동비율', op: 'min', value: 2.2 },
      { metric: '시가총액', op: 'min', value: 4000 * 100_000_000 }
    ],
    4: [
      { metric: 'PER', op: 'range', value: [0, 11] },
      { metric: 'PBR', op: 'range', value: [0, 1.1] },
      { metric: '유동비율', op: 'min', value: 2.3 },
      { metric: '시가총액', op: 'min', value: 4500 * 100_000_000 },
      { metric: '부채비율', op: 'max', value: 0.9 }
    ],
    5: [
      { metric: 'PER', op: 'range', value: [0, 10] },
      { metric: 'PBR', op: 'range', value: [0, 1.0] },
      { metric: '유동비율', op: 'min', value: 2.5 },
      { metric: '시가총액', op: 'min', value: 5000 * 100_000_000 },
      { metric: '부채비율', op: 'max', value: 0.8 }
    ]
  },
  '클라먼': {
    0: [],
    1: [
      { metric: 'PBR', op: 'range', value: [0, 0.9] },
      { metric: 'PER', op: 'range', value: [0, 9] },
      { metric: '영업이익률', op: 'min', value: 0.11 }
    ],
    2: [
      { metric: 'PBR', op: 'range', value: [0, 0.8] },
      { metric: 'PER', op: 'range', value: [0, 8] },
      { metric: '영업이익률', op: 'min', value: 0.12 },
      { metric: '이자보상배율', op: 'min', value: 6.0 }
    ],
    3: [
      { metric: 'PBR', op: 'range', value: [0, 0.7] },
      { metric: 'PER', op: 'range', value: [0, 7] },
      { metric: '영업이익률', op: 'min', value: 0.13 },
      { metric: '이자보상배율', op: 'min', value: 7.0 },
      { metric: '부채비율', op: 'max', value: 0.9 }
    ],
    4: [
      { metric: 'PBR', op: 'range', value: [0, 0.6] },
      { metric: 'PER', op: 'range', value: [0, 6] },
      { metric: '영업이익률', op: 'min', value: 0.14 },
      { metric: '이자보상배율', op: 'min', value: 8.0 },
      { metric: '부채비율', op: 'max', value: 0.8 }
    ],
    5: [
      { metric: 'PBR', op: 'range', value: [0, 0.5] },
      { metric: 'PER', op: 'range', value: [0, 5] },
      { metric: '영업이익률', op: 'min', value: 0.15 },
      { metric: '이자보상배율', op: 'min', value: 10.0 },
      { metric: '부채비율', op: 'max', value: 0.7 }
    ]
  },
  '파브라이': {
    0: [],
    1: [
      { metric: 'PER', op: 'range', value: [0, 9] },
      { metric: 'PBR', op: 'range', value: [0, 0.9] },
      { metric: 'ROE', op: 'min', value: 0.06 }
    ],
    2: [
      { metric: 'PER', op: 'range', value: [0, 8] },
      { metric: 'PBR', op: 'range', value: [0, 0.8] },
      { metric: 'ROE', op: 'min', value: 0.07 },
      { metric: '이자보상배율', op: 'min', value: 4.0 }
    ],
    3: [
      { metric: 'PER', op: 'range', value: [0, 7] },
      { metric: 'PBR', op: 'range', value: [0, 0.7] },
      { metric: 'ROE', op: 'min', value: 0.08 },
      { metric: '이자보상배율', op: 'min', value: 4.0 },
      { metric: '시가총액', op: 'min', value: 1500 * 100_000_000 }
    ],
    4: [
      { metric: 'PER', op: 'range', value: [0, 6] },
      { metric: 'PBR', op: 'range', value: [0, 0.6] },
      { metric: 'ROE', op: 'min', value: 0.09 },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '시가총액', op: 'min', value: 2000 * 100_000_000 },
      { metric: '부채비율', op: 'max', value: 0.9 }
    ],
    5: [
      { metric: 'PER', op: 'range', value: [0, 5] },
      { metric: 'PBR', op: 'range', value: [0, 0.5] },
      { metric: 'ROE', op: 'min', value: 0.10 },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '시가총액', op: 'min', value: 2500 * 100_000_000 },
      { metric: '부채비율', op: 'max', value: 0.8 }
    ]
  },
  '그린블라트': {
    0: [],
    1: [
      { metric: 'EV/EBITDA', op: 'range', value: [0, 9] },
      { metric: 'ROA', op: 'min', value: 0.11 },
      { metric: '영업이익률', op: 'min', value: 0.11 }
    ],
    2: [
      { metric: 'EV/EBITDA', op: 'range', value: [0, 8] },
      { metric: 'ROA', op: 'min', value: 0.12 },
      { metric: '영업이익률', op: 'min', value: 0.12 }
    ],
    3: [
      { metric: 'EV/EBITDA', op: 'range', value: [0, 7] },
      { metric: 'ROA', op: 'min', value: 0.13 },
      { metric: '영업이익률', op: 'min', value: 0.13 },
      { metric: '시가총액', op: 'min', value: 4000 * 100_000_000 }
    ],
    4: [
      { metric: 'EV/EBITDA', op: 'range', value: [0, 6] },
      { metric: 'ROA', op: 'min', value: 0.14 },
      { metric: '영업이익률', op: 'min', value: 0.14 },
      { metric: '시가총액', op: 'min', value: 4500 * 100_000_000 }
    ],
    5: [
      { metric: 'EV/EBITDA', op: 'range', value: [0, 5] },
      { metric: 'ROA', op: 'min', value: 0.15 },
      { metric: '영업이익률', op: 'min', value: 0.15 },
      { metric: '시가총액', op: 'min', value: 5000 * 100_000_000 }
    ]
  },
  '코스톨라니': {
    0: [],
    1: [
      { metric: 'PER', op: 'range', value: [0, 14] },
      { metric: 'ROE', op: 'min', value: 0.11 },
      { metric: '이자보상배율', op: 'min', value: 6.0 }
    ],
    2: [
      { metric: 'PER', op: 'range', value: [0, 13] },
      { metric: 'ROE', op: 'min', value: 0.12 },
      { metric: '이자보상배율', op: 'min', value: 7.0 }
    ],
    3: [
      { metric: 'PER', op: 'range', value: [0, 12] },
      { metric: 'ROE', op: 'min', value: 0.13 },
      { metric: '이자보상배율', op: 'min', value: 8.0 },
      { metric: '부채비율', op: 'max', value: 0.9 },
      { metric: '시가총액', op: 'min', value: 12000 * 100_000_000 }
    ],
    4: [
      { metric: 'PER', op: 'range', value: [0, 11] },
      { metric: 'ROE', op: 'min', value: 0.14 },
      { metric: '이자보상배율', op: 'min', value: 9.0 },
      { metric: '부채비율', op: 'max', value: 0.8 },
      { metric: '시가총액', op: 'min', value: 15000 * 100_000_000 }
    ],
    5: [
      { metric: 'PER', op: 'range', value: [0, 10] },
      { metric: 'ROE', op: 'min', value: 0.15 },
      { metric: '이자보상배율', op: 'min', value: 10.0 },
      { metric: '부채비율', op: 'max', value: 0.7 },
      { metric: '시가총액', op: 'min', value: 20000 * 100_000_000 }
    ]
  },
  '슈웨거': {
    0: [],
    1: [
      { metric: '거래대금', op: 'min', value: 120 * 100_000_000 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.22 }
    ],
    2: [
      { metric: '거래대금', op: 'min', value: 150 * 100_000_000 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.25 },
      { metric: '부채비율', op: 'max', value: 0.9 }
    ],
    3: [
      { metric: '거래대금', op: 'min', value: 180 * 100_000_000 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.28 },
      { metric: '부채비율', op: 'max', value: 0.8 }
    ],
    4: [
      { metric: '거래대금', op: 'min', value: 200 * 100_000_000 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.30 },
      { metric: '부채비율', op: 'max', value: 0.7 }
    ],
    5: [
      { metric: '거래대금', op: 'min', value: 250 * 100_000_000 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.35 },
      { metric: '부채비율', op: 'max', value: 0.6 }
    ]
  },
  '버핏': {
    0: [],
    1: [
      { metric: '매출총이익률', op: 'min', value: 0.42 },
      { metric: 'ROE', op: 'min', value: 0.16 },
      { metric: '순이익률', op: 'min', value: 0.16 }
    ],
    2: [
      { metric: '매출총이익률', op: 'min', value: 0.45 },
      { metric: 'ROE', op: 'min', value: 0.17 },
      { metric: '순이익률', op: 'min', value: 0.17 },
      { metric: '부채비율', op: 'max', value: 0.9 }
    ],
    3: [
      { metric: '매출총이익률', op: 'min', value: 0.48 },
      { metric: 'ROE', op: 'min', value: 0.18 },
      { metric: '순이익률', op: 'min', value: 0.18 },
      { metric: '부채비율', op: 'max', value: 0.8 },
      { metric: '시가총액', op: 'min', value: 4000 * 100_000_000 }
    ],
    4: [
      { metric: '매출총이익률', op: 'min', value: 0.50 },
      { metric: 'ROE', op: 'min', value: 0.20 },
      { metric: '순이익률', op: 'min', value: 0.20 },
      { metric: '부채비율', op: 'max', value: 0.7 },
      { metric: '시가총액', op: 'min', value: 4500 * 100_000_000 }
    ],
    5: [
      { metric: '매출총이익률', op: 'min', value: 0.55 },
      { metric: 'ROE', op: 'min', value: 0.22 },
      { metric: '순이익률', op: 'min', value: 0.22 },
      { metric: '부채비율', op: 'max', value: 0.6 },
      { metric: '시가총액', op: 'min', value: 5000 * 100_000_000 }
    ]
  },
  '피셔': {
    0: [],
    1: [
      { metric: '연평균 매출액 증감률', op: 'min', value: 0.22 },
      { metric: '영업이익률', op: 'min', value: 0.11 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.11 },
      { metric: '부채비율', op: 'max', value: 1.8 }
    ],
    2: [
      { metric: '연평균 매출액 증감률', op: 'min', value: 0.25 },
      { metric: '영업이익률', op: 'min', value: 0.12 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.12 },
      { metric: '부채비율', op: 'max', value: 1.6 }
    ],
    3: [
      { metric: '연평균 매출액 증감률', op: 'min', value: 0.28 },
      { metric: '영업이익률', op: 'min', value: 0.13 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.13 },
      { metric: '부채비율', op: 'max', value: 1.4 }
    ],
    4: [
      { metric: '연평균 매출액 증감률', op: 'min', value: 0.30 },
      { metric: '영업이익률', op: 'min', value: 0.14 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.14 },
      { metric: '부채비율', op: 'max', value: 1.2 }
    ],
    5: [
      { metric: '연평균 매출액 증감률', op: 'min', value: 0.35 },
      { metric: '영업이익률', op: 'min', value: 0.15 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.15 },
      { metric: '부채비율', op: 'max', value: 1.0 }
    ]
  },
  '뉴욕주민': {
    0: [],
    1: [
      { metric: 'PER', op: 'range', value: [0, 18] },
      { metric: '영업이익률', op: 'min', value: 0.11 },
      { metric: 'ROE', op: 'min', value: 0.11 }
    ],
    2: [
      { metric: 'PER', op: 'range', value: [0, 16] },
      { metric: '영업이익률', op: 'min', value: 0.12 },
      { metric: 'ROE', op: 'min', value: 0.12 },
      { metric: '이자보상배율', op: 'min', value: 4.0 }
    ],
    3: [
      { metric: 'PER', op: 'range', value: [0, 15] },
      { metric: '영업이익률', op: 'min', value: 0.13 },
      { metric: 'ROE', op: 'min', value: 0.13 },
      { metric: '이자보상배율', op: 'min', value: 4.0 },
      { metric: '시가총액', op: 'min', value: 4000 * 100_000_000 },
      { metric: '부채비율', op: 'max', value: 0.9 }
    ],
    4: [
      { metric: 'PER', op: 'range', value: [0, 14] },
      { metric: '영업이익률', op: 'min', value: 0.14 },
      { metric: 'ROE', op: 'min', value: 0.14 },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '시가총액', op: 'min', value: 4500 * 100_000_000 },
      { metric: '부채비율', op: 'max', value: 0.8 }
    ],
    5: [
      { metric: 'PER', op: 'range', value: [0, 12] },
      { metric: '영업이익률', op: 'min', value: 0.15 },
      { metric: 'ROE', op: 'min', value: 0.15 },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '시가총액', op: 'min', value: 5000 * 100_000_000 },
      { metric: '부채비율', op: 'max', value: 0.7 }
    ]
  },
  '린치': {
    0: [],
    1: [
      { metric: 'PER', op: 'range', value: [0, 18] },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.22 },
      { metric: '영업이익률', op: 'min', value: 0.11 }
    ],
    2: [
      { metric: 'PER', op: 'range', value: [0, 16] },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.25 },
      { metric: '영업이익률', op: 'min', value: 0.12 },
      { metric: '부채비율', op: 'max', value: 0.9 }
    ],
    3: [
      { metric: 'PER', op: 'range', value: [0, 15] },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.28 },
      { metric: '영업이익률', op: 'min', value: 0.13 },
      { metric: '부채비율', op: 'max', value: 0.8 },
      { metric: '시가총액', op: 'min', value: 1500 * 100_000_000 }
    ],
    4: [
      { metric: 'PER', op: 'range', value: [0, 14] },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.30 },
      { metric: '영업이익률', op: 'min', value: 0.14 },
      { metric: '부채비율', op: 'max', value: 0.7 },
      { metric: '시가총액', op: 'min', value: 2000 * 100_000_000 },
      { metric: '거래대금', op: 'min', value: 8 * 100_000_000 }
    ],
    5: [
      { metric: 'PER', op: 'range', value: [0, 12] },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.35 },
      { metric: '영업이익률', op: 'min', value: 0.15 },
      { metric: '부채비율', op: 'max', value: 0.6 },
      { metric: '시가총액', op: 'min', value: 2500 * 100_000_000 },
      { metric: '거래대금', op: 'min', value: 10 * 100_000_000 }
    ]
  },
  '다모다란': {
    0: [],
    1: [
      { metric: 'PER', op: 'range', value: [0, 14] },
      { metric: 'PBR', op: 'range', value: [0, 1.4] },
      { metric: 'ROE', op: 'min', value: 0.11 },
      { metric: '영업이익률', op: 'min', value: 0.11 }
    ],
    2: [
      { metric: 'PER', op: 'range', value: [0, 13] },
      { metric: 'PBR', op: 'range', value: [0, 1.3] },
      { metric: 'ROE', op: 'min', value: 0.12 },
      { metric: '영업이익률', op: 'min', value: 0.12 },
      { metric: '이자보상배율', op: 'min', value: 4.0 },
      { metric: '부채비율', op: 'max', value: 1.8 }
    ],
    3: [
      { metric: 'PER', op: 'range', value: [0, 12] },
      { metric: 'PBR', op: 'range', value: [0, 1.2] },
      { metric: 'ROE', op: 'min', value: 0.13 },
      { metric: '영업이익률', op: 'min', value: 0.13 },
      { metric: '이자보상배율', op: 'min', value: 4.0 },
      { metric: '부채비율', op: 'max', value: 1.6 },
      { metric: '시가총액', op: 'min', value: 4000 * 100_000_000 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.11 }
    ],
    4: [
      { metric: 'PER', op: 'range', value: [0, 11] },
      { metric: 'PBR', op: 'range', value: [0, 1.1] },
      { metric: 'ROE', op: 'min', value: 0.14 },
      { metric: '영업이익률', op: 'min', value: 0.14 },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '부채비율', op: 'max', value: 1.4 },
      { metric: '시가총액', op: 'min', value: 4500 * 100_000_000 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.12 }
    ],
    5: [
      { metric: 'PER', op: 'range', value: [0, 10] },
      { metric: 'PBR', op: 'range', value: [0, 1.0] },
      { metric: 'ROE', op: 'min', value: 0.15 },
      { metric: '영업이익률', op: 'min', value: 0.15 },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '부채비율', op: 'max', value: 1.0 },
      { metric: '시가총액', op: 'min', value: 5000 * 100_000_000 },
      { metric: '연평균 순이익 증감률', op: 'min', value: 0.15 }
    ]
  },
  '템플턴': {
    0: [],
    1: [
      { metric: 'PER', op: 'range', value: [0, 18] },
      { metric: '이자보상배율', op: 'min', value: 3.5 }
    ],
    2: [
      { metric: 'PER', op: 'range', value: [0, 16] },
      { metric: '이자보상배율', op: 'min', value: 4.0 },
      { metric: '부채비율', op: 'max', value: 0.9 }
    ],
    3: [
      { metric: 'PER', op: 'range', value: [0, 15] },
      { metric: '이자보상배율', op: 'min', value: 4.0 },
      { metric: '부채비율', op: 'max', value: 0.8 },
      { metric: '시가총액', op: 'min', value: 4000 * 100_000_000 }
    ],
    4: [
      { metric: 'PER', op: 'range', value: [0, 14] },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '부채비율', op: 'max', value: 0.7 },
      { metric: '시가총액', op: 'min', value: 4500 * 100_000_000 }
    ],
    5: [
      { metric: 'PER', op: 'range', value: [0, 12] },
      { metric: '이자보상배율', op: 'min', value: 5.0 },
      { metric: '부채비율', op: 'max', value: 0.6 },
      { metric: '시가총액', op: 'min', value: 5000 * 100_000_000 }
    ]
  },
  '버리': {
    0: [],
    1: [
      { metric: 'PBR', op: 'range', value: [0, 0.9] },
      { metric: 'EV/EBITDA', op: 'range', value: [0, 9] },
      { metric: '부채비율', op: 'max', value: 1.8 }
    ],
    2: [
      { metric: 'PBR', op: 'range', value: [0, 0.8] },
      { metric: 'EV/EBITDA', op: 'range', value: [0, 8] },
      { metric: '부채비율', op: 'max', value: 1.6 }
    ],
    3: [
      { metric: 'PBR', op: 'range', value: [0, 0.7] },
      { metric: 'EV/EBITDA', op: 'range', value: [0, 7] },
      { metric: '부채비율', op: 'max', value: 1.4 },
      { metric: '시가총액', op: 'range', value: [500 * 100_000_000, 2500 * 100_000_000] }
    ],
    4: [
      { metric: 'PBR', op: 'range', value: [0, 0.6] },
      { metric: 'EV/EBITDA', op: 'range', value: [0, 6] },
      { metric: '부채비율', op: 'max', value: 1.2 },
      { metric: '시가총액', op: 'range', value: [800 * 100_000_000, 2000 * 100_000_000] },
      { metric: '거래대금', op: 'min', value: 8 * 100_000_000 }
    ],
    5: [
      { metric: 'PBR', op: 'range', value: [0, 0.5] },
      { metric: 'EV/EBITDA', op: 'range', value: [0, 5] },
      { metric: '부채비율', op: 'max', value: 1.0 },
      { metric: '시가총액', op: 'range', value: [1000 * 100_000_000, 1500 * 100_000_000] },
      { metric: '거래대금', op: 'min', value: 10 * 100_000_000 }
    ]
  }
}

function matchesRule(stock: Row, rule: FilterRule): boolean {
  const rawValue = stock[rule.metric]
  if (rawValue === undefined || rawValue === null) {
    return true // 지표 값이 없는 경우 안전하게 패스
  }
  const val = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue))
  if (isNaN(val)) {
    return true
  }

  if (rule.op === 'min') {
    return val >= (rule.value as number)
  }
  if (rule.op === 'max') {
    return val <= (rule.value as number)
  }
  if (rule.op === 'range') {
    const [min, max] = rule.value as [number, number]
    return val >= min && val <= max
  }
  return true
}

function filterStocks(stocks: Row[], screenerKey: string, step: number): Row[] {
  if (step === 0) return stocks
  const rules = SCREENER_RULES[screenerKey]?.[step]
  if (!rules || rules.length === 0) return stocks

  return stocks.filter((stock) => {
    return rules.every((rule) => matchesRule(stock, rule))
  })
}

export function ScreenerDataTable({
  screenerKey,
  initialNation = 'kr',
  onSelectTicker,
}: {
  screenerKey: string
  initialNation?: Nation
  onSelectTicker?: (ticker: string) => void
}) {
  const [nation, setNation] = useState<Nation>(initialNation)
  const [picks, setPicks] = useState<GuruPicks | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [sliderValue, setSliderValue] = useState<number>(0)
  const [completedTickers, setCompletedTickers] = useState<Set<string>>(new Set())
  const [analysisStatus, setAnalysisStatus] = useState<
    Record<string, 'idle' | 'collecting' | 'voting' | 'done' | 'error'>
  >({})
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false)
  const bulkStopRef = useRef(false)

  // 화면 접속 때 분석된 종목인지 확인해서 완료 표시 (오늘 날짜 기준)
  useEffect(() => {
    let alive = true
    fetchCompletedTickers().then((set) => {
      if (alive) setCompletedTickers(set)
    })
    return () => {
      alive = false
    }
  }, [])

  // 간단분석 실행 핸들러
  const handleQuickAnalysis = async (ticker: string, stockName: string, stockNation: Nation) => {
    if (completedTickers.has(ticker)) return
    const current = analysisStatus[ticker]
    if (current === 'collecting' || current === 'voting' || current === 'done') return

    try {
      // 1단계: spiner 데이터 수집중...
      setAnalysisStatus((prev) => ({ ...prev, [ticker]: 'collecting' }))
      const collectRes = await fetch(`/api/guru/collect?ticker=${encodeURIComponent(ticker)}`)
      const collectContentType = collectRes.headers.get('content-type') || ''
      if (!collectContentType.includes('application/json')) {
        const rawText = await collectRes.text().catch(() => '')
        throw new Error(
          `API 응답 오류 (HTML 수신됨): Vite 개발 서버가 재시작되지 않았거나 /api/guru/collect 엔드포인트를 찾을 수 없습니다. (응답: ${rawText.slice(0, 80)})`
        )
      }
      if (!collectRes.ok) {
        throw new Error(`데이터 수집 실패 (${collectRes.status})`)
      }
      const collectData = await collectRes.json()
      if (!collectData.success || !collectData.coreData) {
        throw new Error(collectData.error || '데이터 수집 내용이 없습니다.')
      }

      // 2단계: spiner 13인 판정중...
      setAnalysisStatus((prev) => ({ ...prev, [ticker]: 'voting' }))
      const voteRes = await fetch('/api/guru/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          date: getTodayString(),
          coreData: collectData.coreData,
          nation: stockNation,
          name: stockName,
        }),
      })

      const voteContentType = voteRes.headers.get('content-type') || ''
      if (!voteContentType.includes('application/json')) {
        const rawText = await voteRes.text().catch(() => '')
        throw new Error(
          `API 응답 오류 (HTML 수신됨): /api/guru/vote 엔드포인트 응답이 올바르지 않습니다. (응답: ${rawText.slice(0, 80)})`
        )
      }
      if (!voteRes.ok) {
        const voteErr = await voteRes.json().catch(() => null)
        throw new Error(voteErr?.error || `13인 판정 실패 (${voteRes.status})`)
      }
      const voteData = await voteRes.json()
      if (!voteData.success) {
        throw new Error(voteData.error || '13인 판정 처리에 실패했습니다.')
      }

      // 3단계: 클라이언트에서 직접 Supabase 저장 (API 서버 저장 실패 보완)
      try {
        await upsertVoteResult({
          d: getTodayString(),
          ticker,
          name: stockName,
          nation: stockNation,
          scores: voteData.scores ?? {},
          g0: voteData.g0 ?? null,
        })
      } catch (dbErr: any) {
        console.warn(`[QuickAnalysis] ${ticker} DB 저장 실패:`, dbErr.message)
      }

      // 4단계: 완료 및 비활성화 (실수로라도 재분석 불가)
      setAnalysisStatus((prev) => ({ ...prev, [ticker]: 'done' }))
      setCompletedTickers((prev) => new Set(prev).add(ticker))
    } catch (e: any) {
      console.error(`[QuickAnalysis] ${ticker} 실패:`, e)
      alert(`${ticker} 간단분석 실패: ${e.message}`)
      setAnalysisStatus((prev) => ({ ...prev, [ticker]: 'error' }))
    }
  }

  // 전체 간단분석: 미완료 종목을 순차적으로 분석
  const handleBulkAnalysis = useCallback(async () => {
    if (isBulkAnalyzing) {
      bulkStopRef.current = true
      setIsBulkAnalyzing(false)
      return
    }
    if (!filteredPicks) return
    const pending = filteredPicks.stocks.filter(
      (s) => !completedTickers.has(s.ticker) && analysisStatus[s.ticker] !== 'done',
    )
    if (pending.length === 0) return

    bulkStopRef.current = false
    setIsBulkAnalyzing(true)
    for (const stock of pending) {
      if (bulkStopRef.current) break
      await handleQuickAnalysis(stock.ticker, stock.name ?? stock.ticker, nation)
    }
    setIsBulkAnalyzing(false)
  }, [isBulkAnalyzing, filteredPicks, completedTickers, analysisStatus, handleQuickAnalysis, nation])

  // 거장이 바뀌면 슬라이더를 0단계로 초기화
  useEffect(() => {
    setSliderValue(0)
  }, [screenerKey])

  useEffect(() => {
    const controller = new AbortController()
    setState('loading')
    fetchGuruPicks(screenerKey, nation, 200, controller.signal)
      .then((data) => {
        setPicks(data)
        setState('ready')
      })
      .catch(() => {
        if (!controller.signal.aborted) setState('error')
      })
    return () => controller.abort()
  }, [screenerKey, nation, reloadKey])

  // 필터링 적용된 종목 리스트 연산
  const filteredStocks = useMemo(() => {
    if (!picks) return []
    const rawRows: Row[] = picks.stocks.map((stock) => ({
      ...stock,
      changePercent: changeRate(stock.price, stock.prevClose),
    }))
    return filterStocks(rawRows, screenerKey, sliderValue)
  }, [picks, screenerKey, sliderValue])

  // ResultTable에 전달할 mock picks 객체 생성
  const filteredPicks = useMemo<GuruPicks | null>(() => {
    if (!picks) return null
    return {
      ...picks,
      stocks: filteredStocks as Stock[],
    }
  }, [picks, filteredStocks])

  return (
    <div className="flex flex-col gap-4">
      {/* 슬라이더 컨트롤러 및 정보 영역 */}
      {state === 'ready' && picks && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
              🔧 조건 강화 옵션
              {sliderValue > 0 && (
                <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {sliderValue}단계 강화 적용중
                </span>
              )}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{sliderValue} / 5 단계</span>
          </div>
          
          <div className="flex items-center gap-4 py-1">
            <Slider
              value={[sliderValue]}
              onValueChange={(val) => setSliderValue(val[0])}
              min={0}
              max={5}
              step={1}
              className="flex-1"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5 font-medium">
            <span>0단계 (기본 필터)</span>
            <span>1단계</span>
            <span>2단계</span>
            <span>3단계</span>
            <span>4단계</span>
            <span>5단계 (최대 조건 강화)</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ResultCount
          totalCount={picks ? picks.totalCount : 0}
          filteredCount={filteredStocks.length}
          hasData={state === 'ready' && !!picks}
        />
        <div className="flex items-center gap-2">
          {state === 'ready' && filteredPicks && (() => {
            const pendingCount = filteredPicks.stocks.filter(
              (s) => !completedTickers.has(s.ticker) && analysisStatus[s.ticker] !== 'done',
            ).length
            return pendingCount > 0 ? (
              <Button
                variant={isBulkAnalyzing ? 'destructive' : 'outline'}
                size="xs"
                className="h-7 gap-1.5 px-2.5 text-[0.6875rem] font-medium"
                onClick={handleBulkAnalysis}
              >
                {isBulkAnalyzing ? (
                  <>
                    <HugeiconsIcon icon={RefreshFreeIcons} className="size-3 animate-spin" />
                    중지
                  </>
                ) : (
                  `전체 간단분석 (${pendingCount})`
                )}
              </Button>
            ) : null
          })()}
          <NationToggle nation={nation} onChange={setNation} />
        </div>
      </div>

      {state === 'loading' && <ResultSkeleton />}
      {state === 'error' && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}
      {state === 'ready' && filteredPicks && (
        <ResultTable
          picks={filteredPicks}
          onSelectTicker={onSelectTicker}
          completedTickers={completedTickers}
          analysisStatus={analysisStatus}
          onQuickAnalysis={handleQuickAnalysis}
          nation={nation}
        />
      )}
    </div>
  )
}

function ResultCount({
  totalCount,
  filteredCount,
  hasData,
}: {
  totalCount: number
  filteredCount: number
  hasData: boolean
}) {
  if (!hasData) return <span />
  return (
    <p className="text-[0.6875rem] text-muted-foreground">
      조건을 통과한 종목 {filteredCount.toLocaleString('ko-KR')}개
      {totalCount !== filteredCount && ` (기본 조건 통과 ${totalCount.toLocaleString('ko-KR')}개 중)`}
    </p>
  )
}

function NationToggle({ nation, onChange }: { nation: Nation; onChange: (n: Nation) => void }) {
  return (
    <div className="flex shrink-0 rounded-lg bg-muted p-[3px]">
      {(['kr', 'us'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            nation === value
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {value === 'kr' ? '국내' : '해외'}
        </button>
      ))}
    </div>
  )
}

function ResultTable({
  picks,
  onSelectTicker,
  completedTickers,
  analysisStatus,
  onQuickAnalysis,
  nation,
}: {
  picks: GuruPicks
  onSelectTicker?: (ticker: string) => void
  completedTickers: Set<string>
  analysisStatus: Record<string, 'idle' | 'collecting' | 'voting' | 'done' | 'error'>
  onQuickAnalysis: (ticker: string, stockName: string, nation: Nation) => void
  nation: Nation
}) {
  const [sorting, setSorting] = useState<SortingState>([])

  const rows = useMemo<Row[]>(
    () =>
      picks.stocks.map((stock) => ({
        ...stock,
        changePercent: changeRate(stock.price, stock.prevClose),
      })),
    [picks.stocks],
  )

  const metricKeys = useMemo(() => metricColumns(picks.stocks), [picks.stocks])

  const columns = useMemo<ColumnDef<Row>[]>(() => {
    const stockColumn: ColumnDef<Row> = {
      id: 'stock',
      header: '종목',
      enableSorting: false,
      cell: ({ row }) => <StockCell stock={row.original} />,
    }

    const priceColumn: ColumnDef<Row> = {
      id: 'price',
      accessorFn: (row) => row.price,
      header: '현재가',
      sortUndefined: 'last',
      cell: ({ row }) => (
        <PriceCell price={row.original.price} changePercent={row.original.changePercent} />
      ),
    }

    const metricColumnDefs: ColumnDef<Row>[] = metricKeys.map((key) => ({
      id: key,
      accessorFn: (row) => row[key],
      header: key,
      sortUndefined: 'last',
      sortingFn: (a, b, columnId) => {
        const av = a.getValue(columnId)
        const bv = b.getValue(columnId)
        const an = typeof av === 'number' ? av : null
        const bn = typeof bv === 'number' ? bv : null
        if (an === null && bn === null) return 0
        if (an === null) return 1
        if (bn === null) return -1
        return an - bn
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatMetric(key, row.original[key])}</span>
      ),
    }))

    const actionColumn: ColumnDef<Row> = {
      id: 'quickAnalysis',
      header: () => <span className="block text-center font-semibold">간단분석</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const ticker = row.original.ticker
        const isDone = completedTickers.has(ticker) || analysisStatus[ticker] === 'done'
        const status = isDone ? 'done' : analysisStatus[ticker] || 'idle'

        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            {status === 'done' ? (
              <Button
                variant="ghost"
                size="xs"
                disabled
                className="h-6 px-2 text-[0.6875rem] font-medium text-muted-foreground/80 cursor-not-allowed bg-muted/40"
              >
                완료
              </Button>
            ) : status === 'collecting' ? (
              <Button
                variant="secondary"
                size="xs"
                disabled
                className="h-6 gap-1 px-2 text-[0.6875rem] font-medium animate-pulse"
              >
                <HugeiconsIcon icon={RefreshFreeIcons} className="size-3 animate-spin text-primary" />
                데이터 수집중...
              </Button>
            ) : status === 'voting' ? (
              <Button
                variant="secondary"
                size="xs"
                disabled
                className="h-6 gap-1 px-2 text-[0.6875rem] font-medium animate-pulse"
              >
                <HugeiconsIcon icon={RefreshFreeIcons} className="size-3 animate-spin text-primary" />
                13인 판정중...
              </Button>
            ) : status === 'error' ? (
              <Button
                variant="destructive"
                size="xs"
                className="h-6 px-2 text-[0.6875rem]"
                onClick={(e) => {
                  e.stopPropagation()
                  onQuickAnalysis(ticker, row.original.name, nation)
                }}
              >
                재시도
              </Button>
            ) : (
              <Button
                variant="outline"
                size="xs"
                className="h-6 px-2 text-[0.6875rem] font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onQuickAnalysis(ticker, row.original.name, nation)
                }}
              >
                간단분석
              </Button>
            )}
          </div>
        )
      },
    }

    return [stockColumn, priceColumn, ...metricColumnDefs, actionColumn]
  }, [metricKeys, completedTickers, analysisStatus, onQuickAnalysis, nation])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (picks.stocks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium">조건을 통과한 종목이 없어요</p>
        <p className="text-xs text-muted-foreground">
          {picks.loosen ? `풀려면: ${picks.loosen}` : '필터가 너무 엄격합니다'}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-max">
        <TableHeader className="bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort()
                const sortDir = header.column.getIsSorted()
                const isStockColumn = header.column.id === 'stock'

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-muted-foreground',
                      !isStockColumn && 'text-right',
                      sortable && 'cursor-pointer select-none hover:text-foreground',
                    )}
                    onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        !isStockColumn && 'justify-end',
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortable && (
                        <HugeiconsIcon
                          icon={
                            sortDir === 'asc'
                              ? ArrowUp01FreeIcons
                              : sortDir === 'desc'
                                ? ArrowDown01FreeIcons
                                : ArrowUpDownFreeIcons
                          }
                          className={cn(
                            'size-3',
                            sortDir ? 'text-foreground' : 'text-muted-foreground/50',
                          )}
                        />
                      )}
                    </span>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const ticker = row.original.ticker
            const clickable = !!onSelectTicker && !!ticker
            return (
              <TableRow
                key={row.id}
                onClick={clickable ? () => onSelectTicker!(ticker) : undefined}
                className={cn(clickable && 'cursor-pointer hover:bg-muted/40')}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(cell.column.id !== 'stock' && 'text-right')}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function StockCell({ stock }: { stock: Stock }) {
  return (
    <div className="flex items-center gap-2">
      {stock.logoImageUrl && (
        <img
          src={stock.logoImageUrl}
          alt=""
          loading="lazy"
          className="size-5 shrink-0 rounded-full"
        />
      )}
      <div className="flex flex-col leading-tight">
        <span className="font-medium whitespace-nowrap">{stock.name}</span>
        {stock.ticker && (
          <span className="font-mono text-[0.6875rem] text-muted-foreground">{stock.ticker}</span>
        )}
      </div>
    </div>
  )
}

function PriceCell({
  price,
  changePercent,
}: {
  price: number | null
  changePercent: number | null
}) {
  return (
    <span className="whitespace-nowrap">
      <span>{formatPrice(price)}</span>
      {changePercent !== null && (
        <span
          className={cn(
            'ml-1.5 text-[0.6875rem]',
            changePercent > 0 && 'text-red-600 dark:text-red-400',
            changePercent < 0 && 'text-blue-600 dark:text-blue-400',
            changePercent === 0 && 'text-muted-foreground',
          )}
        >
          {changePercent > 0 ? '+' : ''}
          {changePercent.toFixed(2)}%
        </span>
      )}
    </span>
  )
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="종목을 불러오고 있어요">
      <Skeleton className="h-9 w-full" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
      <p className="pt-1 text-center text-[0.6875rem] text-muted-foreground">
        서버가 잠들어 있으면 첫 조회에 30초 정도 걸릴 수 있어요
      </p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <p className="text-sm font-medium">종목을 불러오지 못했어요</p>
      <p className="text-xs text-muted-foreground">
        스크리너 서버가 깨어나는 중일 수 있어요. 잠시 뒤 다시 시도해 주세요.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <HugeiconsIcon icon={RefreshFreeIcons} data-icon="inline-start" />
        다시 시도
      </Button>
    </div>
  )
}
