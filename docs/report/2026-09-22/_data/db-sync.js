const fs = require('fs');
const path = require('path');

// Load env
const envPath = 'C:/Users/user/repositories/my/financial/.env';
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['\"]|['\"]$/g, '');
  }
}

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;

if (!URL || !KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const TABLE = URL + '/rest/v1/guru_votes';
const HEADERS = {
  apikey: KEY,
  Authorization: 'Bearer ' + KEY,
  'Content-Type': 'application/json',
};

async function rest(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(init.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + text.slice(0, 300));
  return text ? JSON.parse(text) : null;
}

const GURU_COLUMNS = [
  { col: 'g1', key: '그레이엄', full: '벤저민 그레이엄' },
  { col: 'g2', key: '클라먼', full: '세스 클라먼' },
  { col: 'g3', key: '파브라이', full: '모니시 파브라이' },
  { col: 'g4', key: '그린블라트', full: '조엘 그린블라트' },
  { col: 'g5', key: '코스톨라니', full: '앙드레 코스톨라니' },
  { col: 'g6', key: '슈웨거', full: '잭 슈웨거' },
  { col: 'g7', key: '버핏', full: '워런 버핏' },
  { col: 'g8', key: '피셔', full: '필립 피셔' },
  { col: 'g9', key: '뉴욕주민', full: '뉴욕주민' },
  { col: 'g10', key: '린치', full: '피터 린치' },
  { col: 'g11', key: '다모다란', full: '애스워스 다모다란' },
  { col: 'g12', key: '템플턴', full: '존 템플턴' },
  { col: 'g13', key: '버리', full: '마이클 버리' },
];

const SCORE = { '매수': 0, '보유': 1, '관망': 2, '매도': 3 };

// Parse votes
const votesText = fs.readFileSync('C:/Users/user/repositories/my/financial/docs/report/2026-09-22/_data/votes.txt', 'utf8');
const VOTE_LINE = /인물:\s*([^|]+?)\s*\|\s*의견:\s*(매수|보유|관망|매도)/g;

const scores = {};
const unknown = [];
for (const m of votesText.matchAll(VOTE_LINE)) {
  const who = m[1].replace(/\s/g, '');
  const hit = GURU_COLUMNS.find(g => who.includes(g.key));
  if (!hit) {
    unknown.push(m[1].trim());
    continue;
  }
  scores[hit.col] = SCORE[m[2]];
}

// Synthesize g0
const counts = [0, 0, 0, 0];
let total = 0;
for (const g of GURU_COLUMNS) {
  const v = scores[g.col];
  if (typeof v === 'number') {
    counts[v]++;
    total++;
  }
}

let maxCount = 0;
let maxIdx = 0;
for (let i = 0; i < counts.length; i++) {
  if (counts[i] > maxCount) {
    maxCount = counts[i];
    maxIdx = i;
  } else if (counts[i] === maxCount && counts[i] > 0 && i > maxIdx) {
    maxIdx = i;
  }
}

scores.g0 = total > 0 ? maxIdx : null;

console.log('Parsed scores:', scores);
console.log('Unknown:', unknown);
console.log('Total parsed:', total);
console.log('Synthesized g0:', scores.g0);

// Upsert
const row = { d: '2026-09-22', ticker: 'LRCX', name: 'Lam Research Corporation', ...scores };
console.log('Row to insert:', row);

async function main() {
  try {
    // Check existing
    const existing = await rest(TABLE + '?d=eq.2026-09-22&ticker=eq.LRCX');
    if (existing && existing.length > 0) {
      // Update
      const result = await rest(TABLE + '?d=eq.2026-09-22&ticker=eq.LRCX', {
        method: 'PATCH',
        body: JSON.stringify(row),
      });
      console.log('Updated:', result);
    } else {
      // Insert
      const result = await rest(TABLE, {
        method: 'POST',
        body: JSON.stringify(row),
      });
      console.log('Inserted:', result);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();