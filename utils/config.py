import json 
import os 
 
CONFIG_FILE = "config.json" 
 
def load_config(): 
    default_config = {"amazon_uk": {"ACCESS_KEY": "", "SECRET_KEY": "", "ASSOCIATE_TAG": "", "COUNTRY": ""}} 
    if not os.path.exists(CONFIG_FILE): 
        return default_config 
    with open(CONFIG_FILE, 'r') as f: 
        return json.load(f) 
 
def save_config(config): 
    with open(CONFIG_FILE, 'w') as f: 
        json.dump(config, f, indent=4) 
