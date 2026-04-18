import cv2
import json
import os

# =========================
# 설정
# =========================
CAM_ID = 0
FRAME_W, FRAME_H = 640, 480
NUM_SLOTS = 6          # 주차칸 개수
POINTS_PER_SLOT = 4   # 한 칸당 4점
OUT_JSON = "slots.json"

# =========================
# 전역 변수
# =========================
slots = []             # [[(x,y),(x,y),(x,y),(x,y)], ...]
current_points = []    # 현재 칸의 점들
current_slot_idx = 0

# =========================
# 마우스 콜백
# =========================
def mouse_callback(event, x, y, flags, param):
    global current_points, slots, current_slot_idx

    if event == cv2.EVENT_LBUTTONDOWN:
        if current_slot_idx >= NUM_SLOTS:
            return

        current_points.append((x, y))
        print(f"Slot {current_slot_idx+1} - Point {len(current_points)}: ({x}, {y})")

        # 4점 다 찍으면 슬롯 확정
        if len(current_points) == POINTS_PER_SLOT:
            slots.append(current_points.copy())
            current_points.clear()
            current_slot_idx += 1
            print(f"✅ Slot {current_slot_idx} saved")

# =========================
# 메인
# =========================
def main():
    global current_points, slots

    cap = cv2.VideoCapture(CAM_ID, cv2.CAP_DSHOW)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_W)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_H)

    if not cap.isOpened():
        print("❌ Camera open failed")
        return

    cv2.namedWindow("ROI Editor")
    cv2.setMouseCallback("ROI Editor", mouse_callback)

    print("🖱️ 마우스로 슬롯을 클릭하세요")
    print(" - 슬롯 1칸당 4점")
    print(" - 총", NUM_SLOTS, "칸")
    print(" - r: 현재 슬롯 리셋")
    print(" - s: 저장 후 종료")
    print(" - q: 그냥 종료 (저장 안 함)")

    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        vis = frame.copy()

        # 이미 확정된 슬롯 그리기
        for idx, slot in enumerate(slots):
            for i in range(4):
                cv2.line(vis, slot[i], slot[(i+1) % 4], (0, 255, 0), 2)
            cx = sum(p[0] for p in slot) // 4
            cy = sum(p[1] for p in slot) // 4
            cv2.putText(vis, f"S{idx+1}", (cx-10, cy),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)

        # 현재 찍고 있는 슬롯
        for p in current_points:
            cv2.circle(vis, p, 4, (0, 0, 255), -1)

        if current_points:
            for i in range(len(current_points)-1):
                cv2.line(vis, current_points[i], current_points[i+1], (0, 0, 255), 1)

        cv2.imshow("ROI Editor", vis)
        key = cv2.waitKey(1) & 0xFF

        if key == ord('r'):
            print("🔄 현재 슬롯 리셋")
            current_points.clear()

        elif key == ord('s'):
            if len(slots) != NUM_SLOTS:
                print(f"❌ 아직 {NUM_SLOTS}칸을 다 찍지 않았습니다")
                continue

            data = {
                "num_slots": NUM_SLOTS,
                "slots": slots
            }
            with open(OUT_JSON, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            print(f"💾 저장 완료: {OUT_JSON}")
            break

        elif key == ord('q'):
            print("🛑 종료 (저장 안 함)")
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
