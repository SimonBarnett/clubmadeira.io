    config = load_config() 
    if parent_id and all(config.get("amazon_uk", {}).values()): 
        amazon = AmazonApi(config["amazon_uk"]["ACCESS_KEY"], config["amazon_uk"]["SECRET_KEY"], config["amazon_uk"]["ASSOCIATE_TAG"], config["amazon_uk"]["COUNTRY"]) 
        browse_nodes = amazon.get_browse_nodes(browse_node_ids=[parent_id], resources=["BrowseNodes.Children"]) 
        return [{"id": node.browse_node_id, "name": node.display_name} for node in browse_nodes.browse_nodes[0].children] 
    return [{"id": cat["id"], "name": cat["name"]} for cat in PSEUDO_CATEGORIES] 
 
def filter_categories_with_products(category_ids, min_discount_percent): 
    # Placeholder for filtering logic 
    return [{"id": cat_id, "name": cat_id} for cat_id in category_ids] 
