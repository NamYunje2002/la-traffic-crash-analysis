from flask import Flask, request, jsonify
import pandas as pd
from flask_cors import CORS
from geopy.distance import geodesic

app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

collision_file_path = "./dataset/collision.csv"

def convert_month_to_number(month_abbr):
    month_to_number = {
        "JAN": "01",
        "FEB": "02",
        "MAR": "03",
        "APR": "04",
        "MAY": "05",
        "JUN": "06",
        "JUL": "07",
        "AUG": "08",
        "SEP": "09",
        "OCT": "10",
        "NOV": "11",
        "DEC": "12"
    }
    return month_to_number.get(month_abbr.upper(), None)
    
@app.route('/api/collisions', methods=['GET'])
def get_collisions():
    start_datetime = request.args.get('start_datetime')
    end_datetime = request.args.get('end_datetime')
    
    try:
        collision_df = pd.read_csv(collision_file_path)
        filtered_df = collision_df[['latitude', 'longitude', 'Date Occurred', 'Time Occurred']].copy()

        if (start_datetime or end_datetime):
            filtered_df['Datetime'] = pd.to_datetime(filtered_df['Date Occurred'] + ' ' + filtered_df['Time Occurred'])

            start_date = f'{start_datetime[11:15]}-{convert_month_to_number(start_datetime[4:7])}-{start_datetime[8:10]}'
            start_time = f'{start_datetime[16:21]}'
            start_datetime = start_date + ' ' + start_time

            end_date = f'{end_datetime[11:15]}-{convert_month_to_number(end_datetime[4:7])}-{end_datetime[8:10]}'
            end_time = f'{end_datetime[16:21]}'
            end_datetime = end_date + ' ' + end_time

            filtered_df = filtered_df[(filtered_df['Datetime'] >= start_datetime) & (filtered_df['Datetime'] <= end_datetime)]

        result = filtered_df.to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/collision-data', methods=['GET'])
def get_collision_data():
    collision_data = pd.read_csv("./dataset/collision_speed_data.csv")
    
    data_type = request.args.get('type', 'scatter')

    if data_type == 'scatter':
        scatter_data = collision_data[['pre_speed_mean', 'post_speed_mean']].dropna().rename(
            columns={
                'pre_speed_mean': 'preSpeed',
                'post_speed_mean': 'postSpeed'
            }
        ).to_dict(orient='records')
        return jsonify(scatter_data)

    elif data_type == 'histogram':
        if 'speed_change' not in collision_data.columns or collision_data['speed_change'].dropna().empty:
            return jsonify({"error": "No data for histogram"}), 400

        collision_data['speed_change_bins'] = collision_data['speed_change'].dropna().apply(
            lambda x: int(x // 10) * 10
        )
        histogram_data = collision_data['speed_change_bins'].value_counts().reset_index()

        if len(histogram_data.columns) == 2:
            histogram_data = histogram_data.rename(columns={histogram_data.columns[0]: 'range', histogram_data.columns[1]: 'count'})
        else:
            print("Unexpected histogram structure:", histogram_data.columns)
            return jsonify({"error": "Unexpected histogram data structure"}), 500

        histogram_data['range'] = pd.to_numeric(histogram_data['range'], errors='coerce')

        histogram_data = histogram_data.sort_values('range')
        print("Final Histogram Data:")
        print(histogram_data)

        return jsonify(histogram_data.to_dict(orient='records'))
    
    else:
        return jsonify({"error": "Invalid type parameter"}), 400
    
collision_data = pd.read_csv('./dataset/collision.csv')
graph_sensor_locations = pd.read_csv('./dataset/graph_sensor_locations.csv')
speed_data = pd.read_csv('./dataset/speed.csv')

@app.route('/api/analyze-traffic', methods=['POST'])
def analyze_traffic():
    data = request.json
    collision_date = data.get('Date Occurred')
    collision_time = data.get('Time Occurred')
    collision_latitude = float(data.get('latitude'))
    collision_longitude = float(data.get('longitude'))

    if not (collision_date and collision_time and collision_latitude and collision_longitude):
        return jsonify({"error": "Invalid input parameters"}), 400

    collision_datetime = pd.to_datetime(f"{collision_date} {collision_time}")
    collision_point = (collision_latitude, collision_longitude)

    radius_km = 1.0
    affected_sensors = []
    for idx, sensor in graph_sensor_locations.iterrows():
        sensor_point = (sensor['latitude'], sensor['longitude'])
        distance = geodesic(collision_point, sensor_point).kilometers
        if distance <= radius_km:
            affected_sensors.append(sensor['sensor_id'])

    if not affected_sensors:
        return jsonify({"error": "No sensors found within 1km radius"}), 404

    affected_sensors_str = [str(int(sensor)) for sensor in affected_sensors]

    valid_sensors = [sensor for sensor in affected_sensors_str if sensor in speed_data.columns]
    if not valid_sensors:
        return jsonify({"error": "No valid sensors found in speed data"}), 404

    time_window = pd.Timedelta(minutes=30)
    speed_data['Date Occurred'] = pd.to_datetime(speed_data['Date Occurred'])

    before_collision = speed_data[
        (speed_data['Date Occurred'] >= collision_datetime - time_window) &
        (speed_data['Date Occurred'] < collision_datetime)
    ][valid_sensors]

    after_collision = speed_data[
        (speed_data['Date Occurred'] >= collision_datetime) &
        (speed_data['Date Occurred'] <= collision_datetime + time_window)
    ][valid_sensors]

    if before_collision.empty or after_collision.empty:
        return jsonify({"error": "No traffic data available for the given time range"}), 404

    def clean_data(data):
        import math
        return {key: (0 if math.isnan(value) else value) for key, value in data.items()}

    before_avg_speed = before_collision.mean().fillna(0).to_dict()
    after_avg_speed = after_collision.mean().fillna(0).to_dict()

    before_avg_speed = clean_data(before_avg_speed)
    after_avg_speed = clean_data(after_avg_speed)

    before_data = [
        {
            "sensor_id": sensor_id,
            "latitude": graph_sensor_locations.loc[graph_sensor_locations['sensor_id'] == int(sensor_id), 'latitude'].values[0],
            "longitude": graph_sensor_locations.loc[graph_sensor_locations['sensor_id'] == int(sensor_id), 'longitude'].values[0],
            "speed": speed
        }
        for sensor_id, speed in before_avg_speed.items()
    ]

    after_data = [
        {
            "sensor_id": sensor_id,
            "latitude": graph_sensor_locations.loc[graph_sensor_locations['sensor_id'] == int(sensor_id), 'latitude'].values[0],
            "longitude": graph_sensor_locations.loc[graph_sensor_locations['sensor_id'] == int(sensor_id), 'longitude'].values[0],
            "speed": speed
        }
        for sensor_id, speed in after_avg_speed.items()
    ]

    return jsonify({"before": before_data, "after": after_data})

if __name__ == "__main__":
    app.run(debug = True)