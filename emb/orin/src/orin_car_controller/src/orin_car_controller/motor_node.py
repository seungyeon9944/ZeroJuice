#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist

from orin_car_controller.hardware import (
    PWMThrottleHat,
    create_i2c,
    create_pca9685,
    create_servo_kit,
)

# =====================
# Steering parameters
# =====================
STEER_INPUT_MAX = 1.2   # external steering input range (-1.2 ~ +1.2)

# Servo angles
SERVO_LEFT = 30
SERVO_CENTER = 100
SERVO_RIGHT = 150

# =====================
# Motor parameters
# =====================
MIN_DEADBAND = 0.02
MAX_LINEAR = 0.7


class OrinCarController(Node):
    def __init__(self):
        super().__init__('orin_car_controller')

        # ---- Hardware init ----
        i2c = create_i2c()
        pca = create_pca9685(i2c, frequency=60)

        self.motor_hat = PWMThrottleHat(pca, channel=0)
        self.servo_kit = create_servo_kit(i2c, address=0x60, channels=16)

        self.SERVO_LEFT = SERVO_LEFT
        self.SERVO_CENTER = SERVO_CENTER
        self.SERVO_RIGHT = SERVO_RIGHT

        # Safe initial state
        self.servo_kit.servo[0].angle = self.SERVO_CENTER
        self.motor_hat.set_throttle(0.0)

        # ---- ROS subscription ----
        self.subscription = self.create_subscription(
            Twist,
            'cmd_vel',
            self.cmd_callback,
            10,
        )

        self.get_logger().info('Orin car cmd_vel controller started.')

    # =====================
    # cmd_vel callback
    # =====================
    def cmd_callback(self, msg):
        v = msg.linear.x

        # ROS -> servo direction alignment
        steer_input = -msg.angular.z

        # 🔥 reverse steering compensation
        if v < 0.0:
            steer_input = -steer_input

        self.get_logger().info(
            f'cmd_vel: v={v:.3f}, steer_input={steer_input:.3f}'
        )

        self.control_steering(steer_input)
        self.control_motor(v)

    # =====================
    # Steering control
    # =====================
    def control_steering(self, ang):
        """
        ang: -1.2 ~ +1.2
        LEFT  : -1.2 ~ 0   -> 30  ~ 100
        RIGHT :  0   ~ 1.2 -> 100 ~ 150
        """

        # clamp input
        ang = max(min(ang, STEER_INPUT_MAX), -STEER_INPUT_MAX)

        if ang < 0.0:
            # LEFT
            ratio = ang / STEER_INPUT_MAX   # -1.0 ~ 0.0
            angle = self.SERVO_CENTER + ratio * (
                self.SERVO_CENTER - self.SERVO_LEFT
            )
        else:
            # RIGHT
            ratio = ang / STEER_INPUT_MAX   # 0.0 ~ 1.0
            angle = self.SERVO_CENTER + ratio * (
                self.SERVO_RIGHT - self.SERVO_CENTER
            )

        angle = int(round(angle))
        angle = max(min(angle, self.SERVO_RIGHT), self.SERVO_LEFT)

        self.servo_kit.servo[0].angle = angle
        self.get_logger().info(f'Steering: {angle}')

    # =====================
    # Motor control
    # =====================
    def control_motor(self, lin):
        if abs(lin) < MIN_DEADBAND:
            self.motor_hat.set_throttle(0.0)
            self.get_logger().info('Motor: STOP')
            return

        scale = min(abs(lin) / MAX_LINEAR, 1.0)
        throttle = scale if lin > 0 else -scale

        self.motor_hat.set_throttle(throttle)
        self.get_logger().info(
            f'Motor: {"FORWARD" if lin > 0 else "BACKWARD"} {throttle:.2f}'
        )


def main(args=None):
    rclpy.init(args=args)
    node = OrinCarController()

    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass

    # ---- Safe shutdown ----
    node.motor_hat.set_throttle(0.0)
    node.servo_kit.servo[0].angle = node.SERVO_CENTER

    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
