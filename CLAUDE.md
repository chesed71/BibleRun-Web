# BibleRun-Web — Project Context

> AI 에이전트용 프로젝트 컨텍스트 문서. 이 문서만 읽으면 프로젝트 전반을 이해하고 작업에 바로 착수할 수 있습니다.

---

## 1. 프로젝트 개요

### 한 줄 요약
**성경 구절 암송·학습을 위한 React 기반 웹 애플리케이션**. 음성 재생, 음성 인식(STT), 주차별 구절 확인 기능을 제공합니다.

### 목적
- 사용자가 정해진 64개 성경 구절을 **듣고, 따라 말하고, 암송하며** 학습
- 주차별(2구절/주) 커리큘럼으로 **32주 학습 플랜** 제공
- 음성 인식으로 **암송 정확도 자동 측정**

### 타겟 사용자
한국어 사용자 (UI 전체 한국어, 구절 텍스트도 한국어 성경)

### 배포
- GitHub: `chesed71/BibleRun-Web` (master 브랜치)
- Google Analytics (GA4) 연동: `G-TZ7F0DFEWN`

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | React 19.2 + TypeScript 5.9 (strict mode) |
| Build | Vite 7.3 |
| Router | react-router-dom 7.13 |
| Icons | lucide-react |
| Styling | CSS Modules + CSS Variables (글로벌) |
| State | React Context + useReducer |
| Persistence | localStorage |
| Audio | HTML5 Audio API (preload 지원) |
| STT | Web Speech API (`SpeechRecognition`, `ko-KR`) |
| Testing | Vitest + jsdom |
| Package Manager | npm |

### NPM Scripts
```
dev        # Vite 개발 서버 (기본 5173)
build      # tsc -b && vite build
preview    # 빌드 미리보기
lint       # ESLint
test       # vitest run (한 번)
test:watch # vitest 감시 모드
```

---

## 3. 핵심 기능 — 4가지 모드

탭 순서: **말씀 | 듣기 | 연습 | 암송**

| 모드 | PlayMode key | 오디오 소스 | 설명 |
|------|--------------|-------------|------|
| 말씀 | `scripture` | 없음 | 주차별 구절 목록 (읽기 전용). 상단에 1/5/9/13/17/21/25/29주차 점프 버튼 |
| 듣기 | `listen` | `verse.audioFile` | 구절 음성 재생 + 플레이리스트 + 반복 설정 |
| 연습 | `check` | `verse.practiceAudioFile` | 연습용(공백 포함) 오디오 재생 — 사용자가 따라 말하며 학습 |
| 암송 | `recite` | 없음 (STT) | 마이크로 암송 → Web Speech API → 정확도 측정 |

### 암송 모드 세부 흐름
1. 마이크 버튼 → `startRecording(verse.text)`
2. `useSpeechRecognition` 훅이 `ko-KR`로 녹음
3. 다시 버튼 → `stopRecording()`
4. `compareTexts(original, transcript)` 실행 (Levenshtein 기반 DP)
5. `RecitationResult` 컴포넌트가 정확도(%) + 단어별 색상 코딩 표시 (correct/wrong/missing)
6. "다시 도전" 또는 "다음 구절" 선택

---

## 4. 디렉토리 구조

