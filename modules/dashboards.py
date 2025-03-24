from flask import Blueprint, render_template
from utils.decorators import require_permissions

dashboards_bp = Blueprint('dashboards', __name__)

@dashboards_bp.route('/admin', methods=['GET'])
@require_permissions(['admin'])
def admin_dashboard():
    return render_template('admin.html')

@dashboards_bp.route('/community', methods=['GET'])
@require_permissions(['community', 'admin'], require_all=False)
def community_dashboard():
    return render_template('community.html')