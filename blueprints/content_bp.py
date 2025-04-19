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
def call_xai_api(messages, deselected_categories):
    try:
        # No need to import app; current_app is available in request context
        headers = {
            'Authorization': f'Bearer {current_app.config["GROK_API_KEY"]}',
            'Content-Type': 'application/json'
        }
        payload = {
            'model': 'grok-2-1212',
            'messages': messages,
            'temperature': 0.7,
            'max_tokens': 1000
        }
        logging.debug(f"Sending request to xAI API: {json.dumps(payload, indent=2)}")
        response = requests.post('https://api.x.ai/v1/chat/completions', headers=headers, json=payload)
        response.raise_for_status()
        response_data = response.json()
        logging.debug(f"xAI API raw response: {json.dumps(response_data, indent=2)}")

        content = response_data['choices'][0]['message']['content']
        content = content.strip()
        if content.startswith('```json') and content.endswith('```'):
            content = content[7:-3].strip()
        elif content.startswith('```') and content.endswith('```'):
            content = content[3:-3].strip()

        parsed_content = json.loads(content)
        validate(instance=parsed_content, schema=CATEGORY_SCHEMA)
        logging.debug(f"Cleaned xAI API response: {json.dumps(parsed_content)}")
        return parsed_content
    except ValidationError as ve:
        logging.error(f"Failed to validate xAI API response: {str(ve)}")
        return None
    except Exception as e:
        logging.error(f"Failed to process xAI API response: {str(e)}")
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
    error_message = None
    categories = None
    prompt = ""
    selected = []
    deselected = []
    cumulative_deselected = []

    try:
        user_id = request.user_id
        user_settings = get_user_settings(user_id)
        saved_data = user_settings.get("categories", {})

        if request.method == "POST":
            prompt = request.form.get("prompt", "").strip()
            selected = request.form.getlist("selected")
            deselected = json.loads(request.form.get("deselected", "[]"))
            previous_deselected = json.loads(request.form.get("previous_deselected", "[]"))

            if not prompt:
                error_message = "Prompt is required."
                logging.warning("UX Issue - No prompt provided for category generation")
            else:
                cumulative_deselected = list(set(deselected + previous_deselected))
                logging.debug(f"Cumulative deselections: {cumulative_deselected}")
                is_first_pass = not selected and not cumulative_deselected
                schema_instruction = (
                    f"Return the response as a JSON object conforming to this schema:\n{json.dumps(CATEGORY_SCHEMA, indent=2)}\n"
                    "The object should have 3-7 main categories, each with 3-7 subcategories. "
                    "Main categories and subcategories should contain only letters, numbers, spaces, and hyphens."
                )

                if is_first_pass:
                    messages = [
                        {
                            "role": "system",
                            "content": (
                                "You are an expert in e-commerce affiliate marketing with deep knowledge of club activities and interests. "
                                "Suggest 3-7 main discount categories (prefer 3-7) for a club’s discount page, each with 3-7 subcategories (prefer 3-7). "
                                "Categories MUST be directly tied to the club’s core activities, interests, or demographics as described in the prompt. "
                                "Focus on the most likely interests of the club members (e.g., for a scout group, prioritize categories like Camping Equipment, Outdoor Gear, Team Sports, and Scouting Skills over unrelated ones like Craft Supplies or Home Decor). "
                                "Do NOT include categories that are not directly related to the club’s activities, even if common in e-commerce. "
                                "Categories should be optimized for deals from Amazon UK, eBay UK, Awin, and CJ affiliate programs. "
                                f"Never include any categories or subcategories listed in the following deselected list: {cumulative_deselected}. "
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
                                "Refine the previous category suggestions based on user feedback. Suggest 3-7 main categories "
                                "(prefer 3-7) with 3-7 subcategories each (prefer 3-7), optimized for Amazon UK, eBay UK, Awin, "
                                "and CJ affiliate deals. Categories MUST be directly tied to the club’s core activities, interests, or demographics "
                                "as described in the original prompt. Focus on the most likely interests of the club members "
                                "(e.g., for a scout group, prioritize categories like Camping Equipment, Outdoor Gear, Team Sports, and Scouting Skills). "
                                "Do NOT include categories that are not directly related to the club’s activities. "
                                "Maintain selected categories and subcategories where possible, and generate new categories to replace "
                                f"those in the deselected list. Never include any categories or subcategories listed in the following "
                                f"deselected list: {cumulative_deselected}. "
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

                logging.debug(f"Sending prompt to Grok: {json.dumps(messages, indent=2)}")
                categories = call_xai_api(messages, cumulative_deselected)
                if not categories:
                    error_message = "Failed to generate categories. Please try again."
                    logging.warning("UX Issue - No categories returned from Grok API")
                else:
                    selected = selected
                    logging.debug(f"Generated/refined categories for prompt '{prompt}': {json.dumps(categories)}")
        else:
            if saved_data:
                prompt = saved_data.get("prompt", "")
                selected = saved_data.get("selected", [])
                cumulative_deselected = saved_data.get("cumulative_deselected", [])
                categories = saved_data.get("categories", None)
                logging.debug(f"Loaded saved categories for user {user_id}: {json.dumps(categories)}")

        return jsonify({
            "status": "success" if not error_message else "error",
            "error_message": error_message,
            "categories": categories,
            "prompt": prompt,
            "selected": selected,
            "deselected": deselected,
            "previous_deselected": cumulative_deselected
        })
    except Exception as e:
        logging.error(f"Failed to process categories for user {user_id}: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "error_message": f"An unexpected error occurred: {str(e)}",
            "categories": categories,
            "prompt": prompt,
            "selected": selected,
            "deselected": deselected,
            "previous_deselected": cumulative_deselected or []
        }), 500

# endregion

# region /categories/save POST - Save Categories
@content_bp.route('/api/categories/save', methods=['POST'])
@login_required(required_permissions=["self"], require_all=True)
def save_categories():
    try:
        user_id = request.user_id
        prompt = request.form.get("prompt", "").strip()
        selected = request.form.getlist("selected")
        deselected = json.loads(request.form.get("deselected", "[]"))
        previous_deselected = json.loads(request.form.get("previous_deselected", "[]"))
        categories = json.loads(request.form.get("categories", "{}"))

        user_settings = get_user_settings(user_id) or {}
        user_settings["categories"] = {
            "prompt": prompt,
            "selected": selected,
            "deselected": deselected,
            "cumulative_deselected": previous_deselected,
            "categories": categories
        }
        save_user_settings(user_id, user_settings)
        return jsonify({
            "status": "success",
            "error_message": null,
            "message": "Categories saved successfully."
        })
    except Exception as e:
        logging.error(f"Failed to save categories for user {user_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "error_message": f"Failed to save categories: {str(e)}"
        }), 500


# endregion

# region /categories/reset POST - Reset Categories
@content_bp.route('/api/categories/reset', methods=['POST'])
@login_required(required_permissions=["self"], require_all=True)
def reset_categories():
    try:
        user_id = request.user_id
        user_settings = get_user_settings(user_id) or {}
        user_settings["categories"] = {}
        save_user_settings(user_id, user_settings)
        return jsonify({
            "status": "success",
            "error_message": null,
            "categories": {},
            "prompt": "",
            "selected": [],
            "deselected": [],
            "previous_deselected": [],
            "message": "Categories reset successfully."
        })
    except Exception as e:
        logging.error(f"Failed to reset categories for user {user_id}: {str(e)}")
        return jsonify({
            "status": "error",
            "error_message": f"Failed to reset categories: {str(e)}",
            "categories": {},
            "prompt": "",
            "selected": [],
            "deselected": [],
            "previous_deselected": []
        }), 500
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