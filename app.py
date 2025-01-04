from flask import Flask
from flask_cors import CORS
from config import Config
from routes.maps import maps_bp
from routes.traffic import traffic_bp
from routes.collisions import collisions_bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

app.register_blueprint(maps_bp, url_prefix='/api')
app.register_blueprint(traffic_bp, url_prefix='/api')
app.register_blueprint(collisions_bp, url_prefix='/api')

if __name__ == "__main__":
    app.run(debug=True)