```
BibleRun-Web/
├── CLAUDE.md                          # 이 문서
├── index.html                         # 엔트리 HTML (GA4 스크립트 포함)
├── package.json
├── vite.config.ts                     # Vite + Vitest 설정
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── bible_verses.json                  # 원본 구절 데이터 (Python 크롤링 결과)
├── scripts/
│   └── generate-verses.mjs            # bible_verses.json → src/data/verses.json 변환 (ffprobe로 duration 측정)
├── public/
│   └── audio/
│       ├── NN_책명_장_절[_절].mp3     # 64개 메인 오디오
│       └── practice/
│           └── ..._practice.mp3        # 64개 연습 오디오
└── src/
    ├── main.tsx                       # React 진입점
    ├── App.tsx                        # Router + PlayerProvider + Layout
    ├── index.css                      # 글로벌 CSS 변수, 폰트 import
    ├── types/
    │   └── index.ts                   # 모든 TypeScript 타입 (Verse, PlaylistItem, PlayMode 등)
    ├── data/
    │   └── verses.json                # 64개 구절 최종 데이터 (생성된 파일)
    ├── context/
    │   └── PlayerContext.tsx          # useReducer 기반 전역 상태 + localStorage
    ├── hooks/
    │   ├── useAudioPlayer.ts          # HTML5 Audio 관리 + 다음 곡 preload
    │   └── useSpeechRecognition.ts    # Web Speech API 래퍼
    ├── utils/
    │   ├── compareTexts.ts            # Levenshtein DP → 정확도/세그먼트
    │   ├── formatTime.ts              # 초 → M:SS
    │   └── parseFileName.ts           # 파일명 → {id, book, chapter, ...}
    ├── pages/
    │   ├── HomePage.tsx               # 메인 페이지 (모드 분기 렌더링)
    │   ├── HomePage.module.css
    │   └── AboutPage.tsx              # 준비 중
    └── components/
        ├── layout/
        │   ├── Layout.tsx             # 메인 wrapper
        │   └── Header.tsx             # 현재 Layout에서 주석 처리됨 (미사용)
        ├── player/
        │   ├── VerseDisplay.tsx       # 현재 구절 텍스트 표시
        │   ├── ProgressBar.tsx        # 재생 슬라이더 (seek 가능)
        │   ├── PlayerControls.tsx     # 재생/일시정지/속도/반복/마이크/이전/다음/<<,>>
        │   ├── RecitationResult.tsx   # 암송 결과 (정확도 + 색상 단어)
        │   └── SpeedSelector.tsx      # (현재 미사용)
        ├── playlist/
        │   ├── Playlist.tsx           # 10개씩 페이지네이션
        │   ├── PlaylistItem.tsx       # 단일 항목 (체크박스 + 반복 카운터)
        │   ├── PlaylistHeader.tsx     # 전체선택/반복초기화
        │   ├── RepeatCounter.tsx      # 반복 횟수 ± 컨트롤
        │   ├── RecitePlaylist.tsx     # 암송 모드 드롭다운 선택기
        │   └── AddVerseModal.tsx      # (현재 미사용)
        └── scripture/
            ├── ScriptureView.tsx      # 말씀 모드 주차별 카드 뷰 + 점프 바
            └── ScriptureView.module.css
```

---

## 5. 데이터 모델 (`src/types/index.ts`)

```typescript
interface Verse {
  id: number;              // 1..64
  filename: string;        // "01_로마서_10_9_10"
  book: string;            // "로마서"
  bookEn: string;          // "Romans"
  chapter: number;
  startVerse: number;
  endVerse: number;
  verseSuffix: string | null;  // 'a','b' 등
  reference: string;       // "로마서 10:9-10"
  displayNameEn: string;   // "Romans 10:9-10"
  text: string;            // 구절 본문
  audioFile: string;       // "/audio/01_로마서_10_9_10.mp3"
  practiceAudioFile: string;   // "/audio/practice/..._practice.mp3"
  duration: number;        // 초
}

interface PlaylistItem {
  verseId: number;
  enabled: boolean;        // 체크 여부
  repeatCount: number;     // 1..99
  order: number;
}

type RepeatMode = 'off' | 'all' | 'one';
type PlayMode = 'scripture' | 'listen' | 'recite' | 'check';

interface PlayerState {
  playlist: PlaylistItem[];
  isPlaying: boolean;
  currentIndex: number;
  currentRepeatIteration: number;
  infiniteLoop: boolean;
  repeatMode: RepeatMode;
  speed: number;           // 0.5 | 0.75 | 1 | 1.25 | 1.5
  mode: PlayMode;
}
```

