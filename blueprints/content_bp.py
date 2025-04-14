from flask import Blueprint, request, jsonify, session
import requests
import json
import logging
from utils.config import load_config  # Import from utils/config.py
from utils.users import load_users_settings, save_users_settings, get_user_settings  # Import from utils/users.py
from jsonschema import validate, ValidationError
from utils.products import search_all_discounted
from utils.auth import login_required

# region Blueprint Setup
# Welcome to content_bp, the blueprint that’s more organized than the Spanish Inquisition’s filing system.
# Arthur Dent would be proud—simple, logical, and occasionally bewildered by its own existence.
content_bp = Blueprint('content_bp', __name__)
# endregion

# Load configuration
config = load_config()

# xAI API configuration
XAI_API_URL = "https://api.x.ai/v1/chat/completions"
XAI_API_KEY = config["grok"]["API_KEY"]

# Load JSON schema for categories
with open("schemas/categories.json", "r") as f:
    CATEGORY_SCHEMA = json.load(f)

# Clean Grok's response to remove markdown formatting
def clean_response(response_text: str) -> str:
    """Remove backticks and code block markers from the response."""
    cleaned = response_text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:].strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:].strip()
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()
    if cleaned.startswith('"') and cleaned.endswith('"'):
        cleaned = cleaned[1:-1].replace('\\"', '"')
    return cleaned

