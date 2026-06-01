# FocusBox

ADHD-friendly Time Boxing + Interstitial Journaling Chrome Extension.

FocusBox는 브라우저를 열 때 사용자가 지금 하려는 일을 먼저 정하고, 작업 중 떠오르는 생각은 잠깐 맡겨 둔 뒤 다시 현재 작업으로 돌아오게 돕는 작은 집중 도구입니다. v0.3부터는 Chrome 로컬 스토리지에 쌓인 로그를 로컬 FastAPI 백엔드와 SQLite DB에 동기화하는 MVP 파이프라인을 포함합니다.

## 현재 버전

현재 구현 범위는 `v0.3 MVP`입니다.

- 오늘의 첫 박스
- Focus Session 타이머
- 생각 맡기기 / Quick Capture
- 완료 로그
- 중단 로그
- 오늘 기록
- Focus Session 중 방해 사이트 경고
- Popup 기본 화면
- Chrome Storage API 기반 세션/로그 저장
- Manifest V3 service worker 기반 설치/브라우저 시작 처리
- FastAPI 로컬 백엔드
- SQLite 기반 로그 영구 저장
- Extension `dailyLogs` -> `/api/sync-logs` 동기화
- 중복 로그 저장 방지

기능과 데이터 구조는 단순하게 유지합니다. 확장 프로그램의 주요 저장 키는 `settings`, `currentSession`, `sessions`, `dailyLogs`입니다.

## v0.3 API 연동

v0.3에서는 브라우저 안에만 있던 FocusBox 로그를 로컬 백엔드로 보낼 수 있게 했습니다.

### 흐름

1. Chrome Extension이 `chrome.storage.local`에서 `dailyLogs`를 읽습니다.
2. `background.js`가 로그를 `POST http://localhost:8000/api/sync-logs`로 전송합니다.
3. FastAPI 서버가 요청 body를 Pydantic 모델로 검증합니다.
4. 서버가 각 로그의 `date`, `type`, `message`, `time`, `sessionId`를 SQLite에 저장합니다.
5. SQLite의 `UNIQUE(session_id, time)` 제약과 `INSERT OR IGNORE`로 중복 저장을 막습니다.
6. API는 새로 저장된 로그 개수를 `new_saved_count`로 반환합니다.

### 백엔드 구조

루트의 `main.py`가 로컬 API 서버입니다.

```txt
main.py
focusbox.db
```

`main.py`의 주요 역할:

- FastAPI 앱 생성
- Extension 요청을 받기 위한 CORS 허용
- `focusbox.db` SQLite 연결
- `focus_logs` 테이블 자동 생성
- `/api/sync-logs` POST 엔드포인트 제공
- Extension 로그 필드 매핑
- 중복 로그 무시

저장 테이블:

```sql
CREATE TABLE IF NOT EXISTS focus_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_date TEXT,
    log_type TEXT,
    message TEXT,
    time TEXT,
    session_id TEXT,
    UNIQUE(session_id, time)
);
```

요청 payload:

```json
{
  "logs": [
    {
      "date": "2026-06-01",
      "logs": [
        {
          "type": "brain_dump",
          "message": "API 테스트",
          "time": "2026-06-01T12:00:00.000Z",
          "sessionId": "session-id"
        }
      ]
    }
  ]
}
```

응답 예시:

```json
{
  "status": "success",
  "new_saved_count": 5
}
```

## 주요 사용자 흐름

1. Chrome 실행 또는 새 탭에서 FocusBox가 열립니다.
2. `오늘의 첫 박스` 화면에서 지금 할 작업과 첫 행동을 입력합니다.
3. `10분`, `25분`, `50분` 중 하나를 선택하고 Focus Session을 시작합니다.
4. Focus Session 화면에서 현재 작업, 첫 행동, 남은 시간을 확인합니다.
5. 작업 중 떠오르는 생각은 `생각 맡기기`로 저장하고 현재 작업으로 돌아옵니다.
6. 작업을 끝내면 `완료`, 흐름을 멈추면 `중단`으로 기록합니다.
7. `오늘 기록`에서 시작, 생각 맡기기, 완료, 중단, 방해 사이트 로그를 확인합니다.
8. 새 탭을 여는 임시 트리거를 통해 로컬 FastAPI 서버로 `dailyLogs`를 동기화합니다.