### 중요 포인트
- `Verse[]`는 **정적 데이터** (`src/data/verses.json` import)
- `PlayerState.playlist`는 **동적 상태** (localStorage 저장)
- 인덱스(`currentIndex`)는 `playlist` 배열 기준이지 `verses` 배열이 아님

---

## 6. 상태 관리 (`PlayerContext`)

### Action 타입 (전부)
```
PLAY | PAUSE | TOGGLE_PLAY | SEEK
SET_SPEED | CYCLE_REPEAT_MODE | SET_MODE
ADD_VERSE | REMOVE_VERSE | TOGGLE_VERSE_ENABLED | SET_ALL_ENABLED
SET_VERSE_REPEAT | RESET_ALL_REPEAT
ADVANCE_TO_NEXT | JUMP_TO_VERSE
```

### `ADVANCE_TO_NEXT` 로직 (가장 복잡)
1. `repeatMode === 'one'` → 같은 구절 계속
2. `currentRepeatIteration < repeatCount` → 같은 구절 반복
3. 다음 **활성화된(enabled)** 구절로 이동
4. 마지막 곡 + `repeatMode === 'all'` → 처음부터 다시
5. 그 외 → 재생 종료 (`isPlaying: false`)

### localStorage 키
- `biblerun-playlist`: PlaylistItem[] 직렬화
- `biblerun-mode`: PlayMode (레거시 `'practice'` → `'check'` 마이그레이션 존재)

### 사용법
```typescript
const { state, dispatch } = usePlayer();
dispatch({ type: 'SET_MODE', mode: 'recite' });
```
`PlayerProvider` 밖에서 `usePlayer()` 호출 시 throw.

---

## 7. 주요 훅 시그니처

### `useAudioPlayer`
```typescript
useAudioPlayer({
  src: string | null,          // 현재 곡
  nextSrc: string | null,      // 미리 로드할 다음 곡
  speed: number,
  onEnded: () => void,
}) => {
  currentTime, duration, isLoading,
  play(), pause(), seek(time)
}
```
- `recite`/`scripture` 모드에서는 `src=null` 전달
- `preloadRef`로 다음 곡 미리 로드하여 seamless 전환

### `useSpeechRecognition`
```typescript
useSpeechRecognition() => {
  status: 'idle' | 'recording' | 'processing' | 'done',
  result: RecitationResult | null,
  error: string | null,
  isSupported: boolean,        // Web Speech API 지원 여부 (Chrome만)
  startRecording(originalText: string),
  stopRecording(),
  reset(),
}
```
- `originalText`는 녹음 종료 후 `compareTexts`에 전달되어 정확도 계산용
- Chrome/Edge에서만 완전 지원, Safari/Firefox는 `isSupported: false`

---

## 8. 텍스트 비교 알고리즘 (`compareTexts.ts`)

Levenshtein Distance 기반 DP + 역추적.

### 흐름
1. 양쪽 텍스트 **정규화**: 문장부호 제거, 공백 단일화, 단어 분리
2. 2D DP 테이블 구축: `dp[i][j]` = 원본[0..i]를 인식[0..j]로 변환하는 최소 비용
3. 역추적으로 각 단어의 상태 결정:
   - `correct`: 일치
   - `wrong`: 치환(substitution)
   - `missing`: 삭제(deletion, 생략된 단어)
   - 삽입(insertion, 추가로 말한 단어)은 결과에서 무시
4. 같은 타입 연속 단어를 하나의 `RecitationSegment`로 병합
5. 정확도 = `correct_단어수 / 원본_단어수 * 100`

### 결과 표시 (`RecitationResult.tsx`)
- ≥ 90%: 초록
- ≥ 70%: 황색
- < 70%: 빨강

---

## 9. HomePage 렌더링 분기

