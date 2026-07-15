// 거장 목록 공유 모듈 (13인) 및 대표 도서 정보 매핑
// Dashboard.tsx 내부 상수였던 GURUS_INFO를 여러 화면(Dashboard/거장 상세/스크리너)에서
// 공유할 수 있도록 승격했다.

export interface GuruInfo {
  key: string
  name: string
  style: string
  bookFilename: string
  bookTitle: string
  screenerKey: string // 백엔드 /toss/{key} 프리셋 키
}

export const GURUS_INFO: GuruInfo[] = [
  { key: '뉴욕주민', name: '뉴욕주민', style: '가치투자 / 월스트리트 트레이더', bookFilename: '미국_주식_투자지도_요약.md', bookTitle: '미국 주식 투자지도', screenerKey: '뉴욕주민' },
  { key: '마이클-버리', name: '마이클 버리', style: '역발상 / 딥 밸류', bookFilename: '빅쇼트.md', bookTitle: '빅쇼트', screenerKey: '버리' },
  { key: '모니시-파브라이', name: '모니시 파브라이', style: '단도 투자 / 고집적 가치투자', bookFilename: '단도 투자.md', bookTitle: '단도 투자', screenerKey: '파브라이' },
  { key: '벤저민-그레이엄', name: '벤저민 그레이엄', style: '계량 가치투자 / 안전마진', bookFilename: '현명한_투자자.md', bookTitle: '현명한 투자자', screenerKey: '그레이엄' },
  { key: '세스-클라먼', name: '세스 클라먼', style: '보수적 가치투자 / 안전마진', bookFilename: '안전마진.md', bookTitle: '안전마진', screenerKey: '클라먼' },
  { key: '앙드레-코스톨라니', name: '앙드레 코스톨라니', style: '투자 심리학 / 달걀 모형', bookFilename: '돈_뜨겁게_사랑하고_차갑게_다루어라.md', bookTitle: '돈 뜨겁게 사랑하고 차갑게 다루어라', screenerKey: '코스톨라니' },
  { key: '애스워스-다모다란', name: '애스워스 다모다란', style: '뉴욕대 가치평가 거장', bookFilename: '주식_가치평가_완벽정리.md', bookTitle: '주식 가치평가 완벽정리', screenerKey: '다모다란' },
  { key: '워런-버핏', name: '워런 버핏', style: '경제적 해자 / 장기 복리', bookFilename: '워런_버핏의_재무제표_활용법_요약.md', bookTitle: '워런 버핏의 재무제표 활용법', screenerKey: '버핏' },
  { key: '잭-슈웨거', name: '잭 슈웨거', style: '시장 마법사 / 트레이딩 거장', bookFilename: '마켓_위저드.md', bookTitle: '마켓 위저드', screenerKey: '슈웨거' },
  { key: '조엘-그린블라트', name: '조엘 그린블라트', style: '마법공식 / 고자본수익률', bookFilename: '주식시장을 이기는 작은 책.md', bookTitle: '주식시장을 이기는 작은 책', screenerKey: '그린블라트' },
  { key: '존-템플턴', name: '존 템플턴', style: '글로벌 역발상 / 영적 투자자', bookFilename: '주식_투자_원칙.md', bookTitle: '주식 투자 원칙', screenerKey: '템플턴' },
  { key: '피터-린치', name: '피터 린치', style: '생활 속 발견 / 가브 성장주', bookFilename: '이기는_투자.md', bookTitle: '이기는 투자', screenerKey: '린치' },
  { key: '필립-피셔', name: '필립 피셔', style: '위대한 기업 / 사실수집(Scuttlebutt)', bookFilename: '위대한_기업에_투자하라.md', bookTitle: '위대한 기업에 투자하라', screenerKey: '피셔' },
]
