좋습니다. 아래 내용을 그대로 `README.md`로 쓰면 됩니다.
Codex에게 맡길 때도 이 README가 **제품 명세서 + 개발 지시서** 역할을 하게 만들었습니다.

````md
# FocusBox

ADHD 친화형 Time Boxing + Interstitial Journaling 크롬 확장 프로그램

## 1. 프로젝트 개요

FocusBox는 크롬 브라우저를 켜는 순간 사용자가 “지금 무엇을 하려고 브라우저를 열었는지”를 먼저 정하게 만드는 집중 보조 Chrome Extension입니다.

이 프로젝트는 일반적인 뽀모도로 타이머가 아닙니다. 핵심 목적은 산만함, 멀티탭, 무의식적 웹서핑, 작업 중 딴생각으로 인해 하루가 허무하게 사라지는 문제를 줄이는 것입니다.

FocusBox는 다음 두 가지 방법론을 결합합니다.

- Time Boxing: 정해진 시간 동안 하나의 작업만 수행
- Interstitial Journaling: 작업 사이사이에 현재 상태와 다음 행동을 짧게 기록

첫 번째 버전은 ADHD 친화형 UX를 목표로 합니다.

사용자에게 하루 전체 계획을 요구하지 않습니다.  
대신 크롬 실행 직후 다음 3가지만 묻습니다.

1. 지금 하려던 일은?
2. 가장 작은 첫 행동은?
3. 몇 분만 해볼까?

---

## 2. 핵심 문제

브라우저 기반 작업자는 다음 문제를 자주 겪습니다.

- 크롬을 켰지만 원래 목적을 잊는다.
- 채용공고, GitHub, 문서 작업을 하려다가 유튜브/SNS로 샌다.
- 떠오른 생각을 바로 검색하면서 새 탭이 계속 늘어난다.
- 멀티탭 상태가 되어 작업 맥락을 잃는다.
- 하루 끝에 실제로 한 일이 없는 것처럼 느낀다.
- 계획을 과하게 세우고 실행은 못 한다.

FocusBox의 목표는 사용자를 강하게 통제하는 것이 아니라, 작업 이탈 순간에 다시 돌아올 수 있는 구조를 제공하는 것이다.

---

## 3. 제품 컨셉

### 한 줄 설명

브라우저를 켠 목적을 먼저 정하고, 작업 중 딴생각은 보관하고, 사용자를 현재 작업으로 되돌려주는 Chrome Extension.

### 핵심 철학

> 딴생각을 없애는 것이 아니라, 딴생각을 안전하게 보관하고 현재 작업으로 복귀시킨다.

### 핵심 문장

> 지금은 하나만 정하면 됩니다.

---

## 4. MVP 범위

이번 버전은 `v0.1`입니다.

### v0.1 목표

사용자가 크롬을 실행하면 FocusBox 시작 화면이 자동으로 열리고, 사용자는 현재 작업과 첫 행동을 입력한 뒤 10분/25분/50분 중 하나를 선택해 타임박스를 시작할 수 있다.

작업 중 떠오른 생각은 Brain Dump에 저장할 수 있고, 저장 후 현재 작업 화면으로 돌아온다.

작업이 끝나면 완료 로그가 저장된다.

---

## 5. v0.1 필수 기능

### 5.1 Start Ritual 화면

크롬 실행 직후 또는 새 세션 시작 시 자동으로 열리는 화면.

화면 문구:

```txt
FocusBox

지금은 하나만 정하면 됩니다.

지금 하려던 일은?
[________________]

가장 작은 첫 행동은?
[________________]

몇 분만 해볼까요?
[10분] [25분] [50분]

[시작하기]
[오늘은 건너뛰기]
```
````

### 입력 필드

#### 지금 하려던 일은?

placeholder 예시:

```txt
예: 이력서 프로젝트 설명 수정
예: 채용공고 1개 분석
예: 코딩테스트 문제 조건 읽기
```

#### 가장 작은 첫 행동은?

placeholder 예시:

```txt
예: README 파일 열기
예: 자격요건 3개 표시하기
예: 문제 입력 조건만 읽기
```

### 버튼

- `10분`
- `25분`
- `50분`
- `시작하기`
- `오늘은 건너뛰기`

### 유효성 검사

`지금 하려던 일`과 `가장 작은 첫 행동`은 필수 입력값이다.

둘 중 하나라도 비어 있으면 시작할 수 없다.

에러 메시지:

```txt
작업과 첫 행동을 입력해야 시작할 수 있습니다.
```

---

## 6. Focus Session 화면

타임박스가 시작되면 현재 작업 화면으로 전환된다.

