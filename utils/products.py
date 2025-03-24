from .config import load_config 
from amazon_paapi import AmazonApi 
 
def search_all_discounted(category_id): 
    config = load_config() 
    items = [] 
    if all(config.get("amazon_uk", {}).values()): 
        amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"], config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"]) 
        search_result = amazon.search_items(BrowseNodeId=category_id, ItemCount=10) 
        items.extend([{"id": item.asin, "title": item.item_info.title.display_value} for item in search_result.items]) 
    return items 
