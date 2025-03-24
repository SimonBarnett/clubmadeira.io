from flask import Flask, request, jsonify
import whois  # Requires 'pip install python-whois'
from auth import require_permissions  # Placeholder import for your custom decorator

app = Flask(__name__)

@app.route('/check-domain', methods=['GET'])
@require_permissions(["allauth"], require_all=False)  # Custom decorator applied
def check_domain():
    # Get domain from query parameter
    domain = request.args.get('domain')
    
    # Basic validation (matches client-side regex: /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/)
    if not domain:
        return jsonify({"error": "Please provide a domain name"}), 400
    
    if not all(c.isalnum() or c in '-.' for c in domain) or \
       not '.' in domain or \
       len(domain.split('.')[-1]) < 2:
        return jsonify({"error": "Invalid domain name (e.g., mystore.uk)"}), 400
    
    # Query WHOIS data using python-whois
    try:
        w = whois.whois(domain)
        # If no registration data exists (e.g., creation_date is None), domain is available
        is_available = w.creation_date is None
        return jsonify({
            "domain": domain,
            "available": is_available
        }), 200
    except Exception as e:
        # Handle WHOIS query failures (e.g., timeouts, invalid TLDs)
        return jsonify({"error": f"Failed to check domain availability: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)