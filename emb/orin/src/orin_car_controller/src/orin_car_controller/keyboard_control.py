import time
from pynput import keyboard

from orin_car_controller.hardware import PWMThrottleHat, create_i2c, create_pca9685, create_servo_kit


def main():
    i2c = create_i2c()
    pca = create_pca9685(i2c, frequency=60)
    motor_hat = PWMThrottleHat(pca, channel=0)

    kit = create_servo_kit(i2c, address=0x60, channels=16)
    pan = 100
    kit.servo[0].angle = pan

    def on_press(key):
        nonlocal pan
        try:
            if key.char == 'w':
                print("Motor forward")
                motor_hat.set_throttle(0.5)
            elif key.char == 's':
                print("Motor backward")
                motor_hat.set_throttle(-0.5)
            elif key.char == 'a':
                print("Servo left")
                pan = max(0, pan - 10)
                kit.servo[0].angle = pan
                print("Servo angle set to:", pan)
            elif key.char == 'd':
                print("Servo right")
                pan = min(180, pan + 10)
                kit.servo[0].angle = pan
                print("Servo angle set to:", pan)
        except AttributeError:
            if key == keyboard.Key.esc:
                return False

    def on_release(key):
        try:
            if key.char in ['w', 's']:
                print("Motor stop")
                motor_hat.set_throttle(0)
        except AttributeError:
            pass

    listener = keyboard.Listener(on_press=on_press, on_release=on_release)
    listener.start()

    try:
        while listener.is_alive():
            time.sleep(0.1)
    except KeyboardInterrupt:
        pass
    finally:
        motor_hat.set_throttle(0)
        kit.servo[0].angle = 100
        pca.deinit()
        print("Program stopped and motor stopped.")


if __name__ == '__main__':
    main()
