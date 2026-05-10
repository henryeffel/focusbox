# FocusBox Extension v0.1

Manifest V3 기반 Chrome Extension MVP입니다. React와 TypeScript 없이 순수 HTML, CSS, JavaScript로 구현했습니다.

## 구현 범위

- Start Ritual
- Focus Session 타이머
- Brain Dump 저장
- 완료 로그
- 중단 로그
- 오늘 기록
- Chrome Storage API 기반 세션/로그 저장
- Manifest V3 service worker 기반 설치/브라우저 시작 처리

이번 버전에는 방해 사이트 차단, 탭 감지, AI 요약을 포함하지 않았습니다.

## 실행 방법

1. Chrome에서 `chrome://extensions`를 엽니다.
2. 오른쪽 위의 `개발자 모드`를 켭니다.
3. `압축해제된 확장 프로그램을 로드합니다`를 누릅니다.
4. 이 폴더를 선택합니다.

```txt
focusbox-extension/
```

## 테스트 방법

1. 확장 설치 직후 FocusBox 시작 화면이 열리는지 확인합니다.
2. 새 탭을 열어 Start Ritual 화면이 표시되는지 확인합니다.
3. 작업명과 첫 행동을 입력하고 `10분`, `25분`, `50분` 중 하나를 선택한 뒤 `시작하기`를 누릅니다.
4. 확장 아이콘을 눌러 popup에서 진행 중인 세션과 남은 시간이 보이는지 확인합니다.
5. 진행 화면에서 `딴생각 저장`을 눌러 Brain Dump가 오늘 기록에 남는지 확인합니다.
6. `완료` 또는 `중단`을 저장한 뒤 오늘 기록에 로그가 추가되는지 확인합니다.
7. popup을 닫거나 페이지를 새로고침해도 세션 상태가 유지되는지 확인합니다.

## 저장 데이터

데이터는 `chrome.storage.local`에 저장됩니다.

- `settings`
- `currentSession`
- `sessions`
- `dailyLogs`

## v0.2 Distraction Detection

Focus Session이 실행 중일 때만 기본 방해 사이트 접속을 감지합니다. 세션이 없거나 종료된 상태에서는 사이트 이동을 막지 않습니다.

기본 방해 사이트:

- `youtube.com`
- `www.youtube.com`
- `instagram.com`
- `www.instagram.com`
- `x.com`
- `twitter.com`
- `www.facebook.com`
- `reddit.com`

방해 사이트에 접속하면 `pages/blocked.html` 경고 페이지가 같은 탭에 표시됩니다. 경고 페이지는 현재 작업명과 첫 행동을 보여주며 다음 선택지를 제공합니다.

- `Return to task`: 이전 페이지로 돌아갑니다. 이전 페이지를 알 수 없으면 FocusBox 작업 화면으로 돌아갑니다.
- `Save to thought parking`: 한 줄 입력을 `brain_dump` 로그로 저장하고 FocusBox 작업 화면으로 돌아갑니다.
- `Record drift and continue`: `distraction` 로그를 저장하고 원래 접속하려던 사이트로 이동합니다.

기존 저장 키(`settings`, `currentSession`, `sessions`, `dailyLogs`)는 유지됩니다. v0.2는 기존 세션 로그 배열과 일일 로그 배열에 `distraction` 타입 로그만 추가합니다.

## v0.2 Test

1. `chrome://extensions`에서 `focusbox-extension/`을 다시 로드합니다.
2. FocusBox에서 작업명과 첫 행동을 입력하고 Focus Session을 시작합니다.
3. 같은 탭에서 `https://youtube.com` 또는 `https://reddit.com`으로 이동합니다.
4. 경고 페이지에 현재 작업명과 첫 행동이 표시되는지 확인합니다.
5. `Return to task`를 눌러 이전 페이지 또는 FocusBox 작업 화면으로 돌아가는지 확인합니다.
6. 다시 방해 사이트로 이동한 뒤 `Save to thought parking`을 누르고 한 줄을 저장합니다. 오늘 로그에 `brain_dump`가 추가되는지 확인합니다.
7. 다시 방해 사이트로 이동한 뒤 `Record drift and continue`를 누릅니다. 원래 사이트로 이동하고 오늘 로그에 `distraction`이 추가되는지 확인합니다.
8. Focus Session을 완료하거나 중단한 뒤 같은 방해 사이트에 접속해도 경고 페이지가 뜨지 않는지 확인합니다.
