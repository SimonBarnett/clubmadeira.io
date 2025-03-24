from flask import Blueprint, render_template 
from utils.auth import login_required 
 
role_pages_bp = Blueprint('role_pages', __name__) 
 
@role_pages_bp.route('/admin', methods=['GET']) 
@login_required(["admin"], require_all=True) 
def admin(): 
    return render_template('admin.html') 
 
@role_pages_bp.route('/community', methods=['GET']) 
@login_required(["community", "admin"], require_all=False) 
def community(): 
    return render_template('community.html') 
 
@role_pages_bp.route('/merchant', methods=['GET']) 
@login_required(["merchant", "admin"], require_all=False) 
def merchant(): 
    return render_template('merchant.html') 
 
@role_pages_bp.route('/partner', methods=['GET']) 
@login_required(["wixpro", "admin"], require_all=False) 
def wixpro(): 
    return render_template('partner.html') 
