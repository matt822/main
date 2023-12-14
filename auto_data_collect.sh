#!/bin/bash

# Run the write_csv_influx.py script
/usr/bin/python3 /home/rpi/SurfSkull/main/write_csv_influx.py
echo "Starting Accellerometer Logging"

# Once the above script completes, run the accel.py script
/usr/bin/python3 /home/rpi/SurfSkull/main/accel.py
