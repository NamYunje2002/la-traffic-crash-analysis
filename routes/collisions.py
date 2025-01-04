from flask import Blueprint, request, jsonify
import pandas as pd
from utils.date_utils import convert_month_to_number
from config import Config

# 충돌 데이터 관련 라우트를 처리하는 Blueprint
collisions_bp = Blueprint('collisions', __name__)

@collisions_bp.route('/collisions', methods=['GET'])
def get_collisions():
    start_datetime = request.args.get('start_datetime')
    end_datetime = request.args.get('end_datetime')
    
    try:
        # 충돌 데이터를 불러오고 필요한 컬럼만 선택
        collision_data = pd.read_csv(Config.COLLISION_FILE_PATH)
        filtered_df = collision_data[['latitude', 'longitude', 'Date Occurred', 'Time Occurred']].copy()

        if (start_datetime and end_datetime):
            # 날짜와 시간 컬럼을 하나의 datetime 컬럼으로 결합
            filtered_df['Datetime'] = pd.to_datetime(filtered_df['Date Occurred'] + ' ' + filtered_df['Time Occurred'])

            # 입력받은 datetime 문자열을 적절한 형식으로 변환
            start_date = f'{start_datetime[11:15]}-{convert_month_to_number(start_datetime[4:7])}-{start_datetime[8:10]}'
            start_time = f'{start_datetime[16:21]}'
            start_datetime = start_date + ' ' + start_time

            end_date = f'{end_datetime[11:15]}-{convert_month_to_number(end_datetime[4:7])}-{end_datetime[8:10]}'
            end_time = f'{end_datetime[16:21]}'
            end_datetime = end_date + ' ' + end_time

            # 지정된 시간 범위 내의 데이터만 필터링
            filtered_df = filtered_df[(filtered_df['Datetime'] >= start_datetime) & (filtered_df['Datetime'] <= end_datetime)]

        result = filtered_df.to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

@collisions_bp.route('/collisions/visualization', methods=['GET'])
def get_collision_data():
    # 실제 측정값과 예측값 데이터 로드
    collision_real_speed_data = pd.read_csv(Config.COLLISION_REAL_SPEED_FILE_PATH)
    collision_predicted_speed_data = pd.read_csv(Config.COLLISION_PREDICTED_SPEED_FILE_PATH)

    # 유효하지 않은 속도 기록(0 이하) 제외
    collision_real_speed_data = collision_real_speed_data[
        (collision_real_speed_data['pre_speed_mean'] > 0) & 
        (collision_real_speed_data['post_speed_mean'] > 0)
    ]

    collision_predicted_speed_data = collision_predicted_speed_data[
        (collision_predicted_speed_data['pre_speed_mean'] >= 0) & 
        (collision_predicted_speed_data['post_speed_mean'] >= 0)
    ]
    
    data_type = request.args.get('type', 'scatter')

    if data_type == 'scatter':
        # 실제 측정값에 대한 산점도 데이터 준비
        scatter_real_data = collision_real_speed_data[['pre_speed_mean', 'post_speed_mean']].dropna().round(2).rename(
            columns={
                'pre_speed_mean': 'preSpeed',
                'post_speed_mean': 'postSpeed'
            }
        ).assign(source="실제 데이터").to_dict(orient='records')

        # 예측값에 대한 산점도 데이터 준비
        scatter_predicted_data = collision_predicted_speed_data[['pre_speed_mean', 'post_speed_mean']].dropna().round(2).rename(
            columns={
                'pre_speed_mean': 'preSpeed',
                'post_speed_mean': 'postSpeed'
            }
        ).assign(source="예측 데이터").to_dict(orient='records')

        return jsonify({'scatter_real_data': scatter_real_data, 'scatter_predicted_data': scatter_predicted_data})

    elif data_type == 'histogram':
        # 실제 속도 변화 데이터가 존재하는지 확인
        if 'speed_change' not in collision_real_speed_data.columns or collision_real_speed_data['speed_change'].dropna().empty:
            return jsonify({"error": "No data for histogram"}), 400

        # 실제 속도 변화를 10단위 구간으로 나누어 빈도 계산
        collision_real_speed_data['speed_change_bins'] = collision_real_speed_data['speed_change'].dropna().apply(
            lambda x: int(x // 10) * 10
        )

        # 실제 측정값의 히스토그램 데이터 계산
        histogram_real_data = collision_real_speed_data['speed_change_bins'].value_counts().reset_index()

        if len(histogram_real_data.columns) == 2:
            histogram_real_data = histogram_real_data.rename(columns={histogram_real_data.columns[0]: 'range', histogram_real_data.columns[1]: 'count'})
        else:
            print("Unexpected histogram structure:", histogram_real_data.columns)
            return jsonify({"error": "Unexpected histogram data structure"}), 500

        histogram_real_data['range'] = pd.to_numeric(histogram_real_data['range'], errors='coerce')
        histogram_real_data = histogram_real_data.sort_values('range')

        # 예측 속도 변화 데이터가 존재하는지 확인
        if 'speed_change' not in collision_predicted_speed_data.columns or collision_predicted_speed_data['speed_change'].dropna().empty:
            return jsonify({"error": "No data for histogram"}), 400

        # 예측 속도 변화를 10단위 구간으로 나누어 빈도 계산
        collision_predicted_speed_data['speed_change_bins'] = collision_predicted_speed_data['speed_change'].dropna().apply(
            lambda x: int(x // 10) * 10
        )

        # 예측값의 히스토그램 데이터 계산
        histogram_predicted_data = collision_predicted_speed_data['speed_change_bins'].value_counts().reset_index()

        if len(histogram_predicted_data.columns) == 2:
            histogram_predicted_data = histogram_predicted_data.rename(columns={histogram_predicted_data.columns[0]: 'range', histogram_predicted_data.columns[1]: 'count'})
        else:
            print("Unexpected histogram structure:", histogram_predicted_data.columns)
            return jsonify({"error": "Unexpected histogram data structure"}), 500

        histogram_predicted_data['range'] = pd.to_numeric(histogram_predicted_data['range'], errors='coerce')
        histogram_predicted_data = histogram_predicted_data.sort_values('range')

        return jsonify({'histogram_real_data': histogram_real_data.to_dict(orient='records'), 'histogram_predicted_data': histogram_predicted_data.to_dict(orient='records')})
    
    else:
        return jsonify({"error": "Invalid type parameter"}), 400