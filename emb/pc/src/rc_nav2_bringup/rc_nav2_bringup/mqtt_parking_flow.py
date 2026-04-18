#!/usr/bin/env python3
import json
import math
import os
import threading
import time
from collections import deque
from dataclasses import dataclass
from typing import Dict, Optional

import rclpy
from rclpy.action import ActionClient
from rclpy.node import Node
from rclpy.parameter import Parameter

from ament_index_python.packages import get_package_share_directory
from action_msgs.msg import GoalStatus
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from nav2_msgs.action import NavigateToPose
from rcl_interfaces.srv import SetParameters
from std_msgs.msg import String

import paho.mqtt.client as mqtt


@dataclass
class SlotPoses:
    prep: PoseStamped
    park: PoseStamped


class MqttParkingFlow(Node):
    def __init__(self):
        super().__init__('mqtt_parking_flow')

        self.declare_parameter('mqtt_broker', '13.209.9.201')
        self.declare_parameter('mqtt_port', 8082)
        self.declare_parameter('mqtt_command_topic', 'car/+/command')
        self.declare_parameter('allowed_car_numbers', ['123가4567', '123가4565'])
        self.declare_parameter('mqtt_pose_topic', 'car/123가4567/pose')
        self.declare_parameter('frame_id', 'map')
        self.declare_parameter('direction_topic', '/drive_direction')

        self.mqtt_broker = self.get_parameter('mqtt_broker').value
        self.mqtt_port = int(self.get_parameter('mqtt_port').value)
        self.mqtt_command_topic = self.get_parameter('mqtt_command_topic').value
        self.mqtt_pose_topic = self.get_parameter('mqtt_pose_topic').value
        self.frame_id = self.get_parameter('frame_id').value
        self.direction_topic = self.get_parameter('direction_topic').value
        self._allowed_car_numbers = set(self.get_parameter('allowed_car_numbers').value or [])

        self._latest_pose = None
        self._state = 'IDLE'
        self._current_car_no = None
        self._current_slot_no = None
        self._active_command = None
        self._goal_handle = None
        self._goal_label = None
        self._delay_timer = None

        self._command_queue = deque()
        self._command_lock = threading.Lock()

        self._nav_client = ActionClient(self, NavigateToPose, 'navigate_to_pose')
        self._param_client = self.create_client(SetParameters, '/planner_server/set_parameters')
        self._costmap_param_client = self.create_client(
            SetParameters,
            '/global_costmap/global_costmap/set_parameters',
        )
        self._bt_param_client = self.create_client(
            SetParameters,
            '/bt_navigator/set_parameters',
        )
        self._direction_pub = self.create_publisher(String, self.direction_topic, 10)

        self._slot_poses = self._build_slot_poses()
        self._exit_pose = self._make_pose(
            x=1.2588925748565996,
            y=3.0376471372590528,
            z=0.0,
            qx=0.0,
            qy=0.0,
            qz=0.7032373334990851,
            qw=0.7109551693131547,
        )

        pkg_share = get_package_share_directory('rc_nav2_bringup')
        self._bt_default = os.path.join(pkg_share, 'config', 'simple_nav_to_pose.xml')
        self._bt_reeds = os.path.join(pkg_share, 'config', 'simple_nav_to_pose_reeds.xml')

        self.create_subscription(
            PoseWithCovarianceStamped,
            '/amcl_pose',
            self._pose_callback,
            10,
        )

        self._setup_mqtt()

        self.create_timer(0.1, self._process_command_queue)
        self.create_timer(1.0, self._publish_pose)

        self.get_logger().info('MQTT parking flow started')

    def _setup_mqtt(self):
        self._mqtt_client = mqtt.Client()
        self._mqtt_client.on_connect = self._on_mqtt_connect
        self._mqtt_client.on_message = self._on_mqtt_message
        self._mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
        self._mqtt_client.loop_start()

    def _pose_callback(self, msg: PoseWithCovarianceStamped):
        self._latest_pose = msg

    def _on_mqtt_connect(self, client, userdata, flags, rc):
        if rc != 0:
            self.get_logger().error(f'MQTT connect failed: {rc}')
            return
        client.subscribe(self.mqtt_command_topic, qos=1)
        self.get_logger().info(f'MQTT subscribe: {self.mqtt_command_topic}')

    def _on_mqtt_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            parts = topic.split('/')
            if len(parts) != 3 or parts[0] != 'car' or parts[2] != 'command':
                return
            car_no = parts[1]
            if self._allowed_car_numbers and car_no not in self._allowed_car_numbers:
                return

            raw_payload = msg.payload.decode('utf-8')
            payload = json.loads(raw_payload)
        except Exception as exc:
            self.get_logger().error(f'MQTT message parse error: {exc}')
            return

        with self._command_lock:
            self._command_queue.append((car_no, payload))

        self.get_logger().info(f'MQTT received: {topic} {payload}')

    def _process_command_queue(self):
        if self._state in ('NAV_TO_PREP', 'NAV_TO_PARK', 'NAV_TO_EXIT'):
            return

        with self._command_lock:
            if not self._command_queue:
                return
            car_no, payload = self._command_queue.popleft()

        cmd_type = payload.get('type')
        if cmd_type == 'PARK':
            if self._state != 'IDLE':
                self.get_logger().info('Ignoring PARK: not idle')
                return
            slot_no = payload.get('slotNo')
            if not slot_no:
                self.get_logger().error('PARK command missing slotNo')
                return
            if slot_no not in self._slot_poses:
                self.get_logger().error(f'Unknown slotNo: {slot_no}')
                return
            slot = self._slot_poses.get(slot_no)
            if slot is None:
                self.get_logger().error(f'Slot poses not configured: {slot_no}')
                return

            self._active_command = payload
            self._current_car_no = car_no
            self._current_slot_no = slot_no
            self._state = 'NAV_TO_PREP'
            self._set_parking_layer(slot_no, done_cb=lambda: self._delay_then(
                lambda: self._send_nav_goal(slot.prep, 'prep'),
                5.0,
            ))
            return

        if cmd_type in ('Exit', 'EXIT'):
            # if self._state != 'PARKED':
            #     self.get_logger().info('Ignoring Exit: not parked')
            #     return
            self._active_command = payload
            self._current_car_no = car_no
            self._state = 'NAV_TO_EXIT'
            self._send_nav_goal(
                self._exit_pose,
                'exit',
                bt_xml=self._bt_default,
            )
            return

        self.get_logger().info(f'Ignored command type: {cmd_type}')

    def _send_nav_goal(self, pose: PoseStamped, label: str, bt_xml: Optional[str] = None):
        if not self._nav_client.wait_for_server(timeout_sec=2.0):
            self.get_logger().error('NavigateToPose action server not available')
            self._reset_state()
            return

        direction = None
        if label in ('prep', 'exit'):
            direction = 'forward'
        elif label == 'park':
            direction = 'backward'
        if direction:
            self._publish_direction(direction)

        if bt_xml:
            self.get_logger().info(f'Nav goal BT: label={label} bt={bt_xml}')
        else:
            self.get_logger().info(f'Nav goal BT: label={label} bt=default')

        goal_msg = NavigateToPose.Goal()
        goal_msg.pose = pose
        if bt_xml:
            goal_msg.behavior_tree = bt_xml
        self._goal_label = label

        send_future = self._nav_client.send_goal_async(goal_msg)
        send_future.add_done_callback(self._on_goal_response)

    def _on_goal_response(self, future):
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.get_logger().error(f'Goal rejected: {self._goal_label}')
            self._reset_state()
            return

        self._goal_handle = goal_handle
        result_future = goal_handle.get_result_async()
        result_future.add_done_callback(self._on_nav_result)

    def _on_nav_result(self, future):
        result = future.result()
        status = result.status

        self.get_logger().info(
            f'Nav result: label={self._goal_label} state={self._state} status={status}'
        )

        if status != GoalStatus.STATUS_SUCCEEDED:
            self.get_logger().error(f'Goal failed ({self._goal_label}): status={status}')
            self._reset_state()
            return

        if self._state == 'NAV_TO_PREP':
            self.get_logger().info('Reached prep; switching planner to REEDS_SHEPP')
            self._go_to_park()
            return

        if self._state == 'NAV_TO_PARK':
            self.get_logger().info('Reached park; switching planner to DUBIN')
            self._finish_parking()
            return

        if self._state == 'NAV_TO_EXIT':
            self._finish_exit()
            return

    def _go_to_park(self):
        slot = self._slot_poses.get(self._current_slot_no)
        if not slot:
            self.get_logger().error(f'Slot poses missing for {self._current_slot_no}')
            self._reset_state()
            return
        self._state = 'NAV_TO_PARK'
        self._send_nav_goal(slot.park, 'park', bt_xml=self._bt_reeds)

    def _finish_parking(self):
        self._state = 'PARKED'
        self.get_logger().info(f'Parked at slot {self._current_slot_no}')
        self._publish_ack(command_type='PARK', result='ACCEPTED')
        self.get_logger().info('Parking done: set planner to DUBIN then reset BT')
        self._set_planner_params(
            motion_model='DUBIN',
            reverse_penalty=2.0,
            change_penalty=0.0,
            done_cb=self._set_bt_default,
            plugin_name='SmacHybridDubins',
            delay_sec=0.0,
        )

    def _finish_exit(self):
        self.get_logger().info('Exit complete')
        self._reset_state()

    def _reset_state(self):
        self._state = 'IDLE'
        self._current_slot_no = None
        self._current_car_no = None
        self._active_command = None
        self._goal_handle = None
        self._goal_label = None

    def _set_planner_params(
        self,
        motion_model: str,
        reverse_penalty: float,
        change_penalty: float,
        done_cb=None,
        plugin_name: str = 'SmacHybridDubins',
        delay_sec: float = 20.0,
    ):
        if not self._param_client.wait_for_service(timeout_sec=2.0):
            self.get_logger().error('Planner parameter service not available')
            self._reset_state()
            return

        self.get_logger().info(
            f'Setting planner params: plugin={plugin_name}, motion_model={motion_model}, '
            f'reverse_penalty={reverse_penalty}, change_penalty={change_penalty}'
        )

        prefix = f'{plugin_name}.'
        params = [
            Parameter(
                f'{prefix}motion_model_for_search',
                Parameter.Type.STRING,
                motion_model,
            ).to_parameter_msg(),
            Parameter(
                f'{prefix}reverse_penalty',
                Parameter.Type.DOUBLE,
                float(reverse_penalty),
            ).to_parameter_msg(),
            Parameter(
                f'{prefix}change_penalty',
                Parameter.Type.DOUBLE,
                float(change_penalty),
            ).to_parameter_msg(),
        ]

        future = self._param_client.call_async(SetParameters.Request(parameters=params))

        def _handle_response(fut):
            try:
                response = fut.result()
            except Exception as exc:
                self.get_logger().error(f'Planner params update failed: {exc}')
                self._reset_state()
                return

            if response and any(not result.successful for result in response.results):
                reasons = [result.reason for result in response.results if not result.successful]
                self.get_logger().error(f'Planner params update rejected: {reasons}')
                self._reset_state()
                return

            if done_cb:
                if delay_sec > 0.0:
                    self._delay_then(done_cb, delay_sec)
                else:
                    done_cb()
            else:
                self.get_logger().info('Planner params updated')

        future.add_done_callback(_handle_response)

    def _set_parking_layer(self, slot_no: str, done_cb=None):
        if not self._costmap_param_client.wait_for_service(timeout_sec=2.0):
            self.get_logger().error('Global costmap parameter service not available')
            self._reset_state()
            return

        slot_keys = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        params = []
        for key in slot_keys:
            params.append(
                Parameter(
                    f'parking_{key}_layer.enabled',
                    Parameter.Type.BOOL,
                    False,
                ).to_parameter_msg()
            )

        if slot_no in slot_keys:
            params.append(
                Parameter(
                    f'parking_{slot_no}_layer.enabled',
                    Parameter.Type.BOOL,
                    True,
                ).to_parameter_msg()
            )

        self.get_logger().info(f'Setting costmap parking layers for slot {slot_no}')
        future = self._costmap_param_client.call_async(SetParameters.Request(parameters=params))

        def _handle_response(fut):
            try:
                response = fut.result()
            except Exception as exc:
                self.get_logger().error(f'Costmap params update failed: {exc}')
                self._reset_state()
                return

            if response and any(not result.successful for result in response.results):
                reasons = [result.reason for result in response.results if not result.successful]
                self.get_logger().error(f'Costmap params update rejected: {reasons}')
                self._reset_state()
                return

            if done_cb:
                done_cb()

        future.add_done_callback(_handle_response)

    def _set_bt_default(self):
        if not self._bt_param_client.wait_for_service(timeout_sec=2.0):
            self.get_logger().error('BT navigator parameter service not available')
            return

        self.get_logger().info('Resetting default BT to simple_nav_to_pose')
        params = [
            Parameter(
                'default_bt_xml_filename',
                Parameter.Type.STRING,
                self._bt_default,
            ).to_parameter_msg(),
            Parameter(
                'default_nav_to_pose_bt_xml',
                Parameter.Type.STRING,
                self._bt_default,
            ).to_parameter_msg(),
        ]

        future = self._bt_param_client.call_async(SetParameters.Request(parameters=params))

        def _handle_response(fut):
            try:
                response = fut.result()
            except Exception as exc:
                self.get_logger().error(f'BT params update failed: {exc}')
                return

            if response and any(not result.successful for result in response.results):
                reasons = [result.reason for result in response.results if not result.successful]
                self.get_logger().error(f'BT params update rejected: {reasons}')
                return

            self.get_logger().info('BT reset complete')

        future.add_done_callback(_handle_response)

    def _delay_then(self, callback, seconds: float):
        if self._delay_timer is not None:
            try:
                self._delay_timer.cancel()
            except Exception:
                pass
        self.get_logger().info(f'Waiting {seconds:.1f}s before next action')

        def _fire():
            if self._delay_timer is not None:
                self._delay_timer.cancel()
                self._delay_timer = None
            self.get_logger().info('Delay done; continuing next action')
            callback()

        self._delay_timer = self.create_timer(seconds, _fire)

    def _publish_pose(self):
        if self._latest_pose is None:
            return
        if self._state not in ('NAV_TO_PREP', 'NAV_TO_PARK', 'NAV_TO_EXIT'):
            return

        pose = self._latest_pose.pose.pose
        q = pose.orientation
        yaw = math.atan2(
            2.0 * (q.w * q.z + q.x * q.y),
            1.0 - 2.0 * (q.y * q.y + q.z * q.z),
        )

        timestamp = time.strftime('%Y-%m-%dT%H:%M:%S')
        payload = {
            'type': self._active_command.get('type') if self._active_command else None,
            'slotNo': self._current_slot_no,
            'carNo': self._current_car_no,
            'x': round(pose.position.x, 3),
            'y': round(pose.position.y, 3),
            'yaw': round(yaw, 3),
            'timestamp': timestamp,
        }

        topic = self.mqtt_pose_topic
        if self._current_car_no:
            topic = f'car/{self._current_car_no}/pose'

        self._mqtt_client.publish(topic, json.dumps(payload), qos=1)

    def _publish_ack(self, command_type: str, result: str):
        if not self._current_car_no:
            self.get_logger().error('ACK publish skipped: car number missing')
            return

        timestamp = time.strftime('%Y-%m-%dT%H:%M:%S')
        payload = {
            'commandType': command_type,
            'result': result,
            'timestamp': timestamp,
        }
        topic = f'car/{self._current_car_no}/ack'
        self._mqtt_client.publish(topic, json.dumps(payload), qos=1)

    def _publish_direction(self, direction: str):
        msg = String()
        msg.data = direction
        self._direction_pub.publish(msg)

    def _make_pose(self, x, y, z, qx, qy, qz, qw) -> PoseStamped:
        pose = PoseStamped()
        pose.header.frame_id = self.frame_id
        pose.pose.position.x = float(x)
        pose.pose.position.y = float(y)
        pose.pose.position.z = float(z)
        pose.pose.orientation.x = float(qx)
        pose.pose.orientation.y = float(qy)
        pose.pose.orientation.z = float(qz)
        pose.pose.orientation.w = float(qw)
        return pose

    def _build_slot_poses(self) -> Dict[str, Optional[SlotPoses]]:
        return {
            'A1': SlotPoses(
                prep=self._make_pose(
                    x=-0.5000038126005454,
                    y=-0.05481545001168882,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=-0.9999814380189839,
                    qw=0.006092915351870774,
                ),
                park=self._make_pose(
                    x=0.43347520237517365,
                    y=-0.9752401007958878,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=0.676958185400779,
                    qw=0.7360214774168513,
                ),
            ),
            'A2': SlotPoses(
                prep=self._make_pose(
                    x=-0.06845146550742791,
                    y=-0.012461519614134843,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=-0.9998674138251016,
                    qw=0.016283573646564454,
                ),
                park=self._make_pose(
                    x=0.918401550481573,
                    y=-1.0569639687580201,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=0.6955579593363295,
                    qw=0.7184699890767052,
                ),
            ),
            'B1': SlotPoses(
                prep=self._make_pose(
                    x=0.4356815131485755,
                    y=-0.2119611464954307,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=0.9997653927489818,
                    qw=0.021660089138186435,
                ),
                park=self._make_pose(
                    x= 2.412332592737062,
                    y=-0.20216668555973988,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=0.9978716428090267,
                    qw=0.06520877607817961,
                ),
            ),
            'B2':  SlotPoses(
                prep=self._make_pose(
                    x=0.4356815131485755,
                    y= 0.254216668555973988,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=0.9997653927489818,
                    qw=0.021660089138186435,
                ),
                park=self._make_pose(
                    x= 2.382332592737062,
                    y= 0.254216668555973988,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=0.9978716428090267,
                    qw=0.06520877607817961,
                ),
            ),
            'C1': None,
            'C2': SlotPoses(
                prep=self._make_pose(
                    x=-0.281124617677556,
                    y=0.12801221826777624,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=-0.9999921890843634,
                    qw=0.003952438521070954,
                ),
                park=self._make_pose(
                    x=0.2829900732321928,
                    y=1.1755823309682225,
                    z=0.0,
                    qx=0.0,
                    qy=0.0,
                    qz=-0.695314700201159,
                    qw=0.7187054109189469,
                ),
            ),
        }


def main(args=None):
    rclpy.init(args=args)
    node = MqttParkingFlow()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
