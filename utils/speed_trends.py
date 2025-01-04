import pandas as pd
from datetime import datetime, timedelta
from geopy.distance import geodesic
from config import Config

def get_speed_trends(lat, lon, datetime_str, speed_data):
    sensor_locations = pd.read_csv(Config.GRAPH_SENSOR_LOCATIONS_FILE_PATH)
    
    speed_data['Date Occurred'] = pd.to_datetime(speed_data['Date Occurred'], errors='coerce')

    collision_time = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")

    start_time = collision_time - timedelta(minutes=5)
    end_time = collision_time + timedelta(minutes=30)

    def find_nearby_sensors(latitude, longitude, sensors, radius_km=5):
        location_point = (latitude, longitude)
        nearby_sensors = []
        for _, sensor_row in sensors.iterrows():
            sensor_point = (sensor_row['latitude'], sensor_row['longitude'])
            distance = geodesic(location_point, sensor_point).km
            if distance <= radius_km:
                nearby_sensors.append(sensor_row)
        return nearby_sensors

    nearby_sensors = find_nearby_sensors(lat, lon, sensor_locations, radius_km=5)

    sensor_mapping = {
        str(int(sensor_row['sensor_id'])): f"({sensor_row['latitude']}, {sensor_row['longitude']})"
        for _, sensor_row in pd.DataFrame(nearby_sensors).iterrows()
    }

    relevant_columns = ['Date Occurred'] + list(sensor_mapping.keys())
    speed_data['Date Occurred'] = pd.to_datetime(speed_data['Date Occurred'], format="%a, %d %b %Y %H:%M:%S %Z", errors='coerce')
    filtered_speed_data = speed_data[
        (speed_data['Date Occurred'] >= start_time) & (speed_data['Date Occurred'] <= end_time)
    ][relevant_columns]

    filtered_speed_data = filtered_speed_data.rename(columns=sensor_mapping)
    filtered_speed_data['Date Occurred'] = filtered_speed_data['Date Occurred'].dt.strftime("%Y-%m-%d %H:%M")

    return filtered_speed_data.to_dict(orient='records')
