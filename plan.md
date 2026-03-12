# BibleRun - 성경 구절 반복 재생 웹앱 구현 계획

## Context
bible_verses_tts 폴더에 64개의 성경 구절 TTS 파일이 WAV + MP3 양쪽 모두 준비되어 있고, 이를 반복 재생하는 웹 플레이어를 만든다.
bible_verses.json에 64개 구절의 텍스트가 대한성서공회(개역개정)에서 크롤링 완료되어 있다.
디자인 시안이 제공되었으며, React + Vite 기반으로 구현한다.

## 이미 완료된 사전 작업
- WAV → MP3 변환 완료 (64개, bible_verses_tts/*.mp3)
- 성경 구절 텍스트 크롤링 완료 (bible_verses.json, crawl_verses.py)
- bible_verses.json 스키마: id, filename, book, chapter, start_verse, end_verse, reference, text

## 기술 스택
- React 18 + TypeScript + Vite
- react-router-dom (페이지 라우팅)
- lucide-react (아이콘)
- Vitest (단위 테스트)
- CSS Modules + CSS Custom Properties (스타일링)
- Google Fonts: Playfair Display (로고), Noto Sans KR (UI), Noto Serif KR (구절 텍스트)

## 디자인 토큰
- Primary Color: #3d5a3d (다크 그린)
- Background: #ffffff (흰색)
- Text: #1a1a1a (거의 검정)
- Border: #e5e5e5
- 최대 너비: 800px

## 폴더 구조

- bible_verses_tts/ — 원본 WAV + 변환된 MP3 64개 (소스 보관용)
- bible_verses.json — 크롤링된 구절 데이터 (가공 전 원본)
- crawl_verses.py — 대한성서공회 크롤링 스크립트 (완료, 재실행 가능)
- public/audio/ — 웹 배포용 MP3 파일 64개 (bible_verses_tts에서 복사)
- scripts/generate-verses.ts — bible_verses.json을 가공하여 verses.json 최종 생성
- src/components/layout/ — Header, Layout
- src/components/player/ — VerseDisplay, ProgressBar, PlayerControls, SpeedSelector
- src/components/playlist/ — Playlist, PlaylistItem, PlaylistHeader, RepeatCounter, AddVerseModal
- src/context/PlayerContext.tsx — 핵심 상태 관리
- src/context/__tests__/playerReducer.test.ts — Reducer 단위 테스트
- src/utils/__tests__/parseFileName.test.ts — 파일명 파싱 단위 테스트
- src/hooks/useAudioPlayer.ts — 오디오 제어
- src/data/verses.json — 구절 데이터
- src/types/index.ts — 타입 정의
- src/pages/ — HomePage, LibraryPage, AboutPage
- src/utils/ — formatTime, parseFileName

---

## Phase 1: 프로젝트 셋업

### TODO 1-1: Vite + React + TypeScript 프로젝트 초기화
- npm create vite@latest로 프로젝트 스캐폴딩 (현재 디렉토리에)
- react-router-dom, lucide-react 패키지 설치
- vitest 개발 의존성 설치
- 기본 Vite 보일러플레이트 정리

### TODO 1-2: 오디오 파일 배치
- bible_verses_tts/*.mp3 (이미 변환 완료된 64개)를 public/audio/로 복사
- 원본 WAV 파일은 복사하지 않음 (웹 배포용은 MP3만 사용)

### TODO 1-3: verses.json 최종 가공
- 이미 크롤링 완료된 bible_verses.json을 기반으로 src/data/verses.json 생성
- bible_verses.json에 이미 있는 필드: id, filename, book, chapter, start_verse, end_verse, reference, text
- 추가 가공이 필요한 필드:
  - audioFile: filename으로부터 MP3 경로 조합 (예: "/audio/01_로마서_10_9_10.mp3")
  - bookEn: 한국어 책이름 → 영문 책이름 매핑 (예: 로마서 → Romans)
  - displayName: reference 필드 그대로 활용 (예: "로마서 10:9-10")
  - displayNameEn: 영문 조합 (예: "Romans 10:9-10")
  - duration: ffprobe로 public/audio/*.mp3에서 재생 시간(초) 추출
  - verseSuffix: filename에서 a/b 접미사 추출 (해당되는 경우)
- 가공 스크립트(scripts/generate-verses.ts 또는 간단한 Node 스크립트)로 일괄 처리
- 최종 결과를 src/data/verses.json에 저장

---

## Phase 2: 데이터 레이어

### TODO 2-1: TypeScript 타입 정의
- src/types/index.ts 파일 생성
- Verse 타입: 구절 메타데이터 (id, filename, book, bookEn, chapter, startVerse, endVerse, verseSuffix, reference, displayNameEn, text, audioFile, duration)
- PlaylistItem 타입: 재생목록 항목 (verseId, enabled, repeatCount, order)
- PlayerState 타입: 전체 재생 상태 (playlist, isPlaying, currentIndex, currentRepeatIteration, globalRepeatCount, globalRepeatIteration, infiniteLoop, speed)

### TODO 2-2: PlayerContext 상태 관리
- src/context/PlayerContext.tsx에 useReducer 기반 상태 관리 구현
- reducer 함수는 별도로 export하여 테스트 가능하게 분리
- 지원 액션 목록:
  - PLAY, PAUSE, TOGGLE_PLAY — 재생/일시정지 제어
  - SEEK — 특정 위치로 이동
  - SET_SPEED — 재생 속도 변경
  - TOGGLE_INFINITE_LOOP — 무한 반복 토글
  - ADD_VERSE — 재생목록에 구절 추가
  - REMOVE_VERSE — 재생목록에서 구절 제거
  - TOGGLE_VERSE_ENABLED — 개별 구절 활성/비활성 토글
  - SET_VERSE_REPEAT — 개별 구절 반복 횟수 설정
  - SET_GLOBAL_REPEAT — 전체 반복 횟수 설정
  - ADVANCE_TO_NEXT — 다음 구절로 진행 (핵심 로직)
  - JUMP_TO_VERSE — 특정 구절로 점프
- localStorage 연동으로 재생목록 영속성 확보 (새로고침 후에도 유지)

### TODO 2-3: useAudioPlayer 커스텀 훅
- src/hooks/useAudioPlayer.ts에 HTML5 Audio 제어 훅 구현
- Audio 객체 생성 및 생명주기 관리 (마운트/언마운트)
- 이벤트 리스너: timeupdate(진행 시간), loadedmetadata(전체 길이), ended(재생 완료)
- 외부 메서드: play, pause, seek, setSpeed
- 현재 시간, 전체 시간, 로딩 상태 등을 반환
- 다음 곡 프리로딩: 현재 곡 재생 중에 다음 곡의 Audio 객체를 미리 생성하여 끊김 없는 전환 지원

### TODO 2-4: 유틸리티 함수
- src/utils/formatTime.ts — 초 단위 숫자를 mm:ss 형식 문자열로 변환
- src/utils/parseFileName.ts — MP3 파일명에서 번호, 책이름, 장, 절 메타데이터 추출 (crawl_verses.py의 parse_filename 로직을 TypeScript로 포팅)

### TODO 2-5: 핵심 로직 단위 테스트 작성
- Vitest로 앱의 핵심인 State Reducer와 파일명 파싱 로직을 검증

- src/context/__tests__/playerReducer.test.ts — Reducer 상태 전이 테스트:
  - ADVANCE_TO_NEXT: 개별 반복 미달 시 같은 구절 유지
  - ADVANCE_TO_NEXT: 개별 반복 완료 시 다음 활성 구절로 이동
  - ADVANCE_TO_NEXT: 비활성 구절 건너뛰기
  - ADVANCE_TO_NEXT: 재생목록 끝 도달 시 전체 반복 처리
  - ADVANCE_TO_NEXT: infiniteLoop 모드에서 무한 재시작
  - ADVANCE_TO_NEXT: 모든 반복 소진 시 재생 중지
  - TOGGLE_VERSE_ENABLED: 활성/비활성 토글
  - ADD_VERSE / REMOVE_VERSE: 재생목록 추가/제거

- src/utils/__tests__/parseFileName.test.ts — 파일명 파싱 테스트:
  - 기본 케이스: "01_로마서_10_9_10.wav" → id=1, book="로마서", chapter=10, verseStart=9, verseEnd=10
  - suffix 케이스: "15_로마서_11_36a.wav" → verseSuffix="a"
  - 단일 절 케이스: "06_시편_119_105.wav" → verseStart=105, verseEnd=null
  - 긴 책이름: "04_예레미야애가_3_22_23.wav" → book="예레미야애가"

---

## Phase 3: UI 컴포넌트 — 플레이어

### TODO 3-1: Header + Layout 컴포넌트
- src/components/layout/Header.tsx — 상단 헤더 영역
  - "BibleRun" 로고 텍스트 (Playfair Display italic 폰트)
  - HOME, LIBRARY, ABOUT 네비게이션 링크 (NavLink 사용)
- src/components/layout/Layout.tsx — 전체 레이아웃 래퍼
  - 최대 너비 800px 중앙 정렬 컨테이너
  - Header + children 구조
- 각 컴포넌트에 CSS Module 스타일 파일 생성

### TODO 3-2: VerseDisplay 컴포넌트
- src/components/player/VerseDisplay.tsx
- 현재 재생 중인 구절의 영문 레퍼런스 표시 (작은 대문자 스타일, letter-spacing 넓게)
- 한국어 구절 본문 표시 (Noto Serif KR, 큰 폰트, 중앙 정렬)
- 재생목록이 비어있을 때 안내 메시지 표시

### TODO 3-3: ProgressBar 컴포넌트
- src/components/player/ProgressBar.tsx
- 커스텀 스타일 range input으로 진행률 표시
- 초록색(primary) 진행 부분 + 회색 남은 부분 시각화
- 좌측에 현재 시간, 우측에 전체 시간 표시 (formatTime 유틸 사용)
- 드래그로 재생 위치 변경 가능

### TODO 3-4: PlayerControls 컴포넌트
- src/components/player/PlayerControls.tsx
- 3열 레이아웃:
  - 좌측: 반복 토글 버튼 (Repeat 아이콘) — 무한 반복 온/오프, 활성 시 초록색
  - 중앙: 재생/일시정지 버튼 — 56px 원형, #3d5a3d 배경, 흰색 아이콘
  - 우측: 현재 재생 속도 표시 뱃지 — "1x" 형태

### TODO 3-5: SpeedSelector 컴포넌트
- src/components/player/SpeedSelector.tsx
- 5가지 속도 옵션 가로 배열: 0.5x, 0.75x, 1x, 1.25x, 1.5x
- 활성 속도: #3d5a3d 배경 + 흰색 글씨
- 비활성 속도: 투명 배경 + 어두운 글씨
- 클릭 시 즉시 재생 속도 변경

---

## Phase 4: UI 컴포넌트 — 재생 목록

### TODO 4-1: RepeatCounter 컴포넌트
- src/components/playlist/RepeatCounter.tsx
- 재사용 가능한 숫자 증감 컴포넌트: [-] 숫자 [+] 형태
- 전체 반복 카운터와 개별 구절 반복 카운터에 모두 사용
- 최소값 1, 최대값은 적절한 범위로 제한

### TODO 4-2: PlaylistItem 컴포넌트
- src/components/playlist/PlaylistItem.tsx
- 한 줄에 포함되는 요소:
  - 체크박스: 해당 구절 활성/비활성 토글
  - 번호 또는 스피커 아이콘: 현재 재생 중인 구절이면 Volume2 아이콘 표시
  - 구절 이름: 한국어 displayName
  - 재생 시간: verses.json의 duration 필드에서 읽어와 표시 (런타임 메타데이터 로드 불필요)
  - 개별 반복 카운터: RepeatCounter 사용

### TODO 4-3: Playlist + PlaylistHeader 컴포넌트
- src/components/playlist/PlaylistHeader.tsx
  - "재생 목록" 제목 텍스트
  - "전체 반복" 레이블 + RepeatCounter
- src/components/playlist/Playlist.tsx
  - PlaylistHeader 렌더링
  - PlaylistItem 목록 반복 렌더링
  - 하단에 "구절 추가하기" 버튼 (Plus 아이콘 + 텍스트)
  - 빈 재생목록일 때 안내 메시지

### TODO 4-4: AddVerseModal 컴포넌트
- src/components/playlist/AddVerseModal.tsx
- 64개 전체 구절 목록을 보여주는 모달 오버레이
- 상단 검색 입력란: 한국어 책 이름으로 필터링
- 각 구절 항목에 "추가" 버튼
- 이미 재생목록에 추가된 구절은 비활성(disabled) 표시 또는 "추가됨" 표시
- 모달 외부 클릭 또는 X 버튼으로 닫기

---

## Phase 5a: 핵심 페이지 및 라우팅 (필수)

### TODO 5-1: HomePage
- src/pages/HomePage.tsx
- 모든 플레이어 컴포넌트 조합: VerseDisplay → ProgressBar → PlayerControls → SpeedSelector → Playlist
- 디자인 시안과 동일한 수직 레이아웃

### TODO 5-2: App.tsx 라우팅 설정
- react-router-dom의 BrowserRouter, Routes, Route 사용
- "/" → HomePage
- "/library" → LibraryPage (Phase 5b에서 구현, 초기에는 placeholder)
- "/about" → AboutPage (Phase 5b에서 구현, 초기에는 placeholder)
- Layout 컴포넌트로 전체 래핑

## Phase 5b: 부가 페이지 (후순위)

이 Phase는 Phase 6까지의 핵심 기능 검증 완료 후 진행한다.

### TODO 5-3: LibraryPage
- src/pages/LibraryPage.tsx
- 64개 구절 전체 목록 브라우징 페이지
- 책(book)별로 그룹핑하여 분류
- 각 구절: displayName, 본문 미리보기 (1~2줄)
- "재생목록에 추가" 버튼 (이미 추가된 경우 비활성)

### TODO 5-4: AboutPage
- src/pages/AboutPage.tsx
- 앱 소개: BibleRun의 목적과 사용법
- 간단한 사용 가이드

---

## Phase 6: 핵심 재생 로직 (ADVANCE_TO_NEXT)

### TODO 6-1: 오디오 종료 시 다음 동작 결정 로직 구현
이것이 앱의 핵심이며, PlayerContext의 ADVANCE_TO_NEXT 액션에서 처리:

1. 현재 오디오 ended 이벤트 발생 시 currentRepeatIteration을 1 증가
2. 해당 구절의 repeatCount에 미달이면 → 같은 구절을 처음부터 다시 재생
3. repeatCount에 도달하면 → currentRepeatIteration 리셋, 다음 enabled=true인 구절로 이동
4. 재생목록 끝에 도달했을 때:
   - globalRepeatIteration을 1 증가
   - globalRepeatCount에 미달이거나 infiniteLoop=true이면 → 재생목록 처음부터 재시작
   - globalRepeatCount도 소진되고 infiniteLoop=false이면 → 재생 중지 (isPlaying=false)

### TODO 6-2: useAudioPlayer와 PlayerContext 연동
- ended 이벤트에서 ADVANCE_TO_NEXT 디스패치
- currentIndex 변경 감지 시 프리로드된 Audio 객체로 즉시 전환하여 자동 재생
- speed 변경 시 Audio.playbackRate 동기화

### TODO 6-3: Media Session API 연동
- navigator.mediaSession.metadata에 현재 재생 중인 구절 정보 설정 (title, artist, album)
- 액션 핸들러 등록: play, pause, previoustrack, nexttrack
- 잠금 화면 및 알림 영역에서 재생 제어 가능하도록 지원
- Media Session 미지원 브라우저에서는 graceful fallback (기능 무시)

---

## Phase 7: 마무리

### TODO 7-1: 반응형 디자인
- 모바일 600px 이하 미디어 쿼리 대응
- 터치 타겟 최소 44px 확보
- SpeedSelector 버튼 크기 조정
- ProgressBar 터치 조작 최적화

### TODO 7-2: 에지 케이스 처리
- 빈 재생목록 상태: 플레이어 비활성 + 안내 메시지
- 모든 구절 비활성(enabled=false) 상태: 재생 불가 처리
- 오디오 로드 실패: 에러 표시 + 다음 구절로 건너뛰기
- 모바일 자동재생 제한: 사용자 인터랙션 후 재생 시작

### TODO 7-3: 접근성
- 키보드 단축키: Space로 재생/일시정지, 좌우 화살표로 탐색
- 모든 인터랙티브 요소에 aria-label 적용
- focus 스타일 명시

---

## 검증 방법

1. npx vitest run으로 Reducer 단위 테스트 + parseFileName 단위 테스트 통과 확인
2. npm run dev로 개발 서버 실행
3. 구절 추가 후 재생 버튼 클릭하여 오디오 재생 확인
4. 반복 카운터 변경 후 반복 재생 동작 확인
5. 재생 속도 변경 동작 확인
6. 체크박스 해제 시 해당 구절 건너뛰기 확인
7. 브라우저 새로고침 후 재생목록 유지 확인 (localStorage)
8. 모바일 화면에서 반응형 레이아웃 확인
9. 잠금 화면에서 Media Session 제어 확인

---

## Council 피드백 요약

### Round 1 (2026-03-11)
- Codex: CLI 미설치로 피드백 없음
- Gemini: CLI 미설치로 피드백 없음
- 반영 사항: 서비스 이름을 "Scripture Loop"에서 "BibleRun"으로 변경 (사용자 요청)

### Round 2 (2026-03-11)
- Codex: CLI 미설치로 피드백 없음
- Gemini: CLI 미설치로 피드백 없음
- 반영 사항: 없음 (피드백 부재)

### Round 3: 외부 코멘트 반영 (2026-03-11)
아래 5가지 코멘트를 검토하여 선별 반영:

| 코멘트 | 판정 | 사유 |
|--------|------|------|
| 1. JSON 생성 자동화 | 반영 | 파일명 파싱 + ffprobe + bskorea 스크래핑으로 완전 자동 생성 (TODO 1-3 수정) |
| 2. howler.js 도입 | 불채택 | 순차 단일 재생 패턴에 과잉 의존성, HTML5 Audio API로 충분 |
| 3. Reducer 단위 테스트 | 반영 | 핵심 ADVANCE_TO_NEXT 로직의 상태 전이 검증 필수 (TODO 2-5 추가) |
| 4-a. Preloading | 반영 | 다음 곡 미리 로드로 끊김 없는 전환 지원 (TODO 2-3, 6-2 수정) |
| 4-b. Media Session API | 반영 | 잠금 화면/알림 영역 재생 제어로 완성도 향상 (TODO 6-3 추가) |
| 4-c. PWA 지원 | 불채택 | 초기 버전 범위 초과, 별도 이터레이션으로 추가 예정 |
| 5. 배포 계획 | 불채택 | 배포 대상 미정, 별도 결정 사안 |

### Round 4: 외부 코멘트 반영 (2026-03-11)
아래 3가지 코멘트를 검토하여 전수 반영:

| 코멘트 | 판정 | 사유 |
|--------|------|------|
| 5. 재생 시간 데이터 획득 | 반영 | generate-verses 스크립트에서 ffprobe로 duration 사전 추출, verses.json에 포함 (TODO 1-3, 2-1, 4-2 수정) |
| 6. 페이지 우선순위 분리 | 반영 | Phase 5를 5a(핵심: HomePage+라우팅)와 5b(부가: Library, About)로 분리 |
| 7. 검증 항목 보강 | 반영 | parseFileName 단위 테스트 추가, suffix/범위절/단일절 엣지 케이스 커버 (TODO 2-5 확장) |

### Round 5: 사용자 피드백 (2026-03-11)

| 코멘트 | 판정 | 사유 |
|--------|------|------|
| text 필드 bskorea.or.kr 스크래핑 | 반영 | 수동 보완 제거, 대한성서공회 사이트에서 자동 수집으로 완전 자동화 (TODO 1-3 수정) |
| ffprobe 대상 명확화 | 반영 | public/audio/ 내 변환된 MP3 대상으로 실행, TODO 1-2 의존 관계 명시 |

### Round 6: 사전 작업 완료 반영 (2026-03-11)

사전 준비 작업이 완료되어 plan.md를 현실에 맞게 갱신:

| 변경 항목 | 내용 |
|-----------|------|
| MP3 변환 완료 | bible_verses_tts/*.mp3 64개 생성 완료, TODO 1-2를 "복사만 하면 됨"으로 간소화 |
| 구절 텍스트 크롤링 완료 | crawl_verses.py로 대한성서공회에서 64/64 구절 크롤링 성공, bible_verses.json 생성 |
| TODO 1-3 간소화 | 3단계 파이프라인(파싱+ffprobe+스크래핑)에서 "기존 JSON 가공+ffprobe"로 축소, 스크래핑 단계 제거 |
| Verse 타입 정리 | bible_verses.json 실제 스키마에 맞춰 타입 필드명 갱신 (displayName→reference 등) |
