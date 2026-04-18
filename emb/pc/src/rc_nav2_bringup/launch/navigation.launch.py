import os

from ament_index_python.packages import get_package_share_directory

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch.conditions import IfCondition
from launch_ros.actions import Node


def generate_launch_description():
    # Get the launch directory
    bringup_dir = get_package_share_directory('nav2_bringup')
    rc_nav2_bringup_dir = get_package_share_directory('rc_nav2_bringup')
    launch_dir = os.path.join(bringup_dir, 'launch')

    # Create the launch configuration variables
    slam = LaunchConfiguration('slam')
    namespace = LaunchConfiguration('namespace')
    use_namespace = LaunchConfiguration('use_namespace')
    map_yaml_file = LaunchConfiguration('map')
    use_sim_time = LaunchConfiguration('use_sim_time')
    params_file = LaunchConfiguration('params_file')
    autostart = LaunchConfiguration('autostart')
    use_composition = LaunchConfiguration('use_composition')
    use_respawn = LaunchConfiguration('use_respawn')
    use_rviz = LaunchConfiguration('use_rviz')
    rviz_config_file = LaunchConfiguration('rviz_config_file')
    log_level = LaunchConfiguration('log_level')

    # Declare the launch arguments
    declare_slam_cmd = DeclareLaunchArgument('slam', default_value='False', description='Whether run a SLAM')
    declare_map_yaml_cmd = DeclareLaunchArgument(
        'map',
        default_value=PathJoinSubstitution(['/home/junho/ros2_ws/src/rc_nav2_bringup', 'maps', 'map.yaml']),
        description='Full path to map file to load')
    declare_use_sim_time_cmd = DeclareLaunchArgument('use_sim_time', default_value='False', description='Use simulation (Gazebo) clock if true')
    declare_params_file_cmd = DeclareLaunchArgument(
        'params_file',
        default_value=os.path.join(rc_nav2_bringup_dir, 'config', 'nav2_params.yaml'),
        description='Full path to the ROS2 parameters file to use for all launched nodes')
    declare_autostart_cmd = DeclareLaunchArgument('autostart', default_value='true', description='Automatically startup the nav2 stack')
    declare_use_rviz_cmd = DeclareLaunchArgument('use_rviz', default_value='true', description='Launch RViz2')
    declare_use_composition_cmd = DeclareLaunchArgument('use_composition', default_value='False', description='Use composed bringup')
    declare_rviz_config_cmd = DeclareLaunchArgument(
        'rviz_config_file',
        default_value=os.path.join(bringup_dir, 'rviz', 'nav2_default_view.rviz'),
        description='Full path to the RVIZ config file to use')
    declare_log_level_cmd = DeclareLaunchArgument(
        'log_level',
        default_value='bt_navigator:=debug',
        description='ROS log level, e.g., info or bt_navigator:=debug')

    # Specify the actions
    bringup_cmd = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(os.path.join(launch_dir, 'bringup_launch.py')),
        launch_arguments={'slam': slam,
                          'map': map_yaml_file,
                          'use_sim_time': use_sim_time,
                          'params_file': params_file,
                          'autostart': autostart,
                          'use_rviz': use_rviz,
                          'use_composition': use_composition,
                          'log_level': log_level}.items())

    rviz_cmd = Node(
        condition=IfCondition(use_rviz),
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        arguments=['-d', rviz_config_file],
        output='screen',
        parameters=[{'use_sim_time': use_sim_time}],
    )

    parking_a1_map_server_cmd = Node(
        package='nav2_map_server',
        executable='map_server',
        name='parking_A1_map_server',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'yaml_filename': '/home/junho/ros2_ws/src/rc_nav2_bringup/maps/parking_A1.yaml'},
        ],
        remappings=[('map', 'parking_A1_map')],
    )

    parking_a2_map_server_cmd = Node(
        package='nav2_map_server',
        executable='map_server',
        name='parking_A2_map_server',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'yaml_filename': '/home/junho/ros2_ws/src/rc_nav2_bringup/maps/parking_A2.yaml'},
        ],
        remappings=[('map', 'parking_A2_map')],
    )

    parking_b1_map_server_cmd = Node(
        package='nav2_map_server',
        executable='map_server',
        name='parking_B1_map_server',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'yaml_filename': '/home/junho/ros2_ws/src/rc_nav2_bringup/maps/parking_B1.yaml'},
        ],
        remappings=[('map', 'parking_B1_map')],
    )

    parking_b2_map_server_cmd = Node(
        package='nav2_map_server',
        executable='map_server',
        name='parking_B2_map_server',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'yaml_filename': '/home/junho/ros2_ws/src/rc_nav2_bringup/maps/parking_B2.yaml'},
        ],
        remappings=[('map', 'parking_B2_map')],
    )

    parking_c1_map_server_cmd = Node(
        package='nav2_map_server',
        executable='map_server',
        name='parking_C1_map_server',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'yaml_filename': '/home/junho/ros2_ws/src/rc_nav2_bringup/maps/parking_C1.yaml'},
        ],
        remappings=[('map', 'parking_C1_map')],
    )

    parking_c2_map_server_cmd = Node(
        package='nav2_map_server',
        executable='map_server',
        name='parking_C2_map_server',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'yaml_filename': '/home/junho/ros2_ws/src/rc_nav2_bringup/maps/parking_C2.yaml'},
        ],
        remappings=[('map', 'parking_C2_map')],
    )

    parking_map_lifecycle_manager_cmd = Node(
        package='nav2_lifecycle_manager',
        executable='lifecycle_manager',
        name='parking_map_lifecycle_manager',
        output='screen',
        parameters=[
            {'use_sim_time': use_sim_time},
            {'autostart': autostart},
            {'node_names': [
                'parking_A1_map_server',
                'parking_A2_map_server',
                'parking_B1_map_server',
                'parking_B2_map_server',
                'parking_C1_map_server',
                'parking_C2_map_server',
            ]},
        ],
    )

    # Create the launch description and populate
    ld = LaunchDescription()
    ld.add_action(declare_slam_cmd)
    ld.add_action(declare_map_yaml_cmd)
    ld.add_action(declare_use_sim_time_cmd)
    ld.add_action(declare_params_file_cmd)
    ld.add_action(declare_autostart_cmd)
    ld.add_action(declare_use_rviz_cmd)
    ld.add_action(declare_use_composition_cmd)
    ld.add_action(declare_rviz_config_cmd)
    ld.add_action(declare_log_level_cmd)
    ld.add_action(parking_a1_map_server_cmd)
    ld.add_action(parking_a2_map_server_cmd)
    ld.add_action(parking_b1_map_server_cmd)
    ld.add_action(parking_b2_map_server_cmd)
    ld.add_action(parking_c1_map_server_cmd)
    ld.add_action(parking_c2_map_server_cmd)
    ld.add_action(parking_map_lifecycle_manager_cmd)
    ld.add_action(bringup_cmd)
    ld.add_action(rviz_cmd)

    return ld
