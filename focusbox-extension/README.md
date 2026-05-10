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
