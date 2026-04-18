import argparse
import os
import time

import cv2
import torch
from ultralytics import YOLO

from orin_car_controller.hardware import PWMThrottleHat, create_i2c, create_pca9685, create_servo_kit


def build_arg_parser():
    parser = argparse.ArgumentParser(description='Orin car detection and tracking')
    parser.add_argument('--model', default=os.environ.get('ORIN_CAR_MODEL', 'custom.pt'))
    parser.add_argument('--camera', type=int, default=0)
    return parser


def main():
    args = build_arg_parser().parse_args()

    if not os.path.exists(args.model):
        print('Model file not found:', args.model)
        print('Set ORIN_CAR_MODEL or pass --model to use a valid path.')
        return

    model = YOLO(args.model)
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model.to(device)

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print('Error: Could not open camera.')
        return

    i2c = create_i2c()
    pca = create_pca9685(i2c, frequency=60)
    motor_hat = PWMThrottleHat(pca, channel=0)

    kit = create_servo_kit(i2c, address=0x60, channels=16)
    pan = 100
    kit.servo[0].angle = pan

    motor_hat.set_throttle(0)
    kit.servo[0].angle = pan
    speed = 0.0

    use_cuda = cv2.cuda.getCudaEnabledDeviceCount() > 0
    if use_cuda:
        print('CUDA enabled for OpenCV.')
    else:
        print('CUDA not available for OpenCV, using CPU.')

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print('Error: Could not read frame.')
                break

            if use_cuda:
                gpu_frame = cv2.cuda_GpuMat()
                gpu_frame.upload(frame)
                gpu_hsv = cv2.cuda.cvtColor(gpu_frame, cv2.COLOR_BGR2HSV)
                gpu_processed = cv2.cuda.cvtColor(gpu_hsv, cv2.COLOR_HSV2BGR)
                frame = gpu_processed.download()

            results = model(frame)

            speed = 0.0
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    confidence = box.conf[0].item()
                    class_id = box.cls[0].item()
                    label = f'{model.names[int(class_id)]}: {confidence:.2f}'
                    print(label)

                    if model.names[int(class_id)] == 'person':
                        cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                        cv2.putText(frame, label, (int(x1), int(y1) - 10),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                        person_center_x = (x1 + x2) / 2
                        frame_center_x = frame.shape[1] / 2
                        speed = 0.7

                        if person_center_x < frame_center_x - 30:
                            print('Turn left')
                            kit.servo[0].angle = max(80, kit.servo[0].angle - 5)
                        elif person_center_x > frame_center_x + 30:
                            print('Turn right')
                            kit.servo[0].angle = min(120, kit.servo[0].angle + 5)

            motor_hat.set_throttle(speed)
            cv2.imshow('YOLOv8 Detection', frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except KeyboardInterrupt:
        pass
    finally:
        motor_hat.set_throttle(0)
        kit.servo[0].angle = 100
        pca.deinit()
        cap.release()
        cv2.destroyAllWindows()
        print('Program stopped and motor stopped.')


if __name__ == '__main__':
    main()
