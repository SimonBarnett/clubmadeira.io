from functools import wraps
from flask import request, jsonify
import jwt
from datetime import datetime

SECRET_KEY = "itsananagramjanet"  # Store securely in production (e.g., environment variable)

def require_permissions(required_permissions, require_all=True):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return jsonify({"status": "error", "message": "Authorization token required"}), 401
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                if datetime.utcnow().timestamp() > payload["exp"]:
                    return jsonify({"status": "error", "message": "Token has expired"}), 401
                user_permissions = payload.get("permissions", [])
                request.user_id = payload.get("userId")  # Attach user_id to request
                if require_all:
                    if not all(perm in user_permissions for perm in required_permissions):
                        return jsonify({"status": "error", "message": "Insufficient permissions"}), 403
                else:
                    if not any(perm in user_permissions for perm in required_permissions):
                        return jsonify({"status": "error", "message": "Insufficient permissions"}), 403
                # Special handling for 'self' permission
                if 'self' in required_permissions and 'user_id' in kwargs:
                    if request.user_id != kwargs['user_id']:
                        return jsonify({"status": "error", "message": "Unauthorized: Must be self"}), 403
            except jwt.InvalidTokenError:
                return jsonify({"status": "error", "message": "Invalid token"}), 401
            return f(*args, **kwargs)
        return decorated_function
    return decorator