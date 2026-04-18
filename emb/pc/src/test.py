import rclpy
from rclpy.node import Node
from nav2_msgs.action import NavigateToPose
from nav2_msgs.action._navigate_to_pose import NavigateToPose_SendGoal_Request
import yaml
import os

class GoalToSlotYaml(Node):
    def __init__(self):
        super().__init__('goal_to_slot_yaml')

        self.slot_index = 1
        self.save_dir = os.path.expanduser('~/nav2_slots')
        os.makedirs(self.save_dir, exist_ok=True)

        self.create_subscription(
            NavigateToPose_SendGoal_Request,
            '/navigate_to_pose/_action/goal',
            self.goal_callback,
            10
        )

        self.get_logger().info(
            f'Listening for Nav2 goals. Saving to {self.save_dir}'
        )

    def goal_callback(self, msg):
        pose = msg.goal.pose

        filename = f'slot_{self.slot_index:02d}.yaml'
        filepath = os.path.join(self.save_dir, filename)

        data = {
            'frame_id': pose.header.frame_id,
            'position': {
                'x': float(pose.pose.position.x),
                'y': float(pose.pose.position.y),
                'z': float(pose.pose.position.z),
            },
            'orientation': {
                'x': float(pose.pose.orientation.x),
                'y': float(pose.pose.orientation.y),
                'z': float(pose.pose.orientation.z),
                'w': float(pose.pose.orientation.w),
            }
        }

        with open(filepath, 'w') as f:
            yaml.dump(data, f, sort_keys=False)

        self.get_logger().info(f'Saved {filename}')
        self.slot_index += 1


def main():
    rclpy.init()
    node = GoalToSlotYaml()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == '__main__':
    main()
