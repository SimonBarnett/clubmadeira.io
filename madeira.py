from flask import Flask, render_template
from flask_cors import CORS
from blueprints.authentication import authentication_bp
from blueprints.site_request import site_request_bp
from blueprints.user_management import user_management_bp
from blueprints.user_settings import user_settings_bp
from blueprints.utility import utility_bp
from blueprints.role_pages import role_pages_bp
from blueprints.data_retrieval import data_retrieval_bp
from blueprints.configuration import configuration_bp
from utils.auth import login_required 
import json
import os

app = Flask(__name__)
CORS(app)

CONFIG_FILE = "config.json"
def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {"jwt": {"SECRET_KEY": "your-secret-key"}}

config = load_config()
app.config['JWT_SECRET_KEY'] = config['jwt']['SECRET_KEY']

# Register blueprints
app.register_blueprint(authentication_bp, url_prefix='')  # Ensure no prefix conflicts
app.register_blueprint(site_request_bp, url_prefix='')
app.register_blueprint(user_management_bp, url_prefix='')
app.register_blueprint(user_settings_bp, url_prefix='')
app.register_blueprint(utility_bp, url_prefix='')
app.register_blueprint(role_pages_bp, url_prefix='')
app.register_blueprint(data_retrieval_bp, url_prefix='')
app.register_blueprint(configuration_bp, url_prefix='')

@app.route('/')
def home():
    return render_template('login.html')

@app.route('/admin')
@login_required(["admin"], require_all=True)
def admin():
    return render_template('admin.html')

@app.route('/merchant')
@login_required(["merchant"], require_all=True)
def merchant():
    return render_template('merchant.html')

@app.route('/community')
@login_required(["community"], require_all=True)
def community():
    return render_template('community.html')

@app.route('/wixpro')
@login_required(["wixpro"], require_all=True)
def wixpro():
    return render_template('wixpro.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)