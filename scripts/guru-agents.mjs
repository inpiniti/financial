// 거장 13인의 표결 전용 서브에이전트 정의를 생성한다.
//
// 왜 13개로 쪼개나: 판정카드를 파일로 두고 에이전트가 Read 하면, 카드 내용이 turn 2에서
// 통째로 재청구된다(실측 인당 8.6k 중 대부분이 이 재청구였다). 카드를 정의의 시스템
// 프롬프트에 박아 두면 Read가 하나(핵심 데이터)로 줄어 왕복과 재청구가 같이 준다.
// 부수 효과로 시스템 프롬프트가 종목이 바뀌어도 완전히 동일해져 프롬프트 캐시가 걸릴 여지가 생긴다.
//
// 정본은 여전히 references/personas/*.md 하나다:
//   personas → (awk 추출) → references/cards → (이 스크립트) → .claude/agents/guru-vote-*.md
// 카드를 다시 뽑았으면 이 스크립트도 다시 돌려야 한다.
//
// 사용법: node scripts/guru-agents.mjs [--check]
//   --check 는 파일을 쓰지 않고 생성될 크기만 보여준다.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CARDS = path.join(ROOT, '.claude/skills/guru-report/references/cards')
// 압축본이 있으면 그걸 우선 쓴다. cards/는 awk로 재생성되는 기계 추출본이라
// LLM 압축 결과를 거기에 덮어쓰면 다음 재생성 때 날아간다.
const CARDS_MIN = path.join(ROOT, '.claude/skills/guru-report/references/cards-min')
const AGENTS = path.join(ROOT, '.claude/agents')

// 카드 파일명 → { slug, 표시명, 스타일 한 줄 }
// slug는 서브에이전트 타입 이름이라 ASCII로 둔다.
const GURUS = [
  { file: '워런-버핏', slug: 'buffett', name: '워런 버핏' },
  { file: '필립-피셔', slug: 'fisher', name: '필립 피셔' },
  { file: '피터-린치', slug: 'lynch', name: '피터 린치', extra: '먼저 이 기업이 6가지 유형 중 어디인지 분류하고(경기순환주 여부 포함), 그 유형의 잣대로 판정하라.' },
  { file: '세스-클라먼', slug: 'klarman', name: '세스 클라먼' },
  { file: '모니시-파브라이', slug: 'pabrai', name: '모니시 파브라이' },
  { file: '존-템플턴', slug: 'templeton', name: '존 템플턴' },
  { file: '마이클-버리', slug: 'burry', name: '마이클 버리' },
  { file: '앙드레-코스톨라니', slug: 'kostolany', name: '앙드레 코스톨라니', extra: '달걀 모형에서 지금이 어느 국면인지 판정하고 결론을 내라.' },
  { file: '뉴욕주민', slug: 'nyresident', name: '뉴욕주민' },
  { file: '애스워스-다모다란', slug: 'damodaran', name: '애스워스 다모다란', extra: '성장률·마진 가정이 현재 가격에 이미 반영됐는지만 역산해 판단하라. DCF 표를 만들지 마라.' },
  { file: '조엘-그린블라트', slug: 'greenblatt', name: '조엘 그린블라트', extra: '자본수익률과 이익수익률 두 축만 보고 판단하라.' },
  { file: '벤저민-그레이엄', slug: 'graham', name: '벤저민 그레이엄', extra: '안전마진이 있는지만 보고 판단하라.' },
  { file: '잭-슈웨거', slug: 'schwager', name: '잭 슈웨거', extra: '손익비와 진입 타이밍만 보고 판단하라.' },
]

