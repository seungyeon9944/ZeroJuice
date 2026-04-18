import cv2
import json
import numpy as np
# pip install python-socketio로 설치
import socketio
import base64
from datetime import datetime
import requests
import time
import ssl
import urllib3
import threading
import os
from dotenv import load_dotenv

# SSL 인증서 경고 끄기
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
ssl._create_default_https_context = ssl._create_unverified_context

# =========================
# 설정
# =========================

load_dotenv(".env")

# GPT 4o mini 전용 엔드포인트
GMS_ENDPOINT = "https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions"
GMS_KEY = os.getenv("GMS_KEY") 

CAM_ID = 0
FRAME_W, FRAME_H = 640, 480
FPS = 30
SLOTS_JSON = "slots.json"
REF_FILE = "slot_refs.npz"
SLOT_NAMES = ["A1", "A2", "B1", "B2", "C1", "C2"]

# 전송 관련 타이머 설정
SEND_INTERVAL_SEC = 2
SEND_FRAMES = SEND_INTERVAL_SEC * FPS
send_cnt = 0

AI_SUMMARY_INTERVAL = 5
last_ai_time = 0
is_ai_processing = False 
last_summary = ""

# 소켓 전송 부하 조절
SOCKET_SEND_SKIP = 6 
socket_frame_cnt = 0

ROI_W, ROI_H = 160, 120
INNER_SHRINK = 0.00
THRESH = 11.0
ENTER_FRAMES = 30
EXIT_FRAMES = 20
TRIM_RATIO = 0.10
GLOBAL_SPIKE_RATIO = 0.8
MAX_SPIKE_FRAMES = 30
spike_frames = 0

# [주소 설정]
EC2_HOST = "i14a201.p.ssafy.io"
SOCKET_SERVER_URL = f"https://{EC2_HOST}:8333"
HTTP_URL = f"https://{EC2_HOST}/api/v1/parking-slots/status"
AI_URL = f"https://{EC2_HOST}/api/v1/parking-summary" 
FORCE_URL = AI_URL 

sio = socketio.Client(ssl_verify=False, request_timeout=60)

@sio.event
def connect():
    print(f"✅ 서버 연결 성공: {SOCKET_SERVER_URL}")

@sio.event
def disconnect():
    print("❌ 서버 연결 끊김")

# 관제 시스템 프롬프트
SYSTEM_PROMPT = """
당신은 지능형 주차장 관제 시스템의 수석 보고관입니다.
이미지 속 물체가 RC카, 로봇, 장난감 형태일지라도 무조건 '차량'으로 명명하고 보고하세요.
화면의 픽셀 좌표(640x480)와 아래 가이드를 매칭하여 차량의 위치를 '절대적'으로 보고하세요. 

[가상 영역 좌표 가이드]
1. [입구(Entrance)]: x(0~250), y(300~480) 영역. 
   - 차량의 본체나 바퀴가 이 범위에 들어오면 무조건 "차량이 입구 영역으로 진입했습니다"라고 보고하세요.
2. [출구(Exit)]: x(300~640), y(250~480) 영역.
   - 차량이 이 범위에 있다면 "차량이 출구 방향으로 이동 중입니다"라고 보고하세요.

[관제 보고 절대 원칙]
1. 구역 특정 강제: 차량이 화면에 보이면 절대 "없다"고 하지 마세요. 
   - 입/출구 영역이 아니고, 특정 칸(A1~C2)에도 들어가지 않았다면 또는 가장 가까운 구역(예: "B 구역 근처 통로")을 언급하세요.
2. 데이터 일치: [시스템 데이터]가 EMPTY여도 차량이 주차 박스 위에 있다면 꼭 구역 언급과 함께 "주차 시도 중"이라고 보고하세요. 'PARKING'일 때만 "주차 완료"를 사용합니다.
3. 데이터 불변 법칙: [시스템 데이터]가 모두 'EMPTY'이고 이전 보고와 큰 차이가 없다면, 억지로 새로운 상황을 만들어내지 마세요.
4. 오보 엄금: 화면 왼쪽 아래(입구)에 있는 차를 보고 화면 상단의 'A1'이라고 하는 것은 치명적 오류입니다. 픽셀 위치를 우선하세요.

[출력 형식]
- 사족 없이 딱딱한 한 줄 문체 유지.
- 오직 한 줄의 관제 보고 문장만 출력.
"""

