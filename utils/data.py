 
def load_site_request(user_id): 
    file_path = os.path.join(SITE_REQUEST_DIR, user_id) 
    if os.path.exists(file_path): 
        with open(file_path, 'r') as f: 
            return json.load(f) 
    return {} 
 
def save_site_request(user_id, site_request_data): 
    if not os.path.exists(SITE_REQUEST_DIR): 
        os.makedirs(SITE_REQUEST_DIR) 
    file_path = os.path.join(SITE_REQUEST_DIR, user_id) 
    with open(file_path, 'w') as f: 
        json.dump(site_request_data, f, indent=4) 
