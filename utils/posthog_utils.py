import posthog
from .config import load_config  # Import from existing utils/config.py
import logging

def initialize_posthog():
    """Initialize PostHog client using credentials from config.json."""
    config = load_config()
    posthog_config = config.get("posthog", {})
    api_key = posthog_config.get("PROJECT_API_KEY")
    host = posthog_config.get("HOST", "https://app.posthog.com")
    
    if not api_key:
        logging.warning("PostHog Issue - No API key found in config, PostHog disabled")
        return None
    
    try:
        posthog.api_key = api_key
        posthog.host = host
        logging.debug("PostHog initialized successfully")
        return posthog
    except Exception as e:
        logging.error(f"PostHog Issue - Failed to initialize PostHog: {str(e)}", exc_info=True)
        return None