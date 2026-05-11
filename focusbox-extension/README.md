# FocusBox Extension v0.2

Manifest V3 기반 Chrome Extension MVP입니다. React나 TypeScript 없이 순수 HTML, CSS, JavaScript로 구현되어 있습니다.

## 구현 범위

- 오늘의 첫 박스
- Focus Session 타이머
- 생각 맡기기 / Quick Capture
- 완료 로그
- 중단 로그
- 오늘 기록
- Focus Session 중 방해 사이트 경고
- Chrome Storage API 기반 세션/로그 저장
- Manifest V3 service worker 기반 설치/브라우저 시작 처리

기존 저장 키(`settings`, `currentSession`, `sessions`, `dailyLogs`)와 로그 타입은 유지됩니다.

## 실행 방법

1. Chrome에서 `chrome://extensions`를 엽니다.
2. 오른쪽 위의 `개발자 모드`를 켭니다.
3. `압축해제된 확장 프로그램을 로드합니다`를 누릅니다.
4. 아래 폴더를 선택합니다.

```txt
focusbox-extension/
```

## 주요 화면 용어

- `오늘의 첫 박스`: 브라우저를 켠 뒤 첫 작업 하나를 정하는 시작 화면입니다.
- `첫 박스 시작하기`: 작업명, 첫 행동, 시간을 입력한 뒤 Focus Session을 시작합니다.
- `생각 맡기기`: 지금 붙잡지 않아도 되는 생각을 한 줄로 저장하고 현재 작업으로 돌아갑니다.
- `오늘 기록`: 시작, 생각 맡김, 완료, 중단, 방해 사이트 기록을 확인합니다.
- `첫 박스 건너뜀`: 오늘의 시작 과정을 건너뛴 기록입니다.

## 방해 사이트 경고

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

경고 화면에서 선택할 수 있는 동작:

- `작업으로 돌아가기`: 이전 페이지로 돌아갑니다. 이전 페이지를 알 수 없으면 FocusBox 작업 화면으로 돌아갑니다.
- `생각 맡기기`: 한 줄 입력을 `brain_dump` 로그로 저장하고 FocusBox 작업 화면으로 돌아갑니다.
- `기록하고 계속 이동`: `distraction` 로그를 저장하고 원래 접속하려던 사이트로 이동합니다.

## 테스트 체크리스트

1. 확장 설치 직후 FocusBox 시작 화면이 열리는지 확인합니다.
2. 새 탭을 열어 `오늘의 첫 박스` 화면이 표시되는지 확인합니다.
3. 작업명과 첫 행동을 입력하고 `10분`, `25분`, `50분` 중 하나를 선택한 뒤 `첫 박스 시작하기`를 누릅니다.
4. 확장 아이콘을 눌러 popup에서 진행 중인 박스와 남은 시간이 보이는지 확인합니다.
5. 진행 화면에서 `생각 맡기기`를 눌러 기록이 오늘 기록에 남는지 확인합니다.
6. `완료` 또는 `중단`을 저장한 뒤 오늘 기록에 로그가 추가되는지 확인합니다.
7. Focus Session 중 `https://youtube.com` 또는 `https://reddit.com`으로 이동해 경고 화면이 표시되는지 확인합니다.
8. 경고 화면의 `작업으로 돌아가기`, `생각 맡기기`, `기록하고 계속 이동` 동작을 각각 확인합니다.
9. Focus Session을 완료하거나 중단한 뒤 같은 방해 사이트에 접속해도 경고 페이지가 뜨지 않는지 확인합니다.
