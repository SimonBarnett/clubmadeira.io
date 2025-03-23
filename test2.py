from flask import Flask, request, jsonify
import os
import json
import datetime
import re

app = Flask(__name__)

# Define the base directory for site requests
SITE_REQUEST_DIR = os.path.join(os.path.dirname(__file__), "siterequest")

# Ensure the siterequest directory exists
if not os.path.exists(SITE_REQUEST_DIR):
    os.makedirs(SITE_REQUEST_DIR)

def load_site_request(user_id):
    """Load site request data from <user_id> file in /siterequest folder."""
    file_path = os.path.join(SITE_REQUEST_DIR, user_id)
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading site request for user {user_id}: {str(e)}")
            return {}
    return {}

def save_site_request(user_id, site_request_data):
    """Save site request data to <user_id> file in /siterequest folder."""
    file_path = os.path.join(SITE_REQUEST_DIR, user_id)
    try:
        with open(file_path, 'w') as f:
            json.dump(site_request_data, f, indent=4)
    except IOError as e:
        raise Exception(f"Failed to save site request for user {user_id}: {str(e)}")

@app.route('/<user_id>/siterequest', methods=['POST'])
def save_site_request_endpoint(user_id):
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # Validate user_id matches the one in the body (if provided)
        body_user_id = data.get("userId")
        if body_user_id and body_user_id != user_id:
            return jsonify({"status": "error", "message": "User ID in body does not match URL"}), 400

        if not user_id:
            return jsonify({"status": "error", "message": "User ID is required"}), 400

        # Extract site request fields and include user_id
        site_request = {
            "user_id": user_id,  # Include user_id in the saved data
            "communityName": data.get("communityName", ""),
            "aboutCommunity": data.get("aboutCommunity", ""),
            "communityLogos": data.get("communityLogos", []),
            "colorPrefs": data.get("colorPrefs", ""),
            "stylingDetails": data.get("stylingDetails", ""),
            "preferredDomain": data.get("preferredDomain", "mycommunity.org"),
            "emails": data.get("emails", []),
            "pages": data.get("pages", []),
            "widgets": data.get("widgets", []),
            "submitted_at": datetime.datetime.utcnow().isoformat()
        }

        # Validate required fields
        if not site_request["communityName"]:
            return jsonify({"status": "error", "message": "Community name is required"}), 400

        # Validate domain format
        domain_regex = r'^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$'
        if not re.match(domain_regex, site_request["preferredDomain"]):
            return jsonify({"status": "error", "message": "Invalid domain name"}), 400

        # Handle file data (assuming base64 strings or placeholders)
        for page in site_request["pages"]:
            if "images" in page and page["images"]:
                page["images"] = [img if isinstance(img, str) else "placeholder" for img in page["images"]]

        # Save to file in /siterequest folder
        save_site_request(user_id, site_request)

        return jsonify({"status": "success", "message": "Site request saved successfully"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@app.route('/<user_id>/siterequest', methods=['GET'])
def get_site_request(user_id):
    try:
        # Load site request data from file
        site_request = load_site_request(user_id)

        # If no data exists, return an empty site_request
        if not site_request:
            return jsonify({
                "status": "success",
                "site_request": {}
            }), 200

        # Return the site request data
        response = {
            "status": "success",
            "site_request": site_request
        }
        return jsonify(response), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

# For local testing
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)