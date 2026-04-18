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

        self.client = mqtt.Client()
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

        # ======================
        # 1초 주기 타이머
        # ======================
        self.timer = self.create_timer(1.0, self.timer_callback)

        self.get_logger().info("MQTT Pose Publisher started")

    def pose_callback(self, msg):
        self.latest_pose = msg

    def timer_callback(self):
        if self.latest_pose is None:
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

        payload = {
            "x": round(x, 3),
            "y": round(y, 3),
            "yaw": round(yaw, 3),
            "timestamp": "zzz하이ㅋㅋㅋ"
        }

        self.client.publish(
            self.mqtt_topic,
            json.dumps(payload),
            qos=1
        )

        self.get_logger().info(f"MQTT publish: {payload}")


def main(args=None):
    rclpy.init(args=args)
    node = MqttPosePublisher()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