```
<modeTabs />   <!-- 4개 모드 탭 (말씀/듣기/연습/암송) -->

if (mode === 'scripture')    → <ScriptureView verses={allVerses} />
else if (mode === 'recite')  → 
    <reciteDisclaimer />
    if (idle)       → 구절 번호 + reference + 안내
    if (recording)  → 녹음 중 UI
    if (processing) → 분석 중
    if (done)       → <RecitationResult />
    <PlayerControls mode="recite" />  // 마이크 + <<,<,>,>>
    <RecitePlaylist />                // 드롭다운 선택기
else  (listen | check)       →
    <VerseDisplay />
    <ProgressBar />
    <PlayerControls />
    <Playlist />
```

### 특수 동작
- **키보드 단축키** (listen/check 모드만):
  - Space: 재생/일시정지
  - ←: -5초 seek
  - →: +5초 seek
- **Media Session API**: 잠금화면/미디어 키 연동
- **모드/구절 변경 시 자동**: `reset()` 호출로 STT 상태 초기화

---

## 10. 데이터 파이프라인

```
bible_verses.json              (원본, Python 크롤링)
      ↓
scripts/generate-verses.mjs    (Node.js + ffprobe)
      ↓
src/data/verses.json           (앱에서 import)
```

### generate-verses.mjs의 역할
1. 원본 JSON 읽기
2. 각 `filename`에 대해 `ffprobe`로 `public/audio/*.mp3` duration 측정
3. 한글 책명 → 영문 매핑 (`BOOK_EN_MAP`)
4. `displayNameEn` 생성
5. `audioFile`, `practiceAudioFile` 경로 구성
6. `src/data/verses.json`에 저장

### 오디오 추가/교체 시
1. `public/audio/`에 파일 배치 (명명 규칙 준수: `NN_책명_장_절[_절].mp3`)
2. 필요하면 `bible_verses.json` 수정
3. `node scripts/generate-verses.mjs` 실행 (duration 갱신)

---

## 11. 스타일 시스템

### 글로벌 CSS 변수 (`src/index.css`)
```css
--color-primary: #3d5a3d;           /* 진초록 (브랜드 컬러) */
--color-bg: #ffffff;
--color-text: #1a1a1a;
--color-text-secondary: #666666;
--color-border: #e5e5e5;
--max-width: 800px;
--font-ui: 'Noto Sans KR', sans-serif;
--font-verse: 'Noto Serif KR', serif;
--font-logo: 'Playfair Display', serif;
```

### 컨벤션
- 모든 컴포넌트는 CSS Module (`*.module.css`) 사용
- `styles.className` 임포트 패턴
- 정답/오답 색상: 초록 `#22c55e`, 황색 `#f59e0b`, 빨강 `#ef4444`
- 폰트: UI는 Noto Sans KR, 성경 본문은 Noto Serif KR

---

## 12. 컴포넌트 빠른 참조

| 컴포넌트 | 주요 Props | 역할 |
|----------|------------|------|
| `PlayerControls` | `mode`, `isPlaying`, `isRecording`, `onTogglePlay`, `onPrev/Next`, `onPrevMany/NextMany`, `onToggleRecording` | 모드별 컨트롤 UI 분기 (암송 모드는 마이크+5버튼, 나머지는 반복/재생/속도) |
| `VerseDisplay` | `verse` | 구절 텍스트 + reference |
| `ProgressBar` | `currentTime`, `duration`, `onSeek` | 슬라이더 (선형 그래디언트) |
| `RecitationResult` | `result`, `reference`, `onRetry`, `onNext` | 정확도 + 단어별 색상 표시 |
| `Playlist` | `playlist`, `verses`, `currentIndex`, `onToggleEnabled`, `onJump`, `onRepeatChange` 등 | 10개씩 페이지네이션, 체크박스, 반복 설정 |
| `RecitePlaylist` | `verses`, `currentVerseId`, `onSelect` | 펼침형 드롭다운 (외부 클릭 감지) |
| `ScriptureView` | `verses` | 주차별 카드(2구절/주) + 상단 점프 바 (1,5,9,13,17,21,25,29) |

