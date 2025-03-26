import logging
from utils.config import load_config

# Placeholder AmazonApi class (assuming it’s defined elsewhere or stubbed)
class AmazonApi:
    def __init__(self, access_key, secret_key, associate_tag, country):
        self.access_key = access_key
        self.secret_key = secret_key
        self.associate_tag = associate_tag
        self.country = country
    
    def search_items(self, BrowseNodeId, ItemCount):
        logging.debug(f"Amazon API call to search items - BrowseNodeId: {BrowseNodeId}, ItemCount: {ItemCount}")
        return []  # Stub for demo

def search_all_discounted(category_id):
    config = load_config()
    try:
        if all(config.get("amazon_uk", {}).values()):
            amazon = AmazonApi(
                config["amazon_uk"]["ACCESS_KEY"],
                config["amazon_uk"]["SECRET_KEY"],
                config["amazon_uk"]["ASSOCIATE_TAG"],
                config["amazon_uk"]["COUNTRY"]
            )
            search_result = amazon.search_items(BrowseNodeId=category_id, ItemCount=10)
            if not search_result:
                logging.warning(f"UX Issue - No discounted products found for category_id: {category_id}")
            items = [{"id": item.asin, "title": item.item_info.title.display_value} for item in search_result]
            return items
        else:
            logging.warning(f"UX Issue - Amazon config incomplete for category_id: {category_id}")
            return []
    except Exception as e:
        logging.error(f"Security Issue - Failed to search discounted products for category_id {category_id}: {str(e)}", exc_info=True)
        return []  # Return empty list to maintain UX