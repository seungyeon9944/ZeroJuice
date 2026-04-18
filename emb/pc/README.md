# S14P11A201

ROS 2 기반 RC Car 시뮬레이션/SLAM/Nav2 자율주행 워크스페이스입니다.  
Gazebo(`ros_gz_sim`) 환경에서 차량 모델을 띄우고, LiDAR + RF2O 오도메트리 + Cartographer + Nav2를 이용해 주행/주차 시나리오를 실행합니다.

## 프로젝트 구성

- `src/rc_car_test_description`
  - RC Car URDF/Xacro, Gazebo 월드, 브리지 설정, 조향/휠 제어 노드 포함
  - 주요 노드
    - `twist_to_joint_cmd`: `/cmd_vel` -> 조향/바퀴 조인트 명령 변환
    - `scan_frame_rewriter`: `/scan_raw`를 `/scan`으로 재발행하며 `frame_id` 보정
  - 주요 런치
    - `display.launch.py`: URDF + (선택) RViz
    - `gazebo.launch.py`: Gazebo 스폰 + 브리지 + 컨트롤러 + 센서 파이프라인

- `src/rf2o_laser_odometry`
  - LiDAR 기반 2D 오도메트리(RF2O) C++ 패키지
  - `rf2o_laser_odometry_node` 제공

- `src/rc_nav2_bringup`
  - Cartographer/Navigation2 런치 및 파라미터
  - `mqtt_parking_flow` 노드(주차 명령 MQTT 연동) 포함
  - 주요 런치
    - `rf2o.launch.py`: RF2O 노드 실행
    - `bringup_cartographer.launch.py`: Cartographer SLAM + RViz
    - `bringup_all.launch.py`: RF2O + Cartographer + Nav2 서버 묶음 실행
    - `navigation.launch.py`: Nav2 bringup + 다중 주차맵 레이어 서버 실행

- 루트 파일
  - `mqtt.py`: AMCL pose를 MQTT로 송신하는 단독 테스트 스크립트
  - `image.png`: 기존 사용 가이드 이미지

## 요구 환경

- Ubuntu + ROS 2 (Humble 계열 기준)
- 필수 패키지(예시)
  - `ros_gz_sim`, `ros_gz_bridge`
  - `cartographer_ros`
  - `nav2_bringup` 및 Nav2 관련 패키지
  - `ros2_control`, `controller_manager`
- Python 패키지
  - `paho-mqtt`

## 빌드

```bash
cd ~/ros2_ws
colcon build --symlink-install
source install/setup.bash
```

## 실행 시나리오

### 1) Gazebo + 차량 모델 실행

```bash
ros2 launch rc_car_test_description gazebo.launch.py
```

### 2) RF2O 실행

```bash
ros2 launch rc_nav2_bringup rf2o.launch.py use_sim_time:=False scan_topic:=/scan rf2o_freq:=5.0
```

### 3) SLAM + Nav2 전체 실행

```bash
ros2 launch rc_nav2_bringup bringup_all.launch.py
```

### 4) 수동 조작(선택)

```bash
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

### 5) 지도 저장(선택)

```bash
ros2 run nav2_map_server map_saver_cli -f ~/map
```

### 6) 저장 지도 기반 내비게이션 실행

```bash
ros2 launch rc_nav2_bringup navigation.launch.py
```

## MQTT 주차 플로우

`rc_nav2_bringup`에는 `mqtt_parking_flow` 노드가 포함되어 있습니다.

```bash
ros2 run rc_nav2_bringup mqtt_parking_flow
```

기본 동작:
- `car/+/command` 토픽 구독
- `PARK`, `EXIT` 명령 처리
- `/amcl_pose` 기반으로 `car/<carNo>/pose` 송신
- 완료 시 `car/<carNo>/ack` 송신

## 주의 사항

- 일부 파일에 워크스페이스 절대경로가 하드코딩되어 있습니다.
  - `src/rc_nav2_bringup/launch/navigation.launch.py`
  - `src/rc_nav2_bringup/config/nav2_params.yaml`
- 본인 환경 경로(예: `~/ros2_ws/src/rc_nav2_bringup/...`)로 수정 후 사용해야 합니다.
- `bringup_all.launch.py`는 MQTT 노드를 자동 실행하지 않으므로 필요 시 별도 실행해야 합니다.

## 빠른 점검 포인트

- `/scan` 토픽 수신 여부
- TF 트리(`map -> odom -> base_link`) 정상 여부
- Nav2 lifecycle 노드 active 여부
- RF2O `/odom_rf2o` 퍼블리시 여부

