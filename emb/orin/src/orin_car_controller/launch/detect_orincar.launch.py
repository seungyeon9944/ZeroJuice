from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(
            package='orin_car_controller',
            executable='detect_orincar',
            name='detect_orincar',
            output='screen',
        )
    ])
