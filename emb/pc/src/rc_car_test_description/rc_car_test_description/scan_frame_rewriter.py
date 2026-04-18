import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy

class ScanFrameRewriter(Node):
    def __init__(self):
        super().__init__('scan_frame_rewriter')

        self.declare_parameter('target_frame', 'lidar_link_1')
        target_frame = self.get_parameter('target_frame').value

        # 입력(/scan_raw)은 실제 LiDAR QoS(BEST_EFFORT)에 맞추고,
        # 출력(/scan)은 Nav2가 선호하는 RELIABLE로 발행한다.
        sub_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=10,
            durability=DurabilityPolicy.VOLATILE,
        )
        pub_qos = QoSProfile(
            reliability=ReliabilityPolicy.RELIABLE,
            history=HistoryPolicy.KEEP_LAST,
            depth=10,
            durability=DurabilityPolicy.VOLATILE,
        )

        self.pub = self.create_publisher(LaserScan, '/scan', pub_qos)
        self.sub = self.create_subscription(
            LaserScan,
            '/scan_raw',   # 기존 Gazebo → ROS 브리지 출력
            self.callback,
            sub_qos)

        self.target_frame = target_frame

    def callback(self, msg):
        msg.header.frame_id = self.target_frame
        msg.header.stamp = self.get_clock().now().to_msg()
        self.pub.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = ScanFrameRewriter()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
