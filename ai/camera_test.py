# =========================
# 카메라 설정 확인용 코드
# =========================
import cv2

for i in range(5):
    cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
    if cap.isOpened():
        print(f"✅ Camera {i} OPENED")
        ret, frame = cap.read()
        if ret:
            cv2.imshow(f"Camera {i}", frame)
            cv2.waitKey(2000)
            cv2.destroyAllWindows()
        cap.release()
    else:
        print(f"❌ Camera {i} FAILED")