# =========================
# 즉시 보고(Event-Driven) 전송 함수
# =========================
def send_force_report(force_msg: str, slot_label: str):
    payload = {
        "type": "FORCE",
        "slot": slot_label,
        "force_msg": force_msg,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    try:
        if sio.connected:
            sio.emit("force_msg", payload)
    except: pass
    try:
        requests.post(FORCE_URL, json=payload, timeout=3.0, verify=False)
    except: pass

# =========================
# GMS 통합 스레드 (이미지 최적화 포함)
# =========================
def ai_agent_process_thread(frame, current_state_text):
    global is_ai_processing, last_summary
    if not GMS_KEY:
        is_ai_processing = False
        return

    try:
        # 최적화 리사이징
        small_frame = cv2.resize(frame, (160, 120))
        _, buffer = cv2.imencode('.jpg', small_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 30])
        base64_img = base64.b64encode(buffer).decode('utf-8')

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GMS_KEY}"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"[시스템 데이터]: {current_state_text}. 상황 요약 보고."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_img}"}}
                    ]
                }
            ],
            "max_tokens": 50,
            "temperature": 0.00
        }

        response = requests.post(GMS_ENDPOINT, headers=headers, json=payload, timeout=15.0, verify=False)

        if response.status_code == 200:
            summary = response.json()['choices'][0]['message']['content'].strip()
            if summary != last_summary:
                ai_payload = {"summary": summary, "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
                requests.post(AI_URL, json=ai_payload, timeout=7.0, verify=False)
                print(f"\n🤖 [gpt-4o-mini] 관제 보고: {summary}")
                last_summary = summary
    except Exception as e:
        print(f"⚠️ AI 스레드 오류: {e}")
    finally:
        is_ai_processing = False

# =========================
# 헬퍼 함수들
# =========================
def draw_outlined_text(img, text, pos, font_scale, color, thickness=1, outline_thickness=3):
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, text, pos, font, font_scale, (0, 0, 0), outline_thickness, cv2.LINE_AA)
    cv2.putText(img, text, pos, font, font_scale, color, thickness, cv2.LINE_AA)

