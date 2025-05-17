from flask import Blueprint, jsonify, request, current_app
import logging
import string
import json
import requests 
from utils.auth import login_required, get_authenticated_user
from utils.posthog_utils import get_date_range, fetch_events, format_event_details  # Import helper functions
from utils.users import load_users_settings

# Create the Blueprint
referral_bp = Blueprint("referral_bp", __name__)

def verify_code(code):
    """
    Verify if the given code matches its checksum.
    
    The code should be an 8-character string where the first 7 characters
    are from the charset (digits and uppercase letters), and the 8th character
    is the checksum computed as charset[sum(indices) % 36].
    
    Args:
        code: The code to verify.
    
    Returns:
        bool: True if the code is valid, False otherwise.
    """
    # Define valid characters for user IDs (uppercase letters and digits)
    charset = string.digits + string.ascii_uppercase
    
    # Check if input is a string and exactly 8 characters long
    if not isinstance(code, str) or len(code) != 8:
        return False
    
    # Check if all characters are in the charset
    if not all(c in charset for c in code):
        return False
    
    # Split into code part and checksum
    code_part = code[:7]
    given_checksum = code[7]
    
    # Calculate the sum of indices for the first 7 characters
    total = sum(charset.index(c) for c in code_part)
    
    # Compute the expected checksum
    expected_checksum = charset[total % 36]
    
    # Return True if the expected checksum matches the given checksum
    return expected_checksum == given_checksum

@referral_bp.route("/event", methods=["POST"])
def handle_event():
    """
    Handle events by determining the event type based on the presence of sale_value.
    
    Expects a JSON payload with:
    - source_user_id: ID of the referring user (required)
    - destination_user_id: ID of the target user (required)
    - sale_value (optional): If present, the event is an "order"; otherwise, a "click"
    
    Returns:
        JSON response with status or error message, along with HTTP status code.
    """
    try:
        # Parse JSON data from the request
        data = request.get_json(silent=True)
        if not data:
            logging.warning("No JSON data provided in request")
            return {"error": "Invalid data: JSON required"}, 400

        # Extract required fields
        source_user_id = data.get("source_user_id")
        destination_user_id = data.get("destination_user_id")

        # Check for required fields
        if not source_user_id or not destination_user_id:
            logging.warning("Missing required fields: source_user_id or destination_user_id")
            return {"error": "Missing required fields: source_user_id and destination_user_id"}, 400

        # Validate user IDs
        if not verify_code(source_user_id) or not verify_code(destination_user_id):
            logging.warning(f"Invalid user IDs - Source: {source_user_id}, Destination: {destination_user_id}")
            return {"error": "Invalid source_user_id or destination_user_id"}, 403

        # Determine event type based on presence of sale_value
        if "sale_value" in data:
            event_type = "order"
            try:
                sale_value = float(data["sale_value"])
            except (TypeError, ValueError):
                logging.warning(f"Invalid sale_value: {data.get('sale_value')}")
                return {"error": "Invalid sale_value: must be a number"}, 400
        else:
            event_type = "click"
            sale_value = None

        # Retrieve user settings (assuming utils.users provides this function)
        from utils.users import get_user_settings
        source_user_settings = get_user_settings(source_user_id)
        destination_user_settings = get_user_settings(destination_user_id)

        # Check if both users exist
        if not source_user_settings or not destination_user_settings:
            logging.warning(f"User not found - Source: {source_user_id}, Destination: {destination_user_id}")
            return {"error": "Source or destination user not found"}, 403

        # Extract website URLs, defaulting to "N/A" if missing or empty
        source_url = source_user_settings.get("website_url") or "N/A"
        destination_url = destination_user_settings.get("website_url") or "N/A"

        # Build event properties for PostHog
        event_properties = {
            "source_user_id": source_user_id,
            "destination_user_id": destination_user_id,
            "source": source_url,
            "destination": destination_url,
        }
        if event_type == "order":
            event_properties["sale_value"] = sale_value

        # Send event to PostHog if client is configured
        posthog_client = current_app.posthog_client
        if posthog_client:
            posthog_client.capture(
                distinct_id=source_user_id,
                event=event_type,
                properties=event_properties
            )

        # Log successful event
        log_message = f"{event_type.capitalize()} recorded from {source_user_id} to {destination_user_id}"
        if event_type == "order":
            log_message += f" for {sale_value}"
        logging.info(log_message)

        return {"status": "success"}, 200

    except Exception as e:
        # Handle server errors, log them, and report to PostHog
        logging.error(f"Server error in handle_event: {str(e)}")
        posthog_client = current_app.posthog_client
        if posthog_client:
            posthog_client.capture(
                distinct_id=data.get("source_user_id", "unknown") if data else "unknown",
                event="event_error",
                properties={"error": str(e)}
            )
        return {"error": "Internal server error"}, 500