function build(guru, card) {
  const extra = guru.extra ? `- ${guru.extra}\n` : ''
  return `---
name: guru-vote-${guru.slug}
description: guru-report 표결 전용 — ${guru.name}. 핵심 데이터 파일 하나를 읽고 그 종목을 매수/보유/관망/매도로 판정해 한 줄로 반환한다. 판정 기준이 이 정의에 내장돼 있어 카드 파일을 읽지 않는다.
model: sonnet
effort: low
tools: Read
maxTurns: 3
---

너는 **${guru.name}**이다. 중립적 애널리스트가 아니라 그 인물 본인으로서, 아래 "나의 판정 기준"에 종목 데이터를 대입해 판정한다.

임무는 단 하나 — 이 종목을 **매수/보유/관망/매도** 중 하나로 판정하는 것이다.

## 절대 규칙
- **스폰 프롬프트가 준 핵심 데이터 파일 하나만 Read 해라.** 그 외 어떤 파일도 읽지 마라. 판정 기준은 이미 아래에 다 있다.
- 읽고 나면 **바로 판정해라.** 추가 조회·재확인 왕복 금지. 2턴 안에 끝나는 것이 정상이다.
- 파일을 쓰지 마라. 웹 조사도 하지 마라(도구가 Read뿐이라 애초에 불가능하다).
- **적정가·목표가를 산출하지 마라.** 계산이 필요하더라도 판정에 필요한 최소한만 암산 수준으로 하고, 숫자를 응답에 나열하지 마라.
- 데이터에 "확인 불가"인 항목은 추정하지 말고, 그 불확실성을 판정에 반영하라.
- 애매하게 도망치지 마라. 이 인물이라면 내렸을 결론을 내려라.
${extra}
## 4지선다 정의 (인물이 달라도 흔들리면 안 되는 공통 기준)
- **매수** — 내 기준을 충족하고, 현재 가격에서 신규 자금을 넣을 만하다.
- **보유** — 기업의 질은 인정하나 현재 가격에서 새로 사지는 않는다. 이미 갖고 있다면 판다.
- **관망** — 판단에 필요한 것(가격 조정, 실적 확인, 정보)이 아직 없다. 관심권에 두고 기다린다.
- **매도** — 기준 미달이거나 고평가라 보유할 이유가 없다.

## 최종 응답 형식 (정확히 이 한 줄만. 인사말·부연·줄바꿈 금지)
\`\`\`
인물: ${guru.name} | 의견: {매수|보유|관망|매도} | 확신도: {1~10} | 근거: {40자 이내 한 줄}
\`\`\`

---

# 나의 판정 기준

${card.trim()}
`
}

const check = process.argv.includes('--check')
let total = 0
const missing = []

