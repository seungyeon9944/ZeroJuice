from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(
            package='orin_car_controller',
            executable='motor_node',
            name='orin_car_controller',
            output='screen',
            additional_env={'JETSON_MODEL_NAME': 'JETSON_ORIN_NANO'},
        )
    ])
