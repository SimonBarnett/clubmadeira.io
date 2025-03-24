from flask import Blueprint, jsonify, request
from utils.data_utils import load_json_file
from amazon_paapi import AmazonApi  # Requires 'amazon-paapi' package

affiliate_integrations_bp = Blueprint('affiliate_integrations', __name__)

@affiliate_integrations_bp.route('/amazon-uk/details', methods=['POST'])
def get_amazon_uk_details():
    data = request.get_json()
    asins = data.get('asins', [])
    category = data.get('category', '')
    config = load_json_file('config.json')
    amazon_config = config.get('amazon_uk', {})
    if not all(amazon_config.values()):
        return jsonify({"status": "error", "message": "Amazon UK configuration missing"}), 400
    amazon = AmazonApi(amazon_config['ACCESS_KEY'], amazon_config['SECRET_KEY'],
                       amazon_config['ASSOCIATE_TAG'], amazon_config['COUNTRY'])
    try:
        items = amazon.get_items(item_ids=asins, resources=["ItemInfo.Title", "Offers.Listings.Price", "Images.Primary.Large", "DetailPageURL"])
        full_item_data = []
        for item in items:
            if not item:  # Handle None items
                continue
            current_price = item.offers.listings[0].price.amount if item.offers and item.offers.listings else None
            item_data = {
                "source": "amazon_uk",
                "id": item.asin,
                "title": item.item_info.title.display_value if item.item_info and item.item_info.title else "No Title",
                "product_url": item.detail_page_url,
                "current_price": current_price,
                "original_price": current_price,  # Simplified; add logic for original price if available
                "discount_percent": 0.0,
                "image_url": item.images.primary.large.url if item.images and item.images.primary else None,
                "category": category
            }
            full_item_data.append(item_data)
        return jsonify({"status": "success", "items": full_item_data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500