# Helper function to call xAI API
def call_xai_api(messages, deselected):
    headers = {
        "Authorization": f"Bearer {XAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "messages": messages,
        "model": "grok-2-latest",
        "max_tokens": 1000
    }
    try:
        response = requests.post(XAI_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        # Log the raw response for debugging
        raw_content = response.text
        logging.debug(f"xAI API raw response: {raw_content}")
        # Attempt to parse as JSON
        content = response.json()
        # Clean the response content before parsing
        cleaned_content = clean_response(content["choices"][0]["message"]["content"])
        logging.debug(f"Cleaned xAI API response: {cleaned_content}")
        parsed_content = json.loads(cleaned_content)
        # Validate against schema
        validate(instance=parsed_content, schema=CATEGORY_SCHEMA)
        # Filter out deselected categories/subcategories
        filtered_content = {}
        for main_cat, subcats in parsed_content.items():
            if main_cat in deselected:
                logging.debug(f"Filtering out deselected main category: {main_cat}")
                continue
            filtered_subcats = [subcat for subcat in subcats if f"{main_cat}:{subcat}" not in deselected]
            if len(filtered_subcats) >= 3:  # Ensure at least 3 subcategories
                filtered_content[main_cat] = filtered_subcats
            else:
                logging.debug(f"Main category {main_cat} has too few subcategories after filtering: {filtered_subcats}")
        # Allow as few as 3 categories if relevance is low
        if len(filtered_content) < 3:
            logging.warning(f"Filtered response has fewer than 3 categories ({len(filtered_content)}), proceeding with available categories")
        logging.debug(f"Filtered categories: {json.dumps(filtered_content)}")
        return filtered_content if filtered_content else None
    except (requests.RequestException, json.JSONDecodeError, ValidationError, KeyError) as e:
        logging.error(f"UX Issue - Failed to parse or validate xAI API response: {str(e)}", exc_info=True)
        return None

# region /deals GET - The Quest for Bargain Treasures
@content_bp.route('/deals', methods=['GET'])
def get_all_discounted_products():
    """
    Retrieves all discounted products for a given category, like Zaphod Beeblebrox hunting for the best Pan Galactic Gargle Blaster deals.
    Purpose: To provide a list of products that are currently on discount, filtered by category—like the Holy Grail, but with price tags.
    Inputs: Query parameter:
        - category_id (str): The ID of the category to filter discounted products. Required, or it’s like asking for "four candles" and getting fork handles.
    Outputs:
        - Success: JSON {"status": "success", "count": <int>, "products": [<product_data>]}, status 200—your treasure map to savings!
        - Errors:
            - 400: {"status": "error", "message": "category_id required"}—you forgot the category, you naughty boy!
            - 500: {"status": "error", "message": "Server error: <reason>"}—the system’s gone to the People’s Front of Judea!
    """
    try:
        category_id = request.args.get('category_id')
        if not category_id:
            logging.warning("UX Issue - No category_id provided for discounted products")
            return jsonify({"status": "error", "message": "category_id required"}), 400
        
        products = search_all_discounted(category_id)
        if not products:
            logging.warning(f"UX Issue - No discounted products found for category_id: {category_id}")
        
        response_data = {"status": "success", "count": len(products), "products": products}
        logging.debug(f"Retrieved discounted products for category_id {category_id}: {json.dumps(response_data)}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"UX Issue - Failed to retrieve discounted products: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500
# endregion

# ASCII Art 1: The Holy Grail
r"""
       /\
      /  \
     /____\  "It's just a flesh wound! Keep searching for those discounts!"
    |      |
    |______|
"""

# region /categories GET/POST - Grok-Powered Discount Category Generator
@content_bp.route('/categories', methods=['GET', 'POST'])
@login_required(required_permissions=["self"], require_all=True)
def categories():
    """
    Generates or refines discount club categories using Grok, like Arthur Dent navigating the Galaxy for the best deals.
    Purpose: To suggest up to 7 main categories (preferring 3-7) with up to 7 subcategories each (preferring 3-7), optimized for Amazon UK, eBay UK, Awin, and CJ affiliate deals.
    Inputs:
        - GET: Returns initial form state as JSON, loading saved categories if available.
        - POST:
            - prompt (str): The user’s prompt describing the club (required).
            - selected (list): Ticked categories (e.g., ['Outdoor Gear:Tents']), optional for refinements.
            - deselected (JSON str): Unticked categories (e.g., '["Electronics"]'), optional.
            - previous_deselected (JSON str): Previously deselected categories, optional.
    Outputs:
        - JSON response with categories, prompt, selected, deselected, previous_deselected, and error message (if any).
    """
    error_message = None
    categories = None
    prompt = ""
    selected = []
    deselected = []
    previous_deselected = []

    try:
        # Use user_id from request (set by login_required)
        user_id = request.user_id

        # Load user settings
        user_settings = get_user_settings(user_id)
        saved_data = user_settings.get("categories", {})

        if request.method == "POST":
            prompt = request.form.get("prompt", "").strip()
            selected = request.form.getlist("selected")  # e.g., ["Outdoor Gear:Tents"]
            deselected = json.loads(request.form.get("deselected", "[]"))  # e.g., ["Electronics"]
            previous_deselected = json.loads(request.form.get("previous_deselected", "[]"))

            if not prompt:
                error_message = "Prompt is required."
                logging.warning("UX Issue - No prompt provided for category generation")
            else:
                # Merge current and previous deselections
                cumulative_deselected = list(set(deselected + previous_deselected))
                logging.debug(f"Cumulative deselections: {cumulative_deselected}")

                # Determine if this is the first pass
                is_first_pass = not selected and not cumulative_deselected

                # Include schema in prompt
                schema_instruction = (
                    f"Return the response as a JSON object conforming to this schema:\n{json.dumps(CATEGORY_SCHEMA, indent=2)}\n"
                    "The object can have up to 7 main categories, each with up to 7 subcategories. "
                    "Main categories and subcategories should contain only letters, numbers, spaces, and hyphens."
                )

                # Prepare API messages
                if is_first_pass:
                    messages = [
                        {
                            "role": "system",
                            "content": (
                                "You are an expert in e-commerce affiliate marketing with deep knowledge of club activities and interests. "
                                "Suggest up to 7 main discount categories (prefer 3-7) for a club’s discount page, each with up to 7 subcategories (prefer 3-7). "
                                "Categories MUST be directly tied to the club’s core activities, interests, or demographics as described in the prompt. "
                                "Focus on the most likely interests of the club members based on their description (e.g., for a scout group, prioritize categories like Camping Equipment, Outdoor Gear, Team Sports, and Scouting Skills over unrelated ones like Craft Supplies or Home Decor). "
                                "If fewer than 3 categories are strongly relevant, include only those that align closely, leaving others blank. "
                                "Do NOT include categories that are not directly related to the club’s activities, even if common in e-commerce. "
                                "Categories should be optimized for deals from Amazon UK, eBay UK, Awin, and CJ affiliate programs. "
                                "Never include any categories or subcategories listed in the following deselected list, "
                                f"even if they seem relevant to the prompt: {cumulative_deselected}. "
                                f"{schema_instruction}"
                            )
                        },
                        {"role": "user", "content": prompt}
                    ]
                else:
                    messages = [
                        {
                            "role": "system",
                            "content": (
                                "Refine the previous category suggestions based on user feedback. Suggest up to 7 main categories "
                                "(prefer 3-7) with up to 7 subcategories each (prefer 3-7), optimized for Amazon UK, eBay UK, Awin, "
                                "and CJ affiliate deals. Categories MUST be directly tied to the club’s core activities, interests, or demographics "
                                "as described in the original prompt. Focus on the most likely interests of the club members "
                                "(e.g., for a scout group, prioritize categories like Camping Equipment, Outdoor Gear, Team Sports, and Scouting Skills). "
                                "If fewer than 3 categories are strongly relevant, include only those that align closely, leaving others blank. "
                                "Do NOT include categories that are not directly related to the club’s activities. "
                                "Maintain selected categories and subcategories where possible, and generate new categories to replace "
                                "those in the deselected list. Never include any categories or subcategories listed in the following "
                                f"deselected list, even if they seem relevant to the prompt: {cumulative_deselected}. "
                                f"{schema_instruction}"
                            )
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Original prompt: '{prompt}'. "
                                f"Selected: {selected}. Deselected: {cumulative_deselected}. "
                                f"Suggest refined categories."
                            )
                        }
                    ]

                # Log prompt for debugging
                logging.debug(f"Sending prompt to Grok: {json.dumps(messages, indent=2)}")

                # Call Grok API
                categories = call_xai_api(messages, cumulative_deselected)
                if not categories:
                    error_message = "Failed to generate categories. Please try again."
                    logging.warning("UX Issue - No categories returned from Grok API")
                else:
                    # Update selected for next iteration
                    selected = selected
                    logging.debug(f"Generated/refined categories for prompt '{prompt}': {json.dumps(categories)}")

        # If GET request, load saved categories if available
        else:
            if saved_data:
                prompt = saved_data.get("prompt", "")
                selected = saved_data.get("selected", [])
                cumulative_deselected = saved_data.get("cumulative_deselected", [])
                categories = saved_data.get("categories", None)
                logging.debug(f"Loaded saved categories for user {user_id}: {json.dumps(categories)}")

        # Return JSON response
        return jsonify({
            "status": "success" if not error_message else "error",
            "error_message": error_message,
            "categories": categories,
            "prompt": prompt,
            "selected": selected,
            "deselected": deselected,
            "previous_deselected": cumulative_deselected  # Persist for next form submission
        })

    except Exception as e:
        logging.error(f"UX Issue - Failed to process categories: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "error_message": "An unexpected error occurred.",
            "categories": categories,
            "prompt": prompt,
            "selected": selected,
            "deselected": deselected,
            "previous_deselected": cumulative_deselected
        }), 500
