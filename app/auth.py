from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from .models import User
from datetime import datetime, timedelta
import random

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    if email:
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

    if phone:
        if User.query.filter_by(phone=phone).first():
            return jsonify({'error': 'Phone already registered'}), 400
    hashed = generate_password_hash(password) if password else ''

    user = User(username=username, email=email or '', phone=phone, password=hashed)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': 'Registration successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone
        }
    })

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    phone = data.get('phone')
    password = data.get('password')

    user = None
    if email:
        user = User.query.filter_by(email=email).first()
    elif phone:
        user = User.query.filter_by(phone=phone).first()
    else:
        return jsonify({'error': 'Provide email or phone to login'}), 400

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not password:
        return jsonify({'error': 'Password required for this login method'}), 400

    if not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone': user.phone
        }
    })

@auth_bp.route('/send_otp', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    phone = data.get('phone')
    if not phone:
        return jsonify({'error': 'Phone is required'}), 400
    user = User.query.filter_by(phone=phone).first()
    if not user:
        user = User(username=f'user_{phone}', email='', phone=phone, password='')
        db.session.add(user)
        db.session.commit()
    otp = f"{random.randint(0, 999999):06d}"
    user.otp_code = otp
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=5)
    db.session.commit()
    return jsonify({'message': 'OTP sent', 'otp': otp})
@auth_bp.route('/verify_otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    phone = data.get('phone')
    otp = data.get('otp')
    if not phone or not otp:
        return jsonify({'error': 'Phone and otp are required'}), 400

    user = User.query.filter_by(phone=phone).first()
    if not user or not user.otp_code:
        return jsonify({'error': 'OTP not requested for this phone'}), 400

    if user.otp_expires_at is None or datetime.utcnow() > user.otp_expires_at:
        return jsonify({'error': 'OTP expired'}), 400

    if user.otp_code != otp:
        return jsonify({'error': 'Invalid OTP'}), 401
    
    user.otp_code = None
    user.otp_expires_at = None
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'message': 'Login via OTP successful', 'token': token, 'user': {'id': user.id, 'username': user.username, 'phone': user.phone}})

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'message': 'Logout successful'})

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email
    })

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    data = request.get_json()
    
    if 'username' in data:
        if User.query.filter_by(username=data['username']).first() and data['username'] != user.username:
            return jsonify({'error': 'Username already taken'}), 400
        user.username = data['username']
    
    if 'email' in data:
        if User.query.filter_by(email=data['email']).first() and data['email'] != user.email:
            return jsonify({'error': 'Email already registered'}), 400
        user.email = data['email']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    })
