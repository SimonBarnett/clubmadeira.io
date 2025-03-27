from flask import Blueprint, request, jsonify
from utils.auth import login_required
from utils.helpers import get_system_stats, ping_service, log_activity
import logging

# region Blueprint Setup
# Welcome to utility_bp, the unsung hero of the Flask galaxy, much like R2-D2 fixing the Millennium Falcon mid-flight!
# This blueprint handles utility endpoints for system stats, pings, and activity logging—essential tools for any admin with a towel handy.
utility_bp = Blueprint('utility_bp', __name__)
# endregion

# region /system/stats GET - Retrieve System Statistics
@utility_bp.route('/system/stats', methods=['GET'])
@login_required(["admin"], require_all=True)
def system_stats():
    """
    Retrieves system statistics, because even Marvin needs to know how the ship’s holding up!
    Purpose: To provide admins with system performance metrics—CPU, memory, and more.
    Permissions: Restricted to "admin"—you must be a Jedi Master to access this!
    Inputs: None—just a GET request from an authorized admin.
    Outputs:
        - Success: JSON {"status": "success", "stats": {<system_stats>}}, status 200—stats delivered!
        - Errors:
            - 403: {"status": "error", "message": "Unauthorized"}—you’re not on the list, Brian!
            - 500: {"status": "error", "message": "Server error"}—this system’s expired and gone to meet its maker!
    """
    try:
        # Check permissions—like the Two Ronnies guarding the fork handles!
        if "admin" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized system stats access attempt by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        # Fetch system stats—faster than a Pan-Galactic Gargle Blaster hitting your brain!
        stats = get_system_stats()
        logging.debug(f"System stats retrieved by admin {request.user_id}: {stats}")
        return jsonify({"status": "success", "stats": stats}), 200
    except Exception as e:
        # Zaphod’s take: “I tried to get stats, but both my heads are spinning!”
        logging.error(f"UX Issue - Failed to retrieve system stats: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# ASCII Art 1: R2-D2 (Star Wars)
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "Beep boop! System stats online, Master!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""

# region /ping GET - Ping Service Check
@utility_bp.route('/ping', methods=['GET'])
@login_required(["admin", "wixpro"], require_all=False)
def ping():
    """
    Pings the service to check if it’s alive, like shouting “Is there anybody out there?” into the void!
    Purpose: To verify service availability—admins and wixpro users can poke the system.
    Permissions: Restricted to "admin" or "wixpro"—you’re either a Jedi or a droid technician!
    Inputs: None—just a GET request to see if the service responds.
    Outputs:
        - Success: JSON {"status": "success", "message": "Pong!"}, status 200—service is alive!
        - Errors:
            - 403: {"status": "error", "message": "Unauthorized"}—you’re not the droid we’re looking for!
            - 500: {"status": "error", "message": "Service error"}—this service is pining for the fjords!
    """
    try:
        # Check permissions—like the Knights Who Say Ni demanding a shrubbery!
        if "admin" not in request.permissions and "wixpro" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized ping attempt by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        # Ping the service—like Trillian checking if the Heart of Gold’s still humming!
        ping_result = ping_service()
        if ping_result:
            logging.debug(f"Ping successful by {request.user_id}")
            return jsonify({"status": "success", "message": "Pong!"}), 200
        else:
            logging.error(f"UX Issue - Ping failed by {request.user_id}")
            return jsonify({"status": "error", "message": "Service error"}), 500
    except Exception as e:
        # Marvin’s take: “I pinged the service, and now I’m even more depressed.”
        logging.error(f"UX Issue - Failed to ping service: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Service error"}), 500
# endregion

# region /activity/log POST - Log User Activity
@utility_bp.route('/activity/log', methods=['POST'])
@login_required(["admin"], require_all=True)
def log_user_activity():
    """
    Logs user activity, because even the Spanish Inquisition needs to keep records!
    Purpose: To record specific user actions for admin oversight—like a galactic logbook.
    Permissions: Restricted to "admin"—only the High Council can write in this tome!
    Inputs: JSON payload:
        - user_id (str): The ID of the user whose activity is being logged.
        - action (str): The action performed (e.g., "login", "update_settings").
        - details (dict, optional): Additional details about the action.
    Outputs:
        - Success: JSON {"status": "success", "message": "Activity logged"}, status 201—logged successfully!
        - Errors:
            - 403: {"status": "error", "message": "Unauthorized"}—you’re not the Messiah, you’re a very naughty boy!
            - 400: {"status": "error", "message": "Invalid data"}—no data, no four candles!
            - 500: {"status": "error", "message": "Server error"}—this log’s an ex-log!
    """
    try:
        # Check permissions—like Obi-Wan sensing a disturbance in the Force!
        if "admin" not in request.permissions:
            logging.warning(f"Security Issue - Unauthorized activity log attempt by {request.user_id}")
            return jsonify({"status": "error", "message": "Unauthorized"}), 403

        # Arthur Dent checks the JSON—where’s that data?
        data = request.get_json()
        if not data or "user_id" not in data or "action" not in data:
            logging.warning(f"UX Issue - Invalid activity log data from {request.user_id}: {data}")
            return jsonify({"status": "error", "message": "Invalid data"}), 400

        # Log the activity—neater than a Two Ronnies sketch!
        user_id = data["user_id"]
        action = data["action"]
        details = data.get("details", {})
        log_activity(user_id, action, details)
        logging.info(f"Activity logged by admin {request.user_id} for user {user_id}: {action}")
        return jsonify({"status": "success", "message": "Activity logged"}), 201
    except Exception as e:
        # Zaphod’s take: “I tried logging activity, but my second head vetoed it!”
        logging.error(f"UX Issue - Failed to log activity: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error"}), 500
# endregion

# ASCII Art 2: Marvin (Hitchhiker’s Guide)
"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "Here I am, your very own utility bot, with a brain the size of a planet..."
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""