# endregion

# region /categories/save POST - Save Categories
@content_bp.route('/categories/save', methods=['POST'])
@login_required(required_permissions=["self"], require_all=True)
def save_categories():
    """
    Saves the current category state for the user, including prompt, exclusion history, selected categories, and current categories.
    Inputs:
        - POST:
            - prompt (str): The user’s prompt describing the club.
            - selected (list): Ticked categories (e.g., ['Outdoor Gear:Tents']).
            - deselected (JSON str): Unticked categories (e.g., '["Electronics"]').
            - previous_deselected (JSON str): Previously deselected categories.
            - categories (JSON str): Current category data.
    Outputs:
        - JSON response with status and message.
    """
    try:
        # Use user_id from request (set by login_required)
        user_id = request.user_id

        prompt = request.form.get("prompt", "").strip()
        selected = request.form.getlist("selected")  # e.g., ["Outdoor Gear:Tents"]
        deselected = json.loads(request.form.get("deselected", "[]"))  # e.g., ["Electronics"]
        previous_deselected = json.loads(request.form.get("previous_deselected", "[]"))
        categories = json.loads(request.form.get("categories", "{}"))

        # Merge deselections
        cumulative_deselected = list(set(deselected + previous_deselected))
        logging.debug(f"Saving cumulative deselections for user {user_id}: {cumulative_deselected}")

        # Load existing user settings
        user_settings = load_users_settings()

        # Update user settings with category data
        if user_id not in user_settings:
            user_settings[user_id] = {}
        user_settings[user_id]["categories"] = {
            "prompt": prompt,
            "selected": selected,
            "cumulative_deselected": cumulative_deselected,
            "categories": categories
        }

        # Save updated settings
        save_users_settings(user_settings)
        logging.debug(f"Saved category data for user {user_id}: {json.dumps(user_settings[user_id]['categories'])}")

        return jsonify({"status": "success", "message": "Categories saved successfully"})
    except Exception as e:
        logging.error(f"UX Issue - Failed to save categories: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Failed to save categories: {str(e)}"}), 500
# endregion

# region /categories/reset POST - Reset Categories
@content_bp.route('/categories/reset', methods=['POST'])
@login_required(required_permissions=["self"], require_all=True)
def reset_categories():
    """
    Resets the saved category state for the user, clearing the form to start fresh.
    Inputs:
        - POST: No inputs required.
    Outputs:
        - JSON response with status, message, and cleared form data.
    """
    try:
        # Use user_id from request (set by login_required)
        user_id = request.user_id

        # Load existing user settings
        user_settings = load_users_settings()

        # Clear user's category data
        if user_id in user_settings and "categories" in user_settings[user_id]:
            del user_settings[user_id]["categories"]
            save_users_settings(user_settings)
            logging.debug(f"Reset category data for user {user_id}")

        # Return cleared form data
        return jsonify({
            "status": "success",
            "message": "Categories reset successfully",
            "categories": None,
            "prompt": "",
            "selected": [],
            "deselected": [],
            "previous_deselected": []
        })
    except Exception as e:
        logging.error(f"UX Issue - Failed to reset categories: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": f"Failed to reset categories: {str(e)}"}), 500
# endregion

# ASCII Art 2: Zaphod Beeblebrox
r"""
       ______
      /|_||_\`.__
     (   _    _ _\
     =|  _    _  |  "Two heads are better than one—especially for finding bargains!"
      | (_)  (_) |
       \._|\'|\'_./
          |__|__| 
"""