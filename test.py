import bcrypt

stored_hash = "$2b$12$.kytJDE5AAdEYbZ4cu1omufcbroj9TDOcZMR1QqUm2uQZeegt5w2K"
password = "=mkOzaQ123"

if bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
    print("Password matches the hash")
else:
    print("Password does NOT match the hash")