```txt
FocusBox 진행 중

작업:
이력서 프로젝트 설명 수정

첫 행동:
README 파일 열기

남은 시간:
24:32

[완료]
[딴생각 저장]
[중단]
```

### 기능

- 선택한 시간만큼 타이머가 작동한다.
- 팝업을 닫아도 세션 상태는 유지되어야 한다.
- 다시 확장프로그램 아이콘을 클릭하면 진행 중인 세션을 볼 수 있어야 한다.
- 브라우저를 새로 열어도 진행 중인 세션이 있으면 기존 세션을 복원한다.

---

## 7. Brain Dump / Quick Capture 기능

작업 중 떠오른 생각을 즉시 저장하고 현재 작업으로 복귀시키는 기능.

### 화면

```txt
떠오른 생각을 보관하세요.

지금 실행하지 말고, 적고 돌아갑니다.

[________________________]

[저장하고 복귀]
[취소]
```

### 예시 입력

```txt
GitHub README 이미지 첨부법 찾아보기
AWS 배포 방법 다시 정리하기
쿠팡 장바구니 확인하기
```

### 저장 후 동작

저장 후 다음 메시지를 짧게 보여준다.

```txt
저장했습니다. 지금 작업으로 돌아갑니다.
```

그 다음 Focus Session 화면으로 돌아간다.

### 로그 예시

```txt
10:17 Brain Dump - GitHub README 이미지 첨부법 찾아보기
```

---

## 8. 완료 / 중단 로그

### 완료 버튼 클릭 시

사용자에게 이번 블록에서 실제로 한 일을 입력하게 한다.

```txt
이번 블록에서 한 일은?

[________________________]

다음 작은 행동은?

[________________________]

[완료 저장]
```

첫 번째 필드는 필수, 두 번째 필드는 선택이다.

### 완료 로그 예시

```txt
10:00 시작 - 이력서 프로젝트 설명 수정
10:17 Brain Dump - GitHub README 이미지 첨부법 찾아보기
10:25 완료 - README 첫 문장 수정 완료
Next - 기술스택 문장 정리
```

### 중단 버튼 클릭 시

중단 사유를 선택하게 한다.

```txt
FocusBox를 중단할까요?

사유:
[급한 일]
[집중 안 됨]
[작업 변경]
[기타]

[중단 저장]
[계속하기]
```

---

## 9. 오늘의 로그 화면

사용자는 오늘의 FocusBox 기록을 볼 수 있어야 한다.

### 화면

```txt
오늘의 기록

10:00 시작 - 이력서 프로젝트 설명 수정
10:17 Brain Dump - GitHub README 이미지 첨부법 찾아보기
10:25 완료 - README 첫 문장 수정 완료

11:00 시작 - 채용공고 분석
11:08 중단 - 작업 변경
```

### 표시할 정보

- 시작 시간
- 작업명
- Brain Dump 항목
- 완료 여부
- 중단 여부
- 다음 행동

---

## 10. 건너뛰기 기능

사용자가 Start Ritual을 건너뛸 수는 있어야 한다.

다만 그냥 닫는 것이 아니라 로그에 남긴다.

### 건너뛰기 화면

```txt
오늘 시작 계획을 건너뜁니다.

사유를 선택하세요.

[급한 검색만 함]
[쉬는 날]
[귀찮음]
[나중에 함]

[건너뛰기 저장]
[돌아가기]
```

### 로그 예시

```txt
09:12 Start Ritual skipped - 귀찮음
```

---

## 11. 크롬 실행 시 동작

Chrome Extension Manifest V3 환경에서는 백그라운드 로직이 service worker 기반으로 작동한다. Chrome 공식 문서에 따르면 MV3에서는 background page 대신 service worker가 사용되며, 필요할 때만 실행되는 구조다.
참고: [https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers)

### 기대 동작

- 사용자가 크롬을 실행했을 때 FocusBox Start Ritual 화면을 자동으로 연다.
- 이미 오늘 Start Ritual을 완료했다면 다시 열지 않는다.
- 진행 중인 Focus Session이 있으면 Start Ritual 대신 진행 중 화면을 보여준다.
- 사용자가 오늘 건너뛰기를 선택했다면 같은 날에는 자동으로 다시 열지 않는다.

### 구현 참고

크롬 실행 이벤트는 환경에 따라 다르게 감지될 수 있으므로, MVP에서는 다음 조건 중 하나를 사용한다.

1. 확장프로그램 설치 후 첫 실행 시 Start Ritual 페이지 열기
2. 브라우저 시작 시 `chrome.runtime.onStartup`에서 Start Ritual 페이지 열기
3. 새 탭 생성 시 오늘 Start Ritual 상태를 확인하고 필요하면 FocusBox 페이지 열기

