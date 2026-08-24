-- guru-report 표결 저장 테이블.
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여 넣고 한 번 실행하면 된다.
--
-- 컬럼 번호 = 종합 스크리너 프리셋 순서(app/src/components/screener-data-table.tsx 의
-- SCREENER_RULES 키 순서)와 동일하게 맞췄다. 0은 거장이 아니라 13인 표결의 파생 종합값이다.
--   g0  종합(파생: 최빈값, 동률이면 보수적인 쪽)
--   g1  벤저민 그레이엄      g8   필립 피셔
--   g2  세스 클라먼          g9   뉴욕주민
--   g3  모니시 파브라이      g10  피터 린치
--   g4  조엘 그린블라트      g11  애스워스 다모다란
--   g5  앙드레 코스톨라니    g12  존 템플턴
--   g6  잭 슈웨거            g13  마이클 버리
--   g7  워런 버핏
--
-- 점수: 0 매수 / 1 보유 / 2 관망 / 3 매도 (숫자가 클수록 부정적 — 정렬하면 그대로 랭킹)
-- NULL = 아직 판정 안 됨(또는 그 거장 실패).

create table if not exists public.guru_votes (
  d           date        not null,
  ticker      text        not null,
  name        text,
  nation      text        not null default 'us',
  screeners   text[],                     -- 이 종목을 올려보낸 스크리너 목록
  g0  smallint, g1  smallint, g2  smallint, g3  smallint, g4  smallint,
  g5  smallint, g6  smallint, g7  smallint, g8  smallint, g9  smallint,
  g10 smallint, g11 smallint, g12 smallint, g13 smallint,
  updated_at  timestamptz not null default now(),
  primary key (d, ticker),
  constraint guru_votes_score_range check (
    coalesce(g0,0)  between 0 and 3 and coalesce(g1,0)  between 0 and 3 and
    coalesce(g2,0)  between 0 and 3 and coalesce(g3,0)  between 0 and 3 and
    coalesce(g4,0)  between 0 and 3 and coalesce(g5,0)  between 0 and 3 and
    coalesce(g6,0)  between 0 and 3 and coalesce(g7,0)  between 0 and 3 and
    coalesce(g8,0)  between 0 and 3 and coalesce(g9,0)  between 0 and 3 and
    coalesce(g10,0) between 0 and 3 and coalesce(g11,0) between 0 and 3 and
    coalesce(g12,0) between 0 and 3 and coalesce(g13,0) between 0 and 3
  )
);

create index if not exists guru_votes_d_idx on public.guru_votes (d desc);

-- 화면은 publishable(anon) 키로 읽기만 한다. 쓰기는 service_role 키를 쓰는
-- scripts/guru-db.mjs 만 하며, service_role은 RLS를 우회하므로 정책이 따로 필요 없다.
alter table public.guru_votes enable row level security;

drop policy if exists guru_votes_read on public.guru_votes;
create policy guru_votes_read on public.guru_votes for select to anon, authenticated using (true);
