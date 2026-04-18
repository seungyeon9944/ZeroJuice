from setuptools import setup, find_packages
import os
from glob import glob

package_name = 'rc_car_test_description'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(),   # ★ 핵심 변경!
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'), glob('launch/*.launch.py')),
        (os.path.join('share', package_name, 'urdf'), glob('urdf/*')),
        (os.path.join('share', package_name, 'meshes'), glob('meshes/*')),
        (os.path.join('share', package_name, 'config'), glob('config/*')),
        (os.path.join('share', package_name, 'models/rc_car_test'), glob('models/rc_car_test/*')),
        (os.path.join('share', package_name, 'worlds'), glob('worlds/*')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='author',
    maintainer_email='todo@todo.com',
    description='The ' + package_name + ' package',
    license='TODO: License declaration',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'twist_to_joint_cmd = rc_car_test_description.twist_to_joint_cmd:main',
            'scan_frame_rewriter = rc_car_test_description.scan_frame_rewriter:main',
        ],
    },
)
