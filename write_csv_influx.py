import csv
from influxdb import InfluxDBClient
from datetime import datetime
import time

def connect_to_influxdb(client, attempts=5, delay=10):
    """Attempt to connect to InfluxDB with retries."""
    for i in range(attempts):
        try:
            client.ping()  # Ping the InfluxDB server
            return True  # Connection successful
        except:
            if i < attempts - 1:  # If not the last attempt, wait and retry
                time.sleep(delay)
            else:
                raise  # Re-raise the last exception

def csv_to_influxdb(csv_file_path, influxdb_client, database_name):
    if connect_to_influxdb(influxdb_client):  # Ensure connection is established
        influxdb_client.create_database(database_name)
        influxdb_client.switch_database(database_name)

        with open(csv_file_path, 'r') as file:
            reader = csv.reader(file)
            influx_data = []
            for row in reader:
                timestamp, magAccl = row
                data_point = {
                    "measurement": "accelerometer",
                    "time": datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%f'),
                    "fields": {
                        "mag_value": float(magAccl)
                    }
                }
                influx_data.append(data_point)

                # Write data in batches
                if len(influx_data) >= 1000:
                    influxdb_client.write_points(influx_data)
                    influx_data = []

            # Write any remaining data
            if influx_data:
                influxdb_client.write_points(influx_data)

if __name__ == "__main__":
    client = InfluxDBClient('localhost', 8086, 'username', 'password')
    database_name = 'acceldb'
    csv_file_path = 'accel_data.csv'  # Update with actual file path
    csv_to_influxdb(csv_file_path, client, database_name)
