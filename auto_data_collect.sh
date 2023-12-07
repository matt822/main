#!/bin/bash

# Run the write_csv_influx.py script
/usr/bin/python3 ~/SurfSkull/main/write_csv_influx.py
echo "writing csv done"

# Once the above script completes, run the accel.py script
/usr/bin/python3 ~/SurfSkull/main/accel.py
