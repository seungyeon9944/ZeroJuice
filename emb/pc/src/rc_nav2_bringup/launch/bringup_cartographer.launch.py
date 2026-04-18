from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, DeclareLaunchArgument
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from ament_index_python.packages import get_package_share_directory
from launch_ros.actions import Node
from launch.conditions import IfCondition
import os

def generate_launch_description():

    # --- 패키지 디렉토리 ---
    pkg_nav = get_package_share_directory('rc_nav2_bringup')
    pkg_desc = get_package_share_directory('rc_car_test_description')

    # --- 옵션 선언 ---
    use_gazebo_arg = DeclareLaunchArgument(
        'use_gazebo', default_value='False',
        description='Whether to launch Gazebo simulation'
    )

    use_display_arg = DeclareLaunchArgument(
        'use_display', default_value='True',
        description='Whether to launch display.launch.py (URDF + RViz)'
    )

    use_gazebo = LaunchConfiguration('use_gazebo')
    use_display = LaunchConfiguration('use_display')

    # --- Cartographer 설정 ---
    carto_config_dir = os.path.join(pkg_nav, 'config')
    carto_config_basename = 'cartographer_2d.lua'

    # --- display.launch.py ---
    display_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_desc, 'launch', 'display.launch.py')
        ),
        condition=IfCondition(use_display),
        launch_arguments={
            'gui': 'False',
            'use_rviz': 'False',
        }.items()
    )

    # --- gazebo.launch.py ---
    gazebo_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_desc, 'launch', 'gazebo.launch.py')
        ),
        condition=IfCondition(use_gazebo),
    )

    # --- Cartographer Node ---
    cartographer_node = Node(
        package='cartographer_ros',
        executable='cartographer_node',
        name='cartographer_node',
        output='screen',
        arguments=[
            '-configuration_directory', carto_config_dir,
            '-configuration_basename', carto_config_basename,
        ],
        remappings=[('scan', 'scan')]
    )

    # --- Occupancy Grid Creator Node ---
    occupancy_node = Node(
        package='cartographer_ros',
        executable='cartographer_occupancy_grid_node',
        name='occupancy_grid_node',
        output='screen',
        parameters=[{
            'resolution': 0.05,
            'publish_period_sec': 1.0,
        }]
    )

    # --- RViz (SLAM Visualization) ---
    rviz_config = os.path.join(pkg_nav, 'config', 'slam_cartographer.rviz')
    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        output='screen',
        arguments=['-d', rviz_config]
    )

    return LaunchDescription([
        use_gazebo_arg,
        use_display_arg,
        display_launch,
        gazebo_launch,
        cartographer_node,
        occupancy_node,
        rviz_node,
    ])