---

## 12. 데이터 구조

Chrome Storage API를 사용한다.

Chrome 공식 문서에 따르면 `chrome.storage`는 확장 프로그램의 service worker, content scripts 등 여러 extension context에서 접근할 수 있고, JSON 직렬화 가능한 값을 비동기로 저장할 수 있다.
참고: [https://developer.chrome.com/docs/extensions/reference/api/storage](https://developer.chrome.com/docs/extensions/reference/api/storage)

### 예시 데이터

```js
{
  "settings": {
    "defaultDuration": 25,
    "startRitualMode": "start_ritual",
    "lastRitualDate": "2026-05-10",
    "skipDate": null
  },
  "currentSession": {
    "id": "session_1715320000000",
    "task": "이력서 프로젝트 설명 수정",
    "nextAction": "README 파일 열기",
    "durationMinutes": 25,
    "startedAt": "2026-05-10T10:00:00.000Z",
    "endsAt": "2026-05-10T10:25:00.000Z",
    "status": "running"
  },
  "sessions": [
    {
      "id": "session_1715320000000",
      "task": "이력서 프로젝트 설명 수정",
      "nextAction": "README 파일 열기",
      "durationMinutes": 25,
      "startedAt": "2026-05-10T10:00:00.000Z",
      "endedAt": "2026-05-10T10:25:00.000Z",
      "status": "completed",
      "result": "README 첫 문장 수정 완료",
      "nextStep": "기술스택 문장 정리",
      "logs": [
        {
          "time": "2026-05-10T10:00:00.000Z",
          "type": "start",
          "message": "FocusBox 시작"
        },
        {
          "time": "2026-05-10T10:17:00.000Z",
          "type": "brain_dump",
          "message": "GitHub README 이미지 첨부법 찾아보기"
        },
        {
          "time": "2026-05-10T10:25:00.000Z",
          "type": "complete",
          "message": "README 첫 문장 수정 완료"
        }
      ]
    }
  ],
  "dailyLogs": [
    {
      "date": "2026-05-10",
      "logs": [
        {
          "time": "2026-05-10T09:12:00.000Z",
          "type": "ritual_skipped",
          "message": "귀찮음"
        }
      ]
    }
  ]
}
```

---

## 13. 추천 파일 구조

```txt
focusbox-extension/
├── manifest.json
├── background.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── pages/
│   ├── start.html
│   ├── start.css
│   └── start.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
├── src/
│   ├── storage.js
│   ├── session.js
│   ├── date.js
│   └── constants.js
├── assets/
│   └── icon.png
└── README.md
```

---

## 14. manifest.json 초안

```json
{
  "manifest_version": 3,
  "name": "FocusBox",
  "version": "0.1.0",
  "description": "ADHD-friendly time boxing and interstitial journaling for Chrome.",
  "permissions": ["storage", "alarms", "tabs"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "FocusBox"
  },
  "options_page": "options/options.html",
  "chrome_url_overrides": {
    "newtab": "pages/start.html"
  },
  "icons": {
    "16": "assets/icon.png",
    "48": "assets/icon.png",
    "128": "assets/icon.png"
  }
}
```

주의:

`chrome_url_overrides.newtab`을 사용하면 사용자의 새 탭 화면을 FocusBox가 대체한다. MVP에서는 강제성이 있어 장점이 있지만, 사용자가 부담을 느낄 수 있다.

대안:

- 새 탭 대체 없이 `chrome.runtime.onStartup`에서 `pages/start.html`을 새 탭으로 연다.
- 설정에서 “새 탭을 FocusBox로 사용” 옵션을 제공한다.

---

## 15. background.js 역할

`background.js`는 service worker로 동작한다.

역할:

- 설치 시 초기 설정 저장
- 브라우저 시작 시 Start Ritual 필요 여부 확인
- Focus Session 종료 알람 처리
- 세션 상태 저장/복원

### 주요 이벤트

- `chrome.runtime.onInstalled`
- `chrome.runtime.onStartup`
- `chrome.alarms.onAlarm`

Chrome Alarms API는 타이머 종료 시점 처리에 사용한다. 단, 초 단위 화면 업데이트는 popup/page에서 직접 계산하고, alarm은 종료 이벤트 보조 용도로 사용한다.

---

## 16. Popup 역할

확장프로그램 아이콘을 클릭하면 popup이 열린다.

상태별 화면:

### 현재 세션 없음

```txt
FocusBox

아직 진행 중인 작업이 없습니다.

[FocusBox 시작하기]
[오늘의 기록 보기]
```

### 세션 진행 중

```txt
FocusBox 진행 중

작업:
...

남은 시간:
...

[완료]
[딴생각 저장]
[중단]
```

### 오늘 로그

```txt
오늘의 기록
...
```

---

## 17. UX 원칙

### 17.1 하루 전체 계획을 강요하지 않는다

처음부터 Top 3, Brain Dump, 전체 시간표를 모두 작성하게 만들지 않는다.

v0.1은 현재 블록 하나만 시작하게 한다.

### 17.2 기록은 3초 안에 가능해야 한다

Brain Dump 입력은 단축키 또는 버튼 클릭 후 한 줄 입력으로 끝나야 한다.

### 17.3 딴생각은 실패가 아니다

문구에서 죄책감을 유발하지 않는다.

나쁜 문구:

```txt
또 딴짓하고 있나요?
집중 실패!
```

좋은 문구:

```txt
떠오른 생각을 보관하고 지금 작업으로 돌아갑니다.
```

### 17.4 강제 차단보다 복귀 유도

v0.1에서는 사이트 차단을 넣지 않는다.

차단 기능은 v0.2 이후 추가한다.

---

## 18. 이후 버전 계획

### v0.2

- 방해 사이트 감지
- YouTube/SNS 접속 시 복귀 화면 표시
- 이탈/복귀 로그 저장
- 사용자 지정 방해 사이트 목록

### v0.3

- 탭 개수 감지
- 탭 과부하 경고
- 작업 세션별 탭 저장
- Brain Dump 정리 화면

### v1.0

- 주간 통계
- 집중 시간 그래프
- 가장 많이 이탈한 사이트 분석
- AI 기반 하루 회고 요약
- 웹 대시보드 연동

---

## 19. 개발 우선순위

1. `manifest.json` 작성
2. `chrome.storage` 기반 저장 모듈 구현
3. Start Ritual 페이지 구현
4. Focus Session 생성 기능 구현
5. Popup에서 현재 세션 표시
6. Brain Dump 저장 기능 구현
7. 완료/중단 처리 구현
8. 오늘 로그 화면 구현
9. 브라우저 시작 시 Start Ritual 자동 오픈
10. 기본 스타일 정리

---

## 20. 완료 기준

v0.1은 다음 조건을 만족하면 완료로 본다.

- 확장프로그램 설치 가능
- 크롬 실행 또는 새 탭에서 Start Ritual 화면 표시
- 사용자가 작업명과 첫 행동을 입력하고 타이머 시작 가능
- 진행 중인 세션이 popup에서 유지됨
- Brain Dump 저장 가능
- 완료/중단 로그 저장 가능
- 오늘의 기록 확인 가능
- 새로고침하거나 popup을 닫아도 세션 데이터가 유지됨

---

## 21. 프로젝트 소개 문장

이 프로젝트는 다음과 같이 설명할 수 있다.

> FocusBox는 브라우저 기반 작업 중 발생하는 주의 분산 문제를 해결하기 위해 Time Boxing과 Interstitial Journaling을 결합한 Chrome Extension입니다. 사용자는 크롬 실행 직후 현재 작업과 가장 작은 첫 행동을 선언하고, 작업 중 떠오른 생각은 Brain Dump에 저장한 뒤 현재 작업으로 복귀할 수 있습니다. Chrome Storage API와 Manifest V3 기반 service worker를 사용해 작업 세션과 로그를 유지합니다.

---

## 22. 개발 메모

처음부터 React/TypeScript로 복잡하게 가지 않는다.

v0.1은 순수 HTML, CSS, JavaScript로 구현한다.

이유:

- Chrome Extension 구조 학습에 집중
- MVP 완성 속도 향상
- 불필요한 빌드 설정 제거
- Codex가 파일 단위로 수정하기 쉬움

나중에 v0.3 이후 React/TypeScript로 리팩토링할 수 있다.

````

추가로 Codex에게 처음 지시할 때는 이렇게 말하면 됩니다.

```txt
이 README.md를 기준으로 Chrome Extension Manifest V3 프로젝트를 생성해줘.
우선 v0.1 MVP만 구현해줘.
React나 TypeScript는 쓰지 말고, 순수 HTML/CSS/JavaScript로 만들어줘.
파일 구조는 README의 추천 구조를 따라줘.
기능은 Start Ritual, Focus Session, Brain Dump, 완료/중단 로그, 오늘 기록까지만 구현해줘.
````

처음부터 방해 사이트 차단, 탭 감지, AI 요약까지 시키면 산으로 갑니다.
**v0.1은 “크롬 켜기 → 하나 정하기 → 타이머 → 딴생각 저장 → 완료 로그”까지만** 가는 게 맞습니다.
