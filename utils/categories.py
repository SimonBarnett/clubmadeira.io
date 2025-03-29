import logging
from utils.config import load_config

# Placeholder AmazonApi class (assuming it’s defined elsewhere or stubbed)
class AmazonApi:
    def __init__(self, access_key, secret_key, associate_tag, country):
        self.access_key = access_key
        self.secret_key = secret_key
        self.associate_tag = associate_tag
        self.country = country
    
    def get_browse_nodes(self, browse_node_ids, resources):
        logging.debug(f"Amazon API call to get browse nodes: {browse_node_ids}")
        return []  # Stub for demo

def get_all_categories(parent_id=None):
    config = load_config()
    if parent_id and all(config.get("amazon_uk", {}).values()):
        try:
            amazon = AmazonApi(
                config["amazon_uk"]["ACCESS_KEY"],
                config["amazon_uk"]["SECRET_KEY"],
                config["amazon_uk"]["ASSOCIATE_TAG"],
                config["amazon_uk"]["COUNTRY"]
            )
            browse_nodes = amazon.get_browse_nodes(browse_node_ids=[parent_id], resources=["BrowseNodes.Children"])
            if not browse_nodes:
                logging.warning(f"UX Issue - No categories returned from Amazon for parent_id: {parent_id}")
            categories = [{"id": node.browse_node_id, "name": node.display_name} for node in browse_nodes]
            return categories
        except Exception as e:
            logging.error(f"Security Issue - Failed to fetch Amazon categories for parent_id {parent_id}: {str(e)}", exc_info=True)
            return []  # Return empty list to maintain UX
    else:
        if parent_id:
            logging.warning(f"UX Issue - Amazon config incomplete for parent_id: {parent_id}")
        categories = [{"id": cat["id"], "name": cat["name"]} for cat in PSEUDO_CATEGORIES]
        return categories

def filter_categories_with_products(category_ids, min_discount_percent):
    logging.debug(f"Filtering categories: {category_ids} with min_discount_percent: {min_discount_percent}")
    try:
        # Placeholder logic (original was a stub)
        if not category_ids:
            logging.warning("UX Issue - No category IDs provided for filtering")
            return []
        filtered = [{"id": cat_id, "name": cat_id} for cat_id in category_ids]  # Stub implementation
        if not filtered:
            logging.warning(f"UX Issue - No categories filtered with min_discount: {min_discount_percent}")
        return filtered
    except Exception as e:
        logging.error(f"UX Issue - Error filtering categories: {str(e)}", exc_info=True)
        return []  # Return empty list to preserve UX