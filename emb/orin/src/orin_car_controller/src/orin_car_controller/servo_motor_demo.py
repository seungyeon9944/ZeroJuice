import time

from orin_car_controller.hardware import create_i2c, create_servo_kit, scan_i2c


def main():
    i2c_bus = create_i2c()

    try:
        print("Scanning I2C bus...")
        devices = scan_i2c(i2c_bus)
        print("I2C devices found:", [hex(device) for device in devices])

        if not devices:
            raise ValueError("No I2C devices found on the bus.")

        kit = create_servo_kit(i2c_bus, address=0x60, channels=16)
        print("PCA9685 initialized at address 0x60.")

        pan = 100
        kit.servo[0].angle = pan
        input("If center angle is correct, press Enter to continue...")

        print("Servo motors initialized.")
        print("Starting servo control test...")

        for angle in range(80, 120):
            kit.servo[0].angle = angle
            print("Servo 0 angle:", angle)
            time.sleep(0.05)

        for angle in range(120, 80, -1):
            kit.servo[0].angle = angle
            print("Servo 0 angle:", angle)
            time.sleep(0.05)

        print("Servo control test completed.")

    except Exception as exc:
        print("An error occurred:", exc)


if __name__ == '__main__':
    main()
