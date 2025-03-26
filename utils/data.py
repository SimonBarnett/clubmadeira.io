import os
import json
import logging

SITE_REQUEST_DIR = "siterequest"

def load_site_request(user_id):
    file_path = os.path.join(SITE_REQUEST_DIR, user_id)
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                data = json.load(f)
                logging.debug(f"Loaded site request for user {user_id}: {json.dumps(data)}")
                return data
        else:
            logging.warning(f"UX Issue - No site request found for user {user_id}")
            return {}
    except json.JSONDecodeError as e:
        logging.error(f"Security Issue - Invalid site request file format for user {user_id}: {str(e)}", exc_info=True)
        return {}
    except Exception as e:
        logging.error(f"UX Issue - Failed to load site request for user {user_id}: {str(e)}", exc_info=True)
        return {}

def save_site_request(user_id, site_request_data):
    try:
        if not os.path.exists(SITE_REQUEST_DIR):
            os.makedirs(SITE_REQUEST_DIR)
            logging.debug(f"Created site request directory: {SITE_REQUEST_DIR}")
        file_path = os.path.join(SITE_REQUEST_DIR, user_id)
        with open(file_path, 'w') as f:
            json.dump(site_request_data, f, indent=4)
        logging.debug(f"Saved site request for user {user_id}: {json.dumps(site_request_data)}")
    except Exception as e:
        logging.error(f"UX Issue - Failed to save site request for user {user_id}: {str(e)}", exc_info=True)
        raise  # Re-raise to alert calling code