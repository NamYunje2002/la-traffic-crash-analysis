from flask import Blueprint, request, jsonify
import pandas as pd
from utils.date_utils import convert_month_to_number
from config import Config

collisions_bp = Blueprint('collisions', __name__)

@collisions_bp.route('/collisions', methods=['GET'])
def get_collisions():
    start_datetime = request.args.get('start_datetime')
    end_datetime = request.args.get('end_datetime')
    
    try:
        collision_data = pd.read_csv(Config.COLLISION_FILE_PATH)
        filtered_df = collision_data[['latitude', 'longitude', 'Date Occurred', 'Time Occurred']].copy()

        if (start_datetime and end_datetime):
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

@collisions_bp.route('/collisions/visualization', methods=['GET'])
def get_collision_data():
    collision_real_speed_data = pd.read_csv(Config.COLLISION_REAL_SPEED_FILE_PATH)
    collision_predicted_speed_data = pd.read_csv(Config.COLLISION_PREDICTED_SPEED_FILE_PATH)

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
        scatter_real_data = collision_real_speed_data[['pre_speed_mean', 'post_speed_mean']].dropna().round(2).rename(
            columns={
                'pre_speed_mean': 'preSpeed',
                'post_speed_mean': 'postSpeed'
            }
        ).assign(source="실제 데이터").to_dict(orient='records')

        scatter_predicted_data = collision_predicted_speed_data[['pre_speed_mean', 'post_speed_mean']].dropna().round(2).rename(
            columns={
                'pre_speed_mean': 'preSpeed',
                'post_speed_mean': 'postSpeed'
            }
        ).assign(source="예측 데이터").to_dict(orient='records')

        return jsonify({'scatter_real_data': scatter_real_data, 'scatter_predicted_data': scatter_predicted_data})

    elif data_type == 'histogram':
        if 'speed_change' not in collision_real_speed_data.columns or collision_real_speed_data['speed_change'].dropna().empty:
            return jsonify({"error": "No data for histogram"}), 400

        collision_real_speed_data['speed_change_bins'] = collision_real_speed_data['speed_change'].dropna().apply(
            lambda x: int(x // 10) * 10
        )

        histogram_real_data = collision_real_speed_data['speed_change_bins'].value_counts().reset_index()

        if len(histogram_real_data.columns) == 2:
            histogram_real_data = histogram_real_data.rename(columns={histogram_real_data.columns[0]: 'range', histogram_real_data.columns[1]: 'count'})
        else:
            print("Unexpected histogram structure:", histogram_real_data.columns)
            return jsonify({"error": "Unexpected histogram data structure"}), 500

        histogram_real_data['range'] = pd.to_numeric(histogram_real_data['range'], errors='coerce')
        histogram_real_data = histogram_real_data.sort_values('range')

        if 'speed_change' not in collision_predicted_speed_data.columns or collision_predicted_speed_data['speed_change'].dropna().empty:
            return jsonify({"error": "No data for histogram"}), 400

        collision_predicted_speed_data['speed_change_bins'] = collision_predicted_speed_data['speed_change'].dropna().apply(
            lambda x: int(x // 10) * 10
        )

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