from flask import Blueprint, request, jsonify
import pandas as pd
from utils.speed_trends import get_speed_trends
from config import Config

traffic_bp = Blueprint('traffic', __name__)

@traffic_bp.route('/traffic-speeds', methods=['GET'])
def traffic_speeds():
    latitude = float(request.args.get('latitude'))
    longitude = float(request.args.get('longitude'))
    datetime_str = request.args.get('datetime')

    real_speed_data = pd.read_csv(Config.REAL_SPEED_FILE_PATH)
    predicted_speed_data = pd.read_csv(Config.PREDICTED_SPEED_FILE_PATH)

    try:
        real_speed_trends = get_speed_trends(latitude, longitude, datetime_str, real_speed_data)
        predicted_speed_trends = get_speed_trends(latitude, longitude, datetime_str, predicted_speed_data)
        return jsonify({'real_speed_trends': real_speed_trends, 'predicted_speed_trends': predicted_speed_trends})
    except Exception as e:
        return jsonify({"error": str(e)}), 500