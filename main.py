from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3  # 1. 내장 SQLite 라이브러리 수입

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. DB 초기화 설정 (서버가 켜질 때 실행됨) ---
DB_FILE = "focusbox.db"

def init_db():
    # 데이터베이스 파일과 연결 (없으면 자동으로 만듭니다)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    # 로그를 저장할 테이블(표) 설계
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS focus_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_date TEXT,
            log_type TEXT,
            message TEXT,
            time TEXT,
            session_id TEXT,
            UNIQUE(session_id, time) -- 중복 데이터 저장 방지 장치
        )
    """)
    conn.commit()
    conn.close()

# 서버가 시작될 때 테이블을 미리 만들어 둡니다.
init_db()


# --- 3. Pydantic 데이터 규격 정의 ---
class DailyGroup(BaseModel):
    date: str
    logs: List[dict]

class LogPayload(BaseModel):
    logs: List[DailyGroup]


# --- 4. API 엔드포인트 로직 ---
@app.post("/api/sync-logs")
def sync_logs(payload: LogPayload):
    print(f"\n===== [FocusBox] 총 {len(payload.logs)}일치 데이터를 DB에 저장합니다 =====")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    saved_count = 0

    for day in payload.logs:
        for log in day.logs:
            # 안전하게 데이터 추출
            log_date = day.date
            log_type = log.get('type') or 'unknown'
            message = log.get('message') or '내용 없음'
            time = log.get('time') or ''
            session_id = log.get('sessionId') or ''
            
            try:
                # SQL 명령어를 통해 DB에 한 줄씩 데이터 삽입
                cursor.execute("""
                    INSERT OR IGNORE INTO focus_logs (log_date, log_type, message, time, session_id)
                    VALUES (?, ?, ?, ?, ?)
                """, (log_date, log_type, message, time, session_id))
                
                # 실제 데이터가 삽입되었는지 확인 (중복 무시 처리가 안 된 경우만 카운트)
                if cursor.rowcount > 0:
                    saved_count += 1
            except Exception as e:
                print(f"❌ 저장 중 에러 발생: {e}")

    conn.commit() # 최종적으로 하드디스크에 저장 확정(Commit)
    conn.close()  # 안전하게 통로 닫기
            
    print(f"💾 이번 요청으로 새로 저장된 로그 개수: {saved_count}개")
    print("===================================================\n")
    return {"status": "success", "new_saved_count": saved_count}