from setuptools import setup, find_packages
import os
from glob import glob

package_name = 'orin_car_controller'

setup(
    name=package_name,
    version='0.1.0',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='you',
    maintainer_email='you@example.com',
    description='Orin car controller package (motor, servo, keyboard, detection).',
    license='MIT',
    data_files=[
        ('share/ament_index/resource_index/packages',
         ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'),
         glob('launch/*.launch.py')),
    ],
    entry_points={
        'console_scripts': [
            'dc_motor_demo = orin_car_controller.dc_motor_demo:main',
            'servo_motor_demo = orin_car_controller.servo_motor_demo:main',
            'keyboard_control = orin_car_controller.keyboard_control:main',
            'detect_orincar = orin_car_controller.detect_orincar:main',
            'motor_node = orin_car_controller.motor_node:main',
        ],
    },
)
