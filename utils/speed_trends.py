import pandas as pd
from datetime import datetime, timedelta
from geopy.distance import geodesic
from config import Config

def get_speed_trends(lat, lon, datetime_str, speed_data):
    # 센서 위치 정보 로드
    sensor_locations = pd.read_csv(Config.GRAPH_SENSOR_LOCATIONS_FILE_PATH)
    
    # 속도 데이터의 날짜 형식 변환
    speed_data['Date Occurred'] = pd.to_datetime(speed_data['Date Occurred'], errors='coerce')

    # 충돌 발생 시간을 datetime 객체로 변환
    collision_time = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")

    # 분석 시간 범위 설정 (충돌 발생 5분 전 ~ 30분 후)
    start_time = collision_time - timedelta(minutes=5)
    end_time = collision_time + timedelta(minutes=30)

    def find_nearby_sensors(latitude, longitude, sensors, radius_km=5):
        location_point = (latitude, longitude)
        nearby_sensors = []
        for _, sensor_row in sensors.iterrows():
            sensor_point = (sensor_row['latitude'], sensor_row['longitude'])
            # geodesic으로 두 지점 간의 거리 계산
            distance = geodesic(location_point, sensor_point).km
            if distance <= radius_km:
                nearby_sensors.append(sensor_row)
        return nearby_sensors

    # 주변 센서 찾기
    nearby_sensors = find_nearby_sensors(lat, lon, sensor_locations, radius_km=5)

    # 센서 ID를 위치 좌표로 매핑하는 딕셔너리 생성
    sensor_mapping = {
        str(int(sensor_row['sensor_id'])): f"({sensor_row['latitude']}, {sensor_row['longitude']})"
        for _, sensor_row in pd.DataFrame(nearby_sensors).iterrows()
    }

    # 필요한 컬럼만 선택 (발생 시간과 주변 센서들의 데이터)
    relevant_columns = ['Date Occurred'] + list(sensor_mapping.keys())
    
    # 날짜 형식 통일
    speed_data['Date Occurred'] = pd.to_datetime(speed_data['Date Occurred'], format="%a, %d %b %Y %H:%M:%S %Z", errors='coerce')
    
    # 시간 범위에 맞는 데이터만 필터링
    filtered_speed_data = speed_data[
        (speed_data['Date Occurred'] >= start_time) & (speed_data['Date Occurred'] <= end_time)
    ][relevant_columns]

    # 센서 ID를 위치 좌표로 변환하고 날짜 형식 지정
    filtered_speed_data = filtered_speed_data.rename(columns=sensor_mapping)
    filtered_speed_data['Date Occurred'] = filtered_speed_data['Date Occurred'].dt.strftime("%Y-%m-%d %H:%M")

    return filtered_speed_data.to_dict(orient='records')