---

## 13. 주의사항 (에이전트 작업 시)

### 절대 건드리지 말 것 (명시적 요청 없이)
- `src/data/verses.json` 직접 수정 금지 → `scripts/generate-verses.mjs` 경유
- `public/audio/*.mp3` 직접 교체 시 반드시 사용자 확인 후

### 새 모드 추가 시 체크리스트
1. `src/types/index.ts`의 `PlayMode` union에 추가
2. `HomePage.tsx`의 `MODE_CONFIG` 배열에 추가
3. `HomePage.tsx`의 렌더링 분기 추가
4. `PlayerContext.tsx`의 `getInitialMode`에서 localStorage 마이그레이션 고려
5. `useAudioPlayer`에 오디오 필요 여부 반영 (`getAudioSrc`)

### 새 컴포넌트 추가 시
- `src/components/{카테고리}/` 하위에 TSX + module.css 쌍으로 생성
- 명명된 export 사용 (`export function ComponentName`)
- CSS Module 패턴 준수

### 빌드 검증
```bash
npx tsc --noEmit   # 타입 체크
npm run build      # 풀 빌드
npm test           # 단위 테스트
```

### 커밋 규칙 (사용자 전역 규칙)
- 커밋 메시지에 "Generated with Claude Code" 또는 "Co-Authored-By: Claude" **절대 포함 금지**
- 순수하게 변경 내용만 기술 (한국어)
- Read → Edit/Write 순서 준수

### 언어 및 톤
- 모든 UI 텍스트와 사용자 대화는 **한국어**
- 코드 식별자는 영어 유지

---

## 14. 알려진 미사용/비활성 코드

- `components/layout/Header.tsx` — `Layout.tsx`에서 주석 처리
- `components/playlist/AddVerseModal.tsx` — `Playlist.tsx`에서 호출 제거됨
- `components/player/SpeedSelector.tsx` — `PlayerControls`는 배지형 사이클 버튼 사용 중
- `/about` 라우트 — AboutPage는 placeholder

---

## 15. 최근 주요 변경 이력 (git log 요약)

```
말씀 탭 주차 스크롤 위치 미세 조정
말씀 탭 추가: 주차별 구절 보기 기능
Update practice mode audio files
UI 텍스트 수정: 탭 순서 및 라벨 변경 (듣기→연습→암송)
암송 모드 기능 추가 및 음성 파일 업데이트
연습 모드 추가 (듣고 쉬고 따라 읽기)
Google Analytics (GA4) 추가
성경 구절 표시를 영어에서 한국어로 변경
```

**개발 방향**: 기본 플레이어 → 연습 모드 → 암송(STT) → 말씀(주차 뷰)로 점진적 확장 중.

---

## 16. 트러블슈팅 힌트

| 증상 | 원인 후보 |
|------|-----------|
| 배포 후 MP3가 옛날 파일로 재생됨 | 브라우저 캐시 or CDN 캐시. 파일명 해싱/쿼리 파라미터 or CloudFront invalidation 필요 |
| 암송 모드가 비활성화 | Chrome/Edge 아닌 브라우저 사용 (`isSupported: false`) — UI에 안내 메시지 있음 |
| 플레이리스트가 비어있음 | localStorage 손상 → `biblerun-playlist` 삭제 후 새로고침 |
| 다음 곡으로 넘어가지 않음 | `enabled: false`인 곡만 남아있거나 `repeatMode` 확인 |
| `SET_MODE` 후에도 재생 계속 | Reducer가 `isPlaying: false`로 설정하는데도 오디오 요소가 분리된 경우 → useEffect 의존성 확인 |

---

**마지막 업데이트**: 2026-04-09 (말씀 탭 추가 직후)