@referral_bp.route('/events/<event_type>', methods=['GET'])
@login_required(["self"], require_all=True)
def get_user_events(event_type):
    """
    Retrieves PostHog events for the authenticated user based on role and event type, with temporal filter.
    Inputs:
        event_type (str): One of 'click', 'order'.
        period (query param, optional): Temporal filter (e.g., 'today', 'yesterday', 'this_week'), defaults to 'today'.
    Outputs:
        - Success: JSON {"status": "success", "events": [<event_list>]}
        - Error: JSON {"status": "error", "message": "<error_message>"}
    """
    try:
        decoded, _, error_response = get_authenticated_user()
        if error_response:
            return error_response

        user_id = decoded.get('user_id')
        x_role = decoded.get('x-role', 'login').lower()

        # Updated to use 'click' and 'order' instead of 'referral' and 'sale'
        if event_type not in ["click", "order"]:
            return jsonify({"status": "error", "message": "Invalid event type"}), 400

        # Determine filter key based on user role
        if x_role == 'community':
            filter_key = 'source_user_id'
        elif x_role == 'merchant':
            filter_key = 'destination_user_id'
        else:
            logging.warning(f"Permission denied for user {user_id}: invalid x-role '{x_role}'")
            return jsonify({"status": "error", "message": "Permission denied"}), 403

        # Get the period from query parameters, default to 'today'
        period = request.args.get('period', 'today')
        start, end = get_date_range(period)

        # Fetch events with role-based filter
        properties_filter = [{'key': filter_key, 'value': user_id}]
        events_data = fetch_events(event_type, start, end, properties_filter)

        events = [
            {
                "timestamp": event.get("timestamp", "N/A"),
                "details": format_event_details(event.get("properties", {}), event_type)
            }
            for event in events_data
        ]
        logging.debug(f"User {user_id} retrieved {len(events)} {event_type} events for period {period}")
        return jsonify({"status": "success", "events": events}), 200

    except Exception as e:
        logging.error(f"Failed to retrieve {event_type} events for user {user_id}: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    
@referral_bp.route('/logs/<event_type>', methods=['GET'])
@login_required(["admin"], require_all=True)
def get_events(event_type):
    """
    Retrieves PostHog events for admins based on event type, with an optional temporal filter.
    Inputs:
        event_type (str): One of 'login', 'signup', 'click', 'order'.
        period (query param, optional): Temporal filter (e.g., 'today', 'yesterday', 'this_week'), defaults to 'today'.
    Outputs:
        - Success: JSON {"status": "success", "data": [<event_list>]}
        - Error: JSON {"status": "error", "message": "<error_message>"}
    """
    valid_event_types = ['login', 'signup', 'click', 'order']
    if event_type not in valid_event_types:
        logging.error(f"Invalid event type requested: {event_type}")
        return jsonify({"status": "error", "message": "Invalid event type"}), 400

    # Get the period from query parameters, default to 'today'
    period = request.args.get('period', 'today').strip()
    start, end = get_date_range(period)

    try:
        # Fetch events from PostHog for the given event type and time range
        events_data = fetch_events(event_type, start, end)
        events = [
            {
                "timestamp": event.get("timestamp", "N/A"),
                "user": event.get("distinct_id", "Anonymous"),
                "details": format_event_details(event.get("properties", {}), event_type)
            }
            for event in events_data
        ]
        logging.debug(f"Admin retrieved {len(events)} {event_type} events for period {period}")
        return jsonify({"status": "success", "data": events}), 200
    except Exception as e:
        logging.error(f"Failed to retrieve {event_type} events: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
    
@referral_bp.route('/referrer/<event_type>', methods=['GET'])
@login_required(["admin", "partner"], require_all=False)
def get_referrer_events(event_type):
    """
    Retrieves events where the current user is the referrer of either the source or destination user.
    
    Inputs:
    - event_type (str): The type of event to retrieve (e.g., 'click', 'signup').
    - period (query param, optional): Temporal filter (e.g., 'today', 'this_month'), defaults to 'today'.
    
    Outputs:
    - Success: JSON {"status": "success", "events": [<array_of_events>]} with HTTP 200.
    - Error: JSON {"status": "error", "message": "<error_message>"} with HTTP 400 or 500.
    """
    try:
        # Step 1: Authenticate and get the current user's ID
        decoded, _, error_response = get_authenticated_user()
        if error_response:
            return error_response
        user_id = decoded.get('user_id')
        if not user_id:
            return jsonify({"status": "error", "message": "User ID not found"}), 400

        # Step 2: Load all user settings to check referrers
        user_settings = load_users_settings()

        # Step 3: Validate the event type
        valid_event_types = ['login', 'signup', 'click', 'order']
        if event_type not in valid_event_types:
            return jsonify({"status": "error", "message": f"Invalid event type: {event_type}"}), 400

        # Step 4: Get the date range for event filtering
        period = request.args.get('period', 'today')
        start, end = get_date_range(period)

        # Step 5: Fetch all events of the specified type
        all_events = fetch_events(event_type, start, end, properties_filter=None)

        # Step 6: Filter events where the current user is the referrer of source or destination
        filtered_events = []
        for event_dict in all_events:
            properties = event_dict.get("properties", {})
            source_user_id = properties.get("source_user_id")
            destination_user_id = properties.get("destination_user_id")

            # Get the referrer for source and destination users from user_settings
            source_referrer = user_settings.get(source_user_id, {}).get("referrer")
            dest_referrer = user_settings.get(destination_user_id, {}).get("referrer")

            # Keep the event if the current user is the referrer of source OR destination
            if user_id in (source_referrer, dest_referrer):
                filtered_events.append(event_dict)

        # Step 7: Format the events for the response
        formatted_events = [
            {
                "timestamp": event_dict.get("timestamp", "N/A"),
                "details": format_event_details(event_dict.get("properties", {}), event_type)
            }
            for event_dict in filtered_events
        ]

        # Step 8: Log and return the response
        logging.debug(f"Retrieved {len(formatted_events)} {event_type} events where {user_id} is referrer")
        return jsonify({"status": "success", "events": formatted_events}), 200

    except Exception as e:
        logging.error(f"Failed to retrieve referral events: {str(e)}")
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500