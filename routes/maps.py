from flask import Blueprint, jsonify
from flask import current_app

maps_bp = Blueprint('maps', __name__)

@maps_bp.route('/google-maps-key', methods=['GET'])
def get_google_maps_key():
    return jsonify({'apiKey': current_app.config['GOOGLE_MAPS_API_KEY']})