# orin_car

Jetson Orin 기반 RC카 제어 및 LiDAR 연동을 위한 ROS 2 워크스페이스입니다.  
이 저장소는 크게 차량 제어 패키지(`orin_car_controller`)와 LiDAR 드라이버 패키지(`ydlidar_ros2_driver`)로 구성됩니다.

## 1. 프로젝트 구성

```
orin_car/
├─ src/
│  ├─ orin_car_controller/   # 차량 제어(모터/서보/키보드/YOLO 추적)
│  ├─ ydlidar_ros2_driver/   # YDLidar ROS2 드라이버
│  └─ YDLidar-SDK/           # YDLidar C++ SDK 소스
├─ mqtt_pose_publisher.py    # AMCL pose -> MQTT (루트 보조 스크립트)
└─ README.md
```

## 2. 주요 패키지

### `orin_car_controller` (ament_python)
- `motor_node`: `cmd_vel` 구독 후 DC 모터/조향 서보 제어
- `keyboard_control`: 키보드(`w/s/a/d`) 수동 제어
- `detect_orincar`: YOLO 기반 사람 추적 + 주행 제어
- `dc_motor_demo`, `servo_motor_demo`: 하드웨어 단독 테스트

주요 토픽:
- 구독: `cmd_vel` (`geometry_msgs/msg/Twist`)

런치 파일:
- `ros2 launch orin_car_controller motor_node.launch.py`
- `ros2 launch orin_car_controller keyboard_control.launch.py`
- `ros2 launch orin_car_controller detect_orincar.launch.py`

### `ydlidar_ros2_driver` (ament_cmake)
- YDLidar 센서 연결 및 `scan` 토픽 퍼블리시
- RViz 포함 런치 제공

대표 실행:
- `ros2 launch ydlidar_ros2_driver ydlidar_launch.py`
- `ros2 launch ydlidar_ros2_driver ydlidar_launch_view.py`

## 3. 요구사항

권장 환경:
- Ubuntu + ROS 2 (Humble 이상 권장)
- Jetson Orin 계열 보드(I2C 사용)
- Python 3.10+

ROS 2 의존:
- `rclpy`, `rclcpp`, `geometry_msgs`, `sensor_msgs`, `visualization_msgs`, `std_srvs`, `launch`, `launch_ros`

Python 의존(차량 제어/비전):
- `adafruit-circuitpython-pca9685`
- `adafruit-circuitpython-servokit`
- `adafruit-blinka`
- `pynput`
- `opencv-python`
- `torch`
- `ultralytics`
- `paho-mqtt` (MQTT 스크립트 사용 시)

## 4. 빌드

루트(`orin_car`)에서:

```bash
# 1) YDLidar SDK 설치 (최초 1회)
cd src/YDLidar-SDK
mkdir -p build && cd build
cmake ..
make -j$(nproc)
sudo make install
sudo ldconfig

# 2) 워크스페이스 빌드
cd ../../..
colcon build --symlink-install
source install/setup.bash
```

## 5. 실행 가이드

### 5.1 모터/조향 노드 실행
```bash
source install/setup.bash
ros2 launch orin_car_controller motor_node.launch.py
```

테스트용 `cmd_vel` 퍼블리시:
```bash
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist \
"{linear: {x: 0.2}, angular: {z: 0.0}}" -r 10
```

### 5.2 키보드 수동 제어
```bash
source install/setup.bash
ros2 launch orin_car_controller keyboard_control.launch.py
```

### 5.3 YOLO 기반 추적 제어
기본 모델 경로는 `custom.pt`입니다.

```bash
source install/setup.bash
ros2 launch orin_car_controller detect_orincar.launch.py
```

필요 시:
```bash
export ORIN_CAR_MODEL=/path/to/model.pt
```

### 5.4 LiDAR 실행
기본 파라미터 파일: `src/ydlidar_ros2_driver/params/ydlidar.yaml`

```bash
source install/setup.bash
ros2 launch ydlidar_ros2_driver ydlidar_launch.py
```

RViz 포함:
```bash
ros2 launch ydlidar_ros2_driver ydlidar_launch_view.py
```

## 6. 하드웨어/파라미터 참고

- 조향 서보 기본 각도 범위: 좌 `30`, 중앙 `100`, 우 `150`
- 속도 스케일 기준 상수: `MAX_LINEAR = 0.7`
- LiDAR 기본 포트: `/dev/ttyUSB0` (`ydlidar.yaml`에서 변경 가능)

관련 파일:
- `src/orin_car_controller/src/orin_car_controller/motor_node.py`
- `src/orin_car_controller/src/orin_car_controller/hardware.py`
- `src/ydlidar_ros2_driver/params/ydlidar.yaml`

## 7. 주의사항

- `ydlidar_ros2_driver`는 시스템에 `ydlidar_sdk` 라이브러리가 먼저 설치되어 있어야 빌드됩니다.
- I2C/PWM 장치 접근 권한(사용자 그룹/udev)이 필요할 수 있습니다.
- 루트 `mqtt_pose_publisher.py`는 인코딩/문자열 깨짐 상태가 있어, MQTT 연동이 필요하면
  `src/orin_car_controller/src/orin_car_controller/mqtt_pose_publisher_copy.py`를 기준으로 정리해서 사용하는 것을 권장합니다.