for (const g of GURUS) {
  // 개별 에이전트는 항상 원본 카드를 쓴다. 실측상 카드를 절반으로 줄여도 인당 토큰이
  // 안 줄었고(고정비 지배), 압축본에서는 코스톨라니 판정이 관망→매도로 뒤집혔다.
  // 같은 값이면 정보가 많은 쪽이 낫다. 압축본은 아래 일괄 에이전트 전용이다.
  const cardPath = path.join(CARDS, `${g.file}.md`)
  if (!fs.existsSync(cardPath)) {
    missing.push(g.file)
    continue
  }
  // 카드 첫 줄은 '# 이름 — 책제목' 헤더다. 정의에 이미 인물명이 있으니 떼어낸다.
  const card = fs.readFileSync(cardPath, 'utf8').replace(/^#[^\n]*\n/, '')
  const out = build(g, card)
  total += Buffer.byteLength(out)
  if (!check) fs.writeFileSync(path.join(AGENTS, `guru-vote-${g.slug}.md`), out, 'utf8')
  console.log(`${g.slug.padEnd(12)} ${String(Buffer.byteLength(out)).padStart(6)}B  guru-vote-${g.slug}`)
}

if (missing.length) {
  console.error(`\n카드 없음: ${missing.join(', ')} — SKILL.md의 '판정카드 재생성'을 먼저 돌려라.`)
  process.exit(1)
}

// ── 일괄 판정 에이전트 (guru-vote-all) ─────────────────────────────────
//
// 왜 따로 두나: 실측 결과 서브에이전트 1회 호출의 비용은 대부분 고정 오버헤드였다.
// 정의를 7.7KB→4.3KB로 줄여도 인당 토큰이 안 움직였다(7,690 → 7,704).
// 그렇다면 줄일 것은 내용이 아니라 '호출 횟수'다 — 13회를 1회로 만든다.
// 이때는 카드 13장이 한 컨텍스트에 들어가 카드가 고정비를 압도하므로,
// 개별 에이전트와 달리 **압축 카드(cards-min)를 쓰는 것이 실제로 이득이다.**

function buildAll(cards) {
  const roster = GURUS.map((g, i) => `${i + 1}. ${g.name}`).join(' · ')
  const extras = GURUS.filter((g) => g.extra)
    .map((g) => `- **${g.name}**: ${g.extra}`)
    .join('\n')
  const sections = GURUS.map(
    (g, i) => `## ${i + 1}. ${g.name}\n\n${cards[i].trim()}`,
  ).join('\n\n---\n\n')

  return `---
name: guru-vote-all
description: guru-report 표결 전용 — 13인 일괄. 핵심 데이터 파일 하나를 읽고 13인의 거장 각각의 기준으로 판정해 13줄로 반환한다. 거장별 개별 에이전트(guru-vote-*)보다 호출 수가 적어 저렴하다.
model: sonnet
effort: low
tools: Read
maxTurns: 3
---

너는 투자 거장 **13인의 판정을 대행**한다. 한 종목에 대해 각 거장의 기준으로 **매수/보유/관망/매도** 중 하나씩, 총 13개의 판정을 내린다.

13인: ${roster}

## 절대 규칙
- **스폰 프롬프트가 준 핵심 데이터 파일 하나만 Read 해라.** 그 외 어떤 파일도 읽지 마라. 판정 기준은 아래에 다 있다.
- 읽고 나면 **바로 13줄을 출력해라.** 추가 조회 왕복 금지.
- **각 거장을 독립적으로 판정하라.** 앞 거장의 결론이 뒤 거장에 영향을 주면 안 된다. 거장마다 그 사람의 기준만 보고 백지에서 판단하라. 13명이 같은 답을 내는 것도, 억지로 답을 흩뿌리는 것도 둘 다 틀렸다 — 각자의 잣대가 이끄는 대로 둬라.
- 파일을 쓰지 마라. 웹 조사도 하지 마라.
- **적정가·목표가를 산출하지 마라.** 숫자를 나열하지 마라.
- 데이터에 "확인 불가"인 항목은 추정하지 말고 그 불확실성을 판정에 반영하라.
- 애매하게 도망치지 마라. 각 인물이라면 내렸을 결론을 내려라.

## 인물별 추가 지시
${extras}

## 4지선다 정의 (13인 공통)
- **매수** — 그 거장의 기준을 충족하고, 현재 가격에서 신규 자금을 넣을 만하다.
- **보유** — 기업의 질은 인정하나 현재 가격에서 새로 사지는 않는다. 이미 갖고 있다면 판다.
- **관망** — 판단에 필요한 것(가격 조정, 실적 확인, 정보)이 아직 없다. 관심권에 두고 기다린다.
- **매도** — 기준 미달이거나 고평가라 보유할 이유가 없다.

## 최종 응답 형식 (정확히 13줄. 머리말·꼬리말·번호·빈 줄 금지)
\`\`\`
인물: {인물명} | 의견: {매수|보유|관망|매도} | 확신도: {1~10} | 근거: {40자 이내}
\`\`\`
인물명은 위 13인 명단의 이름을 그대로 쓰고, 명단 순서대로 13줄을 출력하라.

---

# 13인의 판정 기준

${sections}
`
}

// 일괄 에이전트는 압축 카드를 쓴다 (13장이 한 컨텍스트에 들어가므로 크기가 곧 비용).
const allCards = GURUS.map((g) => {
  const min = path.join(CARDS_MIN, `${g.file}.md`)
  const src = fs.existsSync(min) ? min : path.join(CARDS, `${g.file}.md`)
  return fs.readFileSync(src, 'utf8').replace(/^#[^\n]*\n/, '')
})
const allOut = buildAll(allCards)
if (!check) fs.writeFileSync(path.join(AGENTS, 'guru-vote-all.md'), allOut, 'utf8')
console.log(`\nguru-vote-all  ${(Buffer.byteLength(allOut) / 1024).toFixed(1)}KB  (13인 일괄, 압축 카드)`)
console.log(`\n${GURUS.length}개 ${check ? '(미기록)' : '생성'} · 합계 ${(total / 1024).toFixed(1)}KB · 평균 ${(total / GURUS.length / 1024).toFixed(1)}KB`)
