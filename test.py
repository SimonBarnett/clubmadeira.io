import bcrypt

# Stored hash from users_settings.json
stored_hashed_password = b'$2b$12$QPjvIvgZr9O5Ov3cbJI5xOBGC9Rq9vG/E.6Wrjqcr1.awGTHFHNwS'
plain_password = "qwe"

# Verify the password
if bcrypt.checkpw(plain_password.encode('utf-8'), stored_hashed_password):
    print("Password matches!")
else:
    print("Password does NOT match.")