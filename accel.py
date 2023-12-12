import spidev
import time
from datetime import datetime
import json
import csv
import paho.mqtt.client as mqtt
import math


# Create an SPI instance and open bus 0, device 0 (spidev0.0)
spi = spidev.SpiDev()
spi.open(0, 0)

# Set SPI speed and mode
spi.max_speed_hz = 10000000  # Set the SPI clock speed to 10 MHz
spi.mode = 3  # Set SPI mode: Mode 0 is often the default for many devices

# MQTT settings
mqtt_client = mqtt.Client("DataPublisher")
mqtt_broker = "localhost"
mqtt_port = 1883
mqtt_topic_x = "sensor/accelerometer/x"
mqtt_topic_y = "sensor/accelerometer/y"
mqtt_topic_z = "sensor/accelerometer/z"
mqtt_topic_mag = "sensor/accelerometer/magnitude"
print("Test message")
# MQTT connection callback
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker!")
    else:
        print("Failed to connect, return code %d\n", rc)

# # Set connection callback
# mqtt_client.on_connect = on_connect

# # Connect to MQTT Broker
# mqtt_client.connect(mqtt_broker, mqtt_port)
# mqtt_client.loop_start()

# Constants for the H3LIS331DL accelerometer
WHO_AM_I = 0x0F  # WHO_AM_I register address
CTRL_REG1 = 0x20
CTRL_REG4 = 0x23
POWER_ON_MODE = 0x3F  # Power ON mode, Data output rate = 50 Hz, X, Y, Z-Axis enabled
FULL_SCALE_100G = 0x00  # Continuous update, Full scale selection = +/-100g
SENSITIVITY_100G = 0.001224  # Sensitivity for 100g full scale in g/LSB
OUT_X_L = 0x28  # X-Axis Data Low
OUT_X_H = 0x29  # X-Axis Data High
OUT_Y_L = 0x2A  # Y-Axis Data Low
OUT_Y_H = 0x2B  # Y-Axis Data High
OUT_Z_L = 0x2C  # Z-Axis Data Low
OUT_Z_H = 0x2D  # Z-Axis Data High

def generate_csv_filename():
    now = datetime.now()
    return now.strftime("accel_data_%Y_%m_%d_%H_%M_%S.csv")

def write_register(address, value):
    # Sending the address with write bit
    spi.xfer2([address, value])

def read_register(address):
    # Prepare address byte: Set the read bit (MSB) and keep the address
    addr = 0x80 | address  # 0x80 sets the MSB to 1, indicating a read operation

    # Perform the SPI transaction. Send the address byte and a dummy byte (0x00)
    response = spi.xfer2([addr, 0x00])  # xfer2 keeps CS active between bytes
    return response[1]

def init_accelerometer():
    write_register(CTRL_REG1, POWER_ON_MODE)
    write_register(CTRL_REG4, FULL_SCALE_100G)

def read_acceleration():
    # Read X-Axis first for sequential reads

    addr = 0xC0 | OUT_X_L  # 0x80 sets the MSB to 1, indicating a read operation

    # Perform the SPI transaction. Send the address byte and a dummy byte (0x00)
    response = spi.xfer2([addr, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])  # xfer2 keeps CS active between bytes

    x_low = response[1]
    x_high = response[2]
    x_accel = (x_high << 8) | x_low
    if x_accel >= 32768:  # Two's complement conversion
        x_accel -= 65536
    x_accel *= SENSITIVITY_100G
    x_accel = round(x_accel,2)

    # Read Y-Axis data
    y_low = response[3]
    y_high = response[4]
    y_accel = (y_high << 8) | y_low
    if y_accel >= 32768:  # Two's complement conversion
        y_accel -= 65536
    y_accel *= SENSITIVITY_100G
    y_accel = round(y_accel,2)

    # Read Z-Axis data
    z_low = response[5]
    z_high = response[6]
    z_accel = (z_high << 8) | z_low
    if z_accel >= 32768:  # Two's complement conversion
        z_accel -= 65536
    z_accel *= SENSITIVITY_100G
    z_accel = round(z_accel,2)

    return x_accel, y_accel, z_accel

def calculate_vector_magnitude(x, y, z):
    return math.sqrt(x**2 + y**2 + z**2)

def log_data_to_csv(filename, data):
    with open(filename, 'a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(data)

def publish_data():

    init_accelerometer()
    csv_filename = "accel_data.csv"

    total_duration = 0
    run_count = 0

    while True:
        try:
            start_time = time.time()
            xAccl, yAccl, zAccl = read_acceleration()
            magAccl = round(calculate_vector_magnitude(xAccl, yAccl, zAccl),2)
            stop_time = time.time()
            if magAccl > 1:
                timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] 

                # # Data for InfluxDB and MQTT
                # data_mag = {"magnitude": magAccl, "time": timestamp}
                # print(f"Publishing Data: Magnitude={magAccl}gs")

                # # Publish to MQTT for each axis and magnitude
                # mqtt_client.publish(mqtt_topic_mag, json.dumps(data_mag))

                # Log data to CSV
                log_data_to_csv(csv_filename, [timestamp, magAccl])

                
                print(f"time delta of reads is: {start_time-stop_time}")

                duration = time.time() - start_time
                total_duration += duration
                run_count += 1

        except KeyboardInterrupt:
            average_duration = total_duration / run_count
            print(f"Average time per run: {average_duration:.3f} seconds - \t Frequency is: {1/average_duration}")
            sys.exit(0)
        except Exception as e:
            print(f"An error occurred: {e}")

# Start data publishing
publish_data()

# Clean up (These lines will only execute if the loop is broken, e.g., by an exception)
mqtt_client.loop_stop()
mqtt_client.disconnect()















