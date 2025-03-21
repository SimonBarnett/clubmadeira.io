import bcrypt
import json

# Load existing users_settings.json
with open('M:/python/Madeira/users_settings.json', 'r') as f:
    users_settings = json.load(f)

# Function to hash a plain password
def hash_password(plain_password):
    return bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Update each user's password
for user_id, settings in users_settings.items():
    plain_password = settings.get("password")
    if plain_password and not plain_password.startswith('$2b$'):  # Check if it's not already a bcrypt hash
        hashed_password = hash_password(plain_password)
        settings["password"] = hashed_password
        print(f"Updated {user_id}: {hashed_password}")

# Save back to users_settings.json
with open('M:/python/Madeira/users_settings.json', 'w') as f:
    json.dump(users_settings, f, indent=4)

print("Passwords updated successfully.")