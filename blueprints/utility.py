utility_bp = Blueprint('utility', __name__
 
@utility_bp.route('/', methods=['GET']) 
def home(): 
    return render_template('login.html') 
 
@utility_bp.route('/branding', methods=['GET']) 
def branding(): 
    root_dir = os.path.dirname(os.path.abspath(__file__)) 
    json_path = os.path.join(root_dir, 'branding.json') 
    try: 
        with open(json_path, 'r') as f: 
            branding_data = json.load(f) 
        return jsonify(branding_data) 
    except FileNotFoundError: 
