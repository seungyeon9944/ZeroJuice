#!/usr/bin/env python3
import json
import math
import time

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseWithCovarianceStamped

import paho.mqtt.client as mqtt


class MqttPosePublisher(Node):
    def __init__(self):
        super().__init__('mqtt_pose_publisher')

        # ======================
        # MQTT 설정
        # ======================
        self.mqtt_broker = "13.209.9.201"   # 서버 IP
        self.mqtt_port = 8082
        self.mqtt_topic = "robot/123가4567/pose"
        self.mqtt_command_topic = "car/123가4567/command"

        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.connect(self.mqtt_broker, self.mqtt_port, 60)
        self.client.loop_start()

        # ======================
        # ROS2 Subscriber
        # ======================
        self.subscription = self.create_subscription(
            PoseWithCovarianceStamped,
            '/amcl_pose',
            self.pose_callback,
            10
        )

        self.latest_pose = None
        self.active_command = None
        self.current_car_no = None

        # ======================
        # 1초 주기 타이머
        # ======================
        self.timer = self.create_timer(1.0, self.timer_callback)

        self.get_logger().info("MQTT Pose Publisher started")

    def pose_callback(self, msg):
        self.latest_pose = msg

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.get_logger().info("MQTT connected")
            client.subscribe(self.mqtt_command_topic, qos=1)
            self.get_logger().info(f"MQTT subscribe: {self.mqtt_command_topic}")
        else:
            self.get_logger().error(f"MQTT connect failed: {rc}")

    def on_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            parts = topic.split("/")
            if len(parts) != 3 or parts[0] != "car" or parts[2] != "command":
                return
            car_no = parts[1]

            raw_payload = msg.payload.decode("utf-8")
            self.get_logger().info(f"MQTT received: {topic} {raw_payload}")
            payload = json.loads(raw_payload)
        except Exception as exc:
            self.get_logger().error(f"MQTT message parse error: {exc}")
            return

        cmd_type = payload.get("type")
        if cmd_type != "PARK":
            self.get_logger().info(f"Ignored command type: {cmd_type}")
            return

        slot_no = payload.get("slotNo")
        if not slot_no:
            self.get_logger().error("PARK command missing slotNo")
            return

        self.active_command = payload
        self.current_car_no = car_no
        self.get_logger().info(f"Received PARK command for {car_no}, slot {slot_no}")

    def timer_callback(self):
        if self.latest_pose is None or self.active_command is None:
            return

        pose = self.latest_pose.pose.pose

        x = pose.position.x
        y = pose.position.y

        # quaternion → yaw
        q = pose.orientation
        yaw = math.atan2(
            2.0 * (q.w * q.z + q.x * q.y),
            1.0 - 2.0 * (q.y * q.y + q.z * q.z)
        )

        timestamp = time.strftime("%Y-%m-%dT%H:%M:%S")
        payload = {
            "commandId": self.active_command.get("commandId"),
            "type": self.active_command.get("type"),
            "slotNo": self.active_command.get("slotNo"),
            "carNo": self.current_car_no,
            "x": round(x, 3),
            "y": round(y, 3),
            "yaw": round(yaw, 3),
            "timestamp": timestamp
        }

        topic = self.mqtt_topic
        if self.current_car_no:
            topic = f"car/{self.current_car_no}/pose"

        self.client.publish(
            topic,
            json.dumps(payload),
            qos=1
        )

        self.get_logger().info(f"MQTT publish: {topic} {payload}")


def main(args=None):
    rclpy.init(args=args)
    node = MqttPosePublisher()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
