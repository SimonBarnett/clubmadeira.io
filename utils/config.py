import json
import os
import logging

CONFIG_FILE = "config.json"

def load_config():
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                # Redact sensitive data in logs
                log_config = config.copy()
                if "jwt" in log_config and "SECRET_KEY" in log_config["jwt"]:
                    log_config["jwt"]["SECRET_KEY"] = "[REDACTED]"
                logging.debug(f"Loaded config: {json.dumps(log_config)}")
                return config
        else:
            logging.warning("UX Issue - Config file not found, using defaults")
            default_config = {"log_level": "DEBUG", "jwt": {"SECRET_KEY": "your-secret-key"}}
            return default_config
    except json.JSONDecodeError as e:
        logging.error(f"Security Issue - Invalid config file format: {str(e)}", exc_info=True)
        return {"log_level": "DEBUG", "jwt": {"SECRET_KEY": "your-secret-key"}}
    except Exception as e:
        logging.error(f"UX Issue - Failed to load config: {str(e)}", exc_info=True)
        return {"log_level": "DEBUG", "jwt": {"SECRET_KEY": "your-secret-key"}}

def save_config(config):
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=4)
        # Redact sensitive data in logs
        log_config = config.copy()
        if "jwt" in log_config and "SECRET_KEY" in log_config["jwt"]:
            log_config["jwt"]["SECRET_KEY"] = "[REDACTED]"
        logging.debug(f"Saved config: {json.dumps(log_config)}")
    except Exception as e:
        logging.error(f"UX Issue - Failed to save config: {str(e)}", exc_info=True)
        raise  # Re-raise to alert calling code