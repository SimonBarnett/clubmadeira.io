import posthog
from .config import load_config  # Import from existing utils/config.py
import logging
from datetime import datetime, timedelta, timezone
import requests
import json
from functools import lru_cache

def initialize_posthog():
    """
    Initialize PostHog client using credentials from config.json.

    Returns:
        posthog: Initialized PostHog client object, or None if initialization fails.
    """
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

def get_date_range(period):
    """
    Calculate the start and end dates for a given temporal period in UTC.

    Args:
        period (str): One of 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month'.

    Returns:
        tuple: (start_date, end_date) in ISO format with UTC timezone.
    """
    today = datetime.now(timezone.utc).date()

    if period == 'today':
        start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
        end = start + timedelta(days=1)
    elif period == 'yesterday':
        yesterday = today - timedelta(days=1)
        start = datetime.combine(yesterday, datetime.min.time(), tzinfo=timezone.utc)
        end = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)
    elif period == 'this_week':
        start = datetime.combine(today - timedelta(days=today.weekday()), datetime.min.time(), tzinfo=timezone.utc)  # Monday
        end = start + timedelta(days=7)
    elif period == 'last_week':
        start = datetime.combine(today - timedelta(days=today.weekday() + 7), datetime.min.time(), tzinfo=timezone.utc)
        end = start + timedelta(days=7)
    elif period == 'this_month':
        start = datetime.combine(today.replace(day=1), datetime.min.time(), tzinfo=timezone.utc)
        end = (start + timedelta(days=32)).replace(day=1)
    elif period == 'last_month':
        first_of_this_month = today.replace(day=1)
        last_month = first_of_this_month - timedelta(days=1)
        start = datetime.combine(last_month.replace(day=1), datetime.min.time(), tzinfo=timezone.utc)
        end = datetime.combine(first_of_this_month, datetime.min.time(), tzinfo=timezone.utc)
    else:
        start = datetime.combine(today, datetime.min.time(), tzinfo=timezone.utc)  # Default to today
        end = start + timedelta(days=1)

    return start.isoformat(), end.isoformat()

@lru_cache(maxsize=100)
def cached_fetch_events(event_type, start, end, properties_filter_str=None):
    """
    Cached helper function to fetch events from PostHog, avoiding redundant API calls.

    Args:
        event_type (str): The event type to filter by (e.g., 'login').
        start (str): Start date in ISO format (e.g., '2025-05-09T00:00:00Z').
        end (str): End date in ISO format (e.g., '2025-05-09T23:59:59Z').
        properties_filter_str (str, optional): JSON-serialized string of property filters.

    Returns:
        list: List of event dictionaries from PostHog, or empty list if the request fails.
    """
    # Convert properties_filter_str back to a list if provided
    properties_filter = json.loads(properties_filter_str) if properties_filter_str else None
    # Call the internal fetch function with deserialized filter
    return fetch_events_internal(event_type, start, end, properties_filter)

def fetch_events_internal(event_type, start, end, properties_filter=None):
    """
    Internal function to handle the actual API call to PostHog.

    Args:
        event_type (str): The event type to filter by (e.g., 'login').
        start (str): Start date in ISO format (e.g., '2025-05-09T00:00:00Z').
        end (str): End date in ISO format (e.g., '2025-05-09T23:59:59Z').
        properties_filter (list, optional): List of property filters (e.g., [{'key': 'source_user_id', 'value': '123'}]).

    Returns:
        list: List of event dictionaries from PostHog, or empty list if the request fails.
    """
    # Load PostHog configuration
    config = load_config()
    posthog_config = config.get("posthog", {})

    api_key = posthog_config.get("PROJECT_READ_KEY", "")
    host = posthog_config.get("HOST", "https://eu.i.posthog.com")
    project_id = posthog_config.get("PROJECT_ID", 0)

    if not api_key or not project_id:
        logging.error("PostHog configuration missing: PROJECT_READ_KEY or PROJECT_ID not set")
        return []

    try:
        # Construct the API URL and headers
        url = f"{host}/api/projects/{project_id}/events"
        headers = {"Authorization": f"Bearer {api_key}"}

        # Set up query parameters
        params = {
            "event": event_type,
            "after": start,
            "before": end,
        }
        if properties_filter:
            params["properties"] = json.dumps(properties_filter)  # Serialize filter to JSON

        # Make the API request
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()  # Raises an exception for 4xx/5xx status codes

        # Return the list of events from the response
        return response.json().get("results", [])

    except Exception as e:
        logging.error(f"Failed to fetch events from PostHog: {str(e)}")
        return []

def fetch_events(event_type, start, end, properties_filter=None):
    """
    Fetch events from PostHog with optional filters, utilizing caching for efficiency.

    Args:
        event_type (str): The event type to filter by (e.g., 'login').
        start (str): Start date in ISO format (e.g., '2025-05-09T00:00:00Z').
        end (str): End date in ISO format (e.g., '2025-05-09T23:59:59Z').
        properties_filter (list, optional): List of property filters (e.g., [{'key': 'source_user_id', 'value': '123'}]).

    Returns:
        list: List of event dictionaries from PostHog, or empty list if the request fails.
    """
    # Serialize properties_filter to a JSON string for caching, ensuring consistency with sort_keys
    properties_filter_str = json.dumps(properties_filter, sort_keys=True) if properties_filter else None
    # Call the cached function with serialized parameters
    return cached_fetch_events(event_type, start, end, properties_filter_str)

def format_event_details(properties, event_type):
    """
    Formats PostHog event properties based on the event type and logs the entire properties dictionary.

    Args:
        properties (dict): The properties dictionary from the event.
        event_type (str): The type of the event.

    Returns:
        str: A formatted string summarizing the event details.
    """
    # Log the entire properties dictionary with the event type for debugging
    logging.debug(f"Event properties for {event_type}:\n{json.dumps(properties, indent=2)}")

    # Define formatters for all four supported event types
    formatters = {
        'login': lambda props: f"{props.get('user_id')} logged in from IP {props.get('$ip', 'N/A')}",
        'signup': lambda props: f"Signup for IP {props.get('$ip', 'N/A')}, Role: {props.get('role', 'N/A')}, Email: {props.get('email', 'N/A')}",
        'click': lambda props: f"Click by IP {props.get('$ip', 'N/A')} from: {props.get('source', props.get('source_user_id'))} to: {props.get('destination', props.get('destination_user_id'))}",
        'order': lambda props: f"Order for {props.get('sale_value', 'N/A')} by IP {props.get('$ip', 'N/A')} from: {props.get('source', props.get('source_user_id'))} to: {props.get('destination', props.get('destination_user_id'))}"
    }

    # Get the appropriate formatter or use a default if the event type is unrecognized
    formatter = formatters.get(event_type, lambda props: "No details available")
    return formatter(properties)