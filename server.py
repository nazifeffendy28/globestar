from flask import Flask, request, jsonify, send_from_directory
import json
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Get the directory where server.py is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Construct the full path to users.json
USERS_FILE = os.path.join(BASE_DIR, 'js', 'users.json')

print(f"Looking for users.json at: {USERS_FILE}")  # Debug print

def load_users():
    try:
        with open(USERS_FILE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        print(f"users.json not found at {USERS_FILE}. Creating default file.")
        create_default_users_file()
        return load_users()  # Recursive call to load the newly created file
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {USERS_FILE}. File might be corrupted.")
        return {"users": []}

def save_users(users):
    with open(USERS_FILE, 'w') as file:
        json.dump(users, file, indent=2)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    else:
        return send_from_directory('.', 'index.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    users = load_users()
    user = next((user for user in users['users'] if user['username'] == data['username'] and user['password'] == data['password']), None)
    
    if user:
        return jsonify({
            "status": "success",
            "user": {
                "username": user['username'],
                "wallet_address": user['wallet_address'],
                "balance_gsx": user['balance_gsx']
            }
        }), 200
    else:
        return jsonify({"status": "error", "message": "Invalid username or password"}), 401

@app.route('/api/user/<wallet_address>', methods=['GET'])
def get_user(wallet_address):
    users = load_users()
    user = next((user for user in users['users'] if user['wallet_address'] == wallet_address), None)
    
    if user:
        return jsonify({
            "status": "success",
            "user": {
                "username": user['username'],
                "wallet_address": user['wallet_address'],
                "balance_gsx": user['balance_gsx']
            }
        }), 200
    else:
        return jsonify({"status": "error", "message": "User not found"}), 404

@app.route('/api/send', methods=['POST'])
def process_send():
    transaction = request.json
    users = load_users()
    
    sender = next((user for user in users['users'] if user['wallet_address'] == transaction['fromAddress']), None)
    recipient = next((user for user in users['users'] if user['wallet_address'] == transaction['toAddress']), None)
    
    if not sender or not recipient:
        return jsonify({"status": "error", "message": "Invalid sender or recipient"}), 400
    
    if sender['balance_gsx'] < transaction['totalAmount']:
        return jsonify({"status": "error", "message": "Insufficient balance"}), 400
    
    # Perform the transaction atomically
    sender['balance_gsx'] -= transaction['totalAmount']
    recipient['balance_gsx'] += transaction['amount']
    
    save_users(users)
    
    return jsonify({
        "status": "success", 
        "senderBalance": sender['balance_gsx'],
        "recipientBalance": recipient['balance_gsx']
    }), 200

@app.route('/api/deposit', methods=['POST'])
def process_deposit():
    transaction = request.json
    users = load_users()
    
    user = next((user for user in users['users'] if user['wallet_address'] == transaction['toAddress']), None)
    
    if not user:
        return jsonify({"status": "error", "message": "Invalid recipient"}), 400
    
    user['balance_gsx'] += transaction['totalAmount']
    
    save_users(users)
    
    return jsonify({"status": "success", "newBalance": user['balance_gsx']}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)