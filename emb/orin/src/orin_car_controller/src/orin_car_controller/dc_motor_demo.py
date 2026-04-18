import time

from orin_car_controller.hardware import PWMThrottleHat, create_i2c, create_pca9685


def main():
    i2c = create_i2c()
    pca = create_pca9685(i2c, frequency=60)
    motor_hat = PWMThrottleHat(pca, channel=0)

    try:
        while True:
            print("Motor forward")
            motor_hat.set_throttle(0.5)
            time.sleep(5)

            print("Motor backward")
            motor_hat.set_throttle(-0.5)
            time.sleep(5)

            print("Motor stop")
            motor_hat.set_throttle(0)
            time.sleep(2)
    except KeyboardInterrupt:
        pass
    finally:
        motor_hat.set_throttle(0)
        pca.deinit()
        print("Program stopped and motor stopped.")


if __name__ == '__main__':
    main()
