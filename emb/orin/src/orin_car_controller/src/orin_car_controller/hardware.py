import board
import busio
from adafruit_pca9685 import PCA9685
from adafruit_servokit import ServoKit


class PWMThrottleHat:
    def __init__(self, pwm, channel, frequency=60):
        self.pwm = pwm
        self.channel = channel
        self.pwm.frequency = frequency

    def set_throttle(self, throttle):
        pulse = int(0xFFFF * abs(throttle))

        if throttle < 0:
            self.pwm.channels[self.channel + 5].duty_cycle = pulse
            self.pwm.channels[self.channel + 4].duty_cycle = 0
            self.pwm.channels[self.channel + 3].duty_cycle = 0xFFFF
        elif throttle > 0:
            self.pwm.channels[self.channel + 5].duty_cycle = pulse
            self.pwm.channels[self.channel + 4].duty_cycle = 0xFFFF
            self.pwm.channels[self.channel + 3].duty_cycle = 0
        else:
            self.pwm.channels[self.channel + 5].duty_cycle = 0
            self.pwm.channels[self.channel + 4].duty_cycle = 0
            self.pwm.channels[self.channel + 3].duty_cycle = 0


def create_i2c():
    return busio.I2C(board.SCL, board.SDA)


def create_pca9685(i2c, frequency=60):
    pca = PCA9685(i2c)
    pca.frequency = frequency
    return pca


def create_servo_kit(i2c, address=0x60, channels=16):
    return ServoKit(channels=channels, i2c=i2c, address=address)


def scan_i2c(i2c):
    while not i2c.try_lock():
        pass
    try:
        return i2c.scan()
    finally:
        i2c.unlock()