## 화면별 역할

### 오늘의 첫 박스

브라우저를 켠 이유를 잊기 전에 첫 작업 하나만 정하는 화면입니다.

주요 버튼:

- `첫 박스 시작하기`
- `오늘은 건너뛰기`

### Focus Session

현재 작업과 남은 시간을 가장 먼저 보여주는 집중 화면입니다. `완료`, `생각 맡기기`, `중단` 동작만 제공합니다.

### 생각 맡기기 / Quick Capture

지금 붙잡지 않아도 되는 생각을 한 줄로 저장하고 현재 작업으로 돌아오는 화면입니다.

### 방해 사이트 경고

Focus Session 중 기본 방해 사이트에 접근하면 표시합니다.

선택 가능한 동작:

- `작업으로 돌아가기`
- `생각 맡기기`
- `기록하고 계속 이동`

### 오늘 기록

오늘의 FocusBox 로그를 시간순으로 확인합니다. `ritual_skipped` 로그는 사용자에게 `첫 박스 건너뜀`으로 표시합니다.

### Popup

진행 중인 박스와 남은 시간을 빠르게 확인하거나 오늘 기록을 볼 수 있습니다.

## 실행 방법

### 1. 백엔드 실행

필요 패키지:

```bash
pip install fastapi uvicorn
```

로컬 API 서버 실행:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

서버가 실행되면 `focusbox.db`와 `focus_logs` 테이블이 자동으로 준비됩니다.

### 2. Chrome Extension 설치

1. Chrome에서 `chrome://extensions`를 엽니다.
2. 오른쪽 위의 `개발자 모드`를 켭니다.
3. `압축해제된 확장 프로그램을 로드합니다`를 누릅니다.
4. `focusbox-extension/` 폴더를 선택합니다.

`manifest.json`에는 `http://localhost:8000/*` 권한이 포함되어 있어 Extension에서 로컬 FastAPI 서버로 요청을 보낼 수 있습니다.

## 테스트 체크리스트

1. FastAPI 서버를 `localhost:8000`에서 실행합니다.
2. 확장 프로그램 설치 직후 FocusBox 시작 화면이 열리는지 확인합니다.
3. 새 탭을 열어 `오늘의 첫 박스` 화면이 표시되는지 확인합니다.
4. 작업명과 첫 행동을 입력하고 Focus Session을 시작합니다.
5. Focus Session 화면에서 현재 작업, 첫 행동, 타이머가 명확히 보이는지 확인합니다.
6. `생각 맡기기`를 저장한 뒤 현재 작업 화면으로 돌아오는지 확인합니다.
7. `완료` 또는 `중단`을 저장하면 오늘 기록에 로그가 추가되는지 확인합니다.
8. Focus Session 중 `youtube.com` 또는 `reddit.com`에 접속하면 경고 화면이 뜨는지 확인합니다.
9. Popup에서 진행 중인 박스와 오늘 기록이 같은 데이터로 표시되는지 확인합니다.
10. 새 탭을 열었을 때 FastAPI 콘솔에 동기화 로그가 찍히는지 확인합니다.
11. 같은 로그를 다시 동기화해도 SQLite에 중복 저장되지 않는지 확인합니다.

## 구현 위치

```txt
.
├── main.py
├── focusbox.db
├── devlog_api.html
└── focusbox-extension/
    ├── manifest.json
    ├── background.js
    ├── popup/
    ├── pages/
    ├── options/
    ├── src/
    └── assets/
```

## 다음 단계 후보

- `background.js` 동기화 트리거를 새 탭 생성 임시 방식에서 명시적/주기적 동기화 방식으로 변경
- API 응답 필드와 Extension 콘솔 로그 필드 이름 정리
- `requirements.txt` 추가
- SQLite 조회용 디버그 엔드포인트 추가
- AI/ML 분석을 위한 로그 export 또는 summary API 추가
