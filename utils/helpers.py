# utils/helpers.py

def get_system_stats():
    """
    Stub for retrieving system statistics.
    Returns a dictionary with placeholder values for CPU, memory, and disk usage.
    """
    return {
        "cpu_usage": 0.0,
        "memory_usage": 0.0,
        "disk_usage": 0.0
    }

def ping_service():
    """
    Stub for checking if a service is reachable.
    Always returns True to simulate a successful ping.
    """
    return True

def log_activity(user_id, action, details=None):
    """
    Stub for logging user activity.
    Prints a message with the user ID, action, and optional details.
    """
    print(f"Logging activity for user {user_id}: {action} - Details: {details}")