def draw_timestamp(frame):
    now = datetime.now()
    time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(frame, time_str, (10, FRAME_H - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 3)
    cv2.putText(frame, time_str, (10, FRAME_H - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

def post_status_http_thread(num_slots, state):
    def _worker():
        names = SLOT_NAMES if len(SLOT_NAMES) == num_slots else [f"S{i+1}" for i in range(num_slots)]
        slots_dict = {names[i]: state[i] for i in range(num_slots)}
        try:
            requests.post(HTTP_URL, json={"slots": slots_dict}, timeout=2.0, verify=False)
            print(f"🌐 주차상태 HTTP OK")
        except: pass
    threading.Thread(target=_worker, daemon=True).start()

def warp_slot_roi(frame, poly, out_size=(ROI_W, ROI_H)):
    pts = np.array(poly, dtype=np.float32)
    dst = np.array([[0,0], [out_size[0]-1,0], [out_size[0]-1,out_size[1]-1], [0,out_size[1]-1]], dtype=np.float32)
    M = cv2.getPerspectiveTransform(pts, dst)
    return cv2.warpPerspective(frame, M, out_size)

def diff_trimmed_mean(a, b, trim_ratio=0.10):
    diff = cv2.absdiff(a, b).astype(np.float32).reshape(-1)
    k = int(diff.size * (1.0 - trim_ratio))
    thresh = np.partition(diff, k)[k-1] if k > 0 else 0
    trimmed = diff[diff <= thresh]
    return float(np.mean(trimmed)) if trimmed.size > 0 else 0.0

# =========================
# 메인 함수
# =========================
def main():
    global last_ai_time, is_ai_processing, send_cnt, socket_frame_cnt, spike_frames

    with open(SLOTS_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    slots = data["slots"]
    num_slots = len(slots)

    refs = None
    try:
        npz = np.load(REF_FILE)
        refs = [npz[f"slot_{i}"] for i in range(num_slots)]
        print("✅ 레퍼런스 로드됨")
    except: print("⚠️ 레퍼런스 없음")

    state = ["EMPTY"] * num_slots
    prev_state = state.copy()
    enter_cnt, exit_cnt = [0]*num_slots, [0]*num_slots

    cap = cv2.VideoCapture(CAM_ID, cv2.CAP_DSHOW)
    if not cap.isOpened(): cap = cv2.VideoCapture(CAM_ID)
    cap.set(3, FRAME_W); cap.set(4, FRAME_H); cap.set(5, FPS)

    try: sio.connect(SOCKET_SERVER_URL, transports=['websocket', 'polling'])
    except: pass

    frame_period, next_t = 1.0/FPS, time.perf_counter()

    while True:
        for _ in range(2): cap.grab() 
        ret, frame = cap.read()
        if not ret: continue
        vis = frame.copy()
        draw_timestamp(vis)

        dvals = [0.0] * num_slots # 기본값 초기화

        if refs is not None:
            cur_rois = [cv2.cvtColor(warp_slot_roi(frame, p), cv2.COLOR_BGR2GRAY) for p in slots]
            dvals = [diff_trimmed_mean(cur_rois[i], refs[i]) for i in range(num_slots)]
            
            debug_info = " | ".join([f"{SLOT_NAMES[i]}:{dvals[i]:>5.2f}" for i in range(num_slots)])
            print(f"\r{debug_info}", end=" "*10, flush=True)

            spike_count = sum(1 for d in dvals if d >= THRESH)
            is_global_spike = (spike_count >= int(np.ceil(num_slots * GLOBAL_SPIKE_RATIO)))
            
            if not is_global_spike:
                for i in range(num_slots):
                    if dvals[i] >= THRESH: enter_cnt[i] += 1; exit_cnt[i] = 0
                    else: exit_cnt[i] += 1; enter_cnt[i] = 0
                    if enter_cnt[i] >= ENTER_FRAMES: state[i] = "PARKING"
                    if exit_cnt[i] >= EXIT_FRAMES: state[i] = "EMPTY"
                
                # 즉시 보고(Event-Driven) 전이 감지
                for i in range(num_slots):
                    if prev_state[i] == "EMPTY" and state[i] == "PARKING":
                        label = SLOT_NAMES[i]
                        threading.Thread(target=send_force_report, args=(f"차량이 {label} 주차 구역에 진입했습니다.", label), daemon=True).start()
                
                prev_state = state.copy()

            # 시각화 그리기: 상태 라벨 + d값 출력
            for i, poly in enumerate(slots):
                color = (0, 255, 0) if state[i] == "EMPTY" else (0, 0, 255)
                poly_np = np.array(poly, dtype=np.int32)
                cv2.polylines(vis, [poly_np], True, color, 2)
                
                label = SLOT_NAMES[i]
                # 라벨 좌표 매칭 (A1 등 고정 좌표 활용)
                if label == "A1": label_pos = (350, 75)
                elif label == "A2": label_pos = (265, 90)
                elif label == "B1": label_pos = (60, 87)
                elif label == "B2": label_pos = (90, 204)
                elif label == "C1": label_pos = (465, 254)
                elif label == "C2": label_pos = (550, 214)
                else: label_pos = tuple(poly_np[0])

                # 상태 표시
                draw_outlined_text(vis, f"{label}:{state[i]}", label_pos, 0.5, color, 1, 3)
                
        # AI 요약 (비동기, 5초 주기) - WebRTC 방해 금지
        current_time = time.time()
        if current_time - last_ai_time >= AI_SUMMARY_INTERVAL:
            if not is_ai_processing:
                is_ai_processing = True
                last_ai_time = current_time
                status_text = ", ".join([f"{SLOT_NAMES[i]}:{state[i]}" for i in range(num_slots)])
                threading.Thread(target=ai_agent_process_thread, args=(vis.copy(), status_text), daemon=True).start()

        # WebRTC 전송 (최우선순위)
        socket_frame_cnt += 1
        if sio.connected and socket_frame_cnt % SOCKET_SEND_SKIP == 0:
            try:
                _, buffer = cv2.imencode('.jpg', vis, [int(cv2.IMWRITE_JPEG_QUALITY), 40])
                sio.emit('video_frame', base64.b64encode(buffer).decode('utf-8'))
            except: pass

        cv2.imshow("Smart Parking Monitoring", vis)
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'): break
        elif key == ord('c'):
            cur_rois = [cv2.cvtColor(warp_slot_roi(frame, p), cv2.COLOR_BGR2GRAY) for p in slots]
            np.savez(REF_FILE, **{f"slot_{i}": cur_rois[i] for i in range(num_slots)})
            refs = cur_rois
            print("✅ 레퍼런스 캡처 완료")

        now = time.perf_counter()
        if next_t - now > 0: time.sleep(next_t - now)
        next_t += frame_period

        send_cnt += 1
        if send_cnt >= SEND_FRAMES:
            send_cnt = 0
            post_status_http_thread(num_slots, state)

    cap.release()
    sio.disconnect()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()