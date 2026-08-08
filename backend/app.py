from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import db, bcrypt, User, Employee, AuditAlert

app = Flask(__name__)

# Basic Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///benalert_enterprise.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-this-in-production'

# Initialize Extensions with full CORS permission
db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)

# Explicitly allow all methods, origins, and headers across all API routes
CORS(app, resources={r"/api/*": {"origins": "*"}}, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"])

# Global CORS header handler for all outgoing responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
    return response

# Create Database Tables Automatically
with app.app_context():
    db.create_all()


# --- AUTHENTICATION ROUTES ---

# 1. REGISTER NEW USER
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User with this email already exists'}), 400

    new_user = User(email=email)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    # Generate token immediately so they are logged in on registration
    access_token = create_access_token(identity=str(new_user.id))

    return jsonify({
        'message': 'User registered successfully',
        'token': access_token,
        'user': new_user.to_dict()
    }), 201


# 2. LOGIN USER
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password'}), 401

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        'message': 'Login successful',
        'token': access_token,
        'user': user.to_dict()
    }), 200


# 3. VERIFY TOKEN / GET CURRENT USER
@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({'user': user.to_dict()}), 200

# --- PROTECTED EMPLOYEE & ALERT ROUTES ---

# 1. GET ALL EMPLOYEES (Scoped to logged-in user)
@app.route('/api/employees', methods=['GET'])
@jwt_required()
def get_employees():
    # Convert string identity back to integer ID
    current_user_id = int(get_jwt_identity())
    
    # SECURITY: Only get employees created by THIS user!
    employees = Employee.query.filter_by(user_id=current_user_id).all()
    return jsonify([emp.to_dict() for emp in employees]), 200


# 2. CREATE A NEW EMPLOYEE
@app.route('/api/employees', methods=['POST'])
@jwt_required()
def create_employee():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    name = data.get('name')
    role = data.get('role')

    if not name or not role:
        return jsonify({'message': 'Name and role are required'}), 400

    new_employee = Employee(
        name=name,
        role=role,
        user_id=current_user_id # Automatically assigns ownership!
    )

    db.session.add(new_employee)
    db.session.commit()

    return jsonify(new_employee.to_dict()), 201


# 3. GET ALL ALERTS (Scoped to logged-in user's workforce)
@app.route('/api/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    current_user_id = int(get_jwt_identity())

    # Join AuditAlert with Employee to filter strictly by current_user_id
    alerts = AuditAlert.query.join(Employee).filter(Employee.user_id == current_user_id).all()
    return jsonify([alert.to_dict() for alert in alerts]), 200

# --- DAY 3: RECONCILIATION ENGINE & ALERT LIFECYCLE ---

# 1. TRIGGER CARRIER AUDIT RECONCILIATION
@app.route('/api/reconcile', methods=['POST'])
@jwt_required()
def run_reconciliation():
    current_user_id = int(get_jwt_identity())
    
    # SECURITY: Get only employees belonging to this logged-in HR Manager
    user_employees = Employee.query.filter_by(user_id=current_user_id).all()
    
    if not user_employees:
        return jsonify({'message': 'No employees found to audit. Please add employees first.'}), 400

    new_alerts_count = 0

    # SIMULATION LOGIC:
    # Scan user's active workforce. If an employee doesn't already have an open alert,
    # generate a realistic discrepancy alert to simulate a carrier drop.
    for emp in user_employees:
        existing_open_alert = AuditAlert.query.filter_by(employee_id=emp.id).filter(
            AuditAlert.status.in_(['Open', 'Investigating'])
        ).first()

        # If no active alert exists, simulate a carrier mismatch
        if not existing_open_alert:
            simulated_alert = AuditAlert(
                employee_id=emp.id,
                carrier_name='Blue Cross Blue Shield',
                carrier_status='Dropped / Coverage Terminated',
                status='Open',
                notes='System flag: Active worker missing from recent carrier eligibility file.'
            )
            db.session.add(simulated_alert)
            new_alerts_count += 1

    db.session.commit()

    return jsonify({
        'message': f'Reconciliation audit complete. {new_alerts_count} new discrepancy alerts flagged.',
        'new_alerts_generated': new_alerts_count
    }), 201


# 2. UPDATE ALERT (Status & Notes)
@app.route('/api/alerts/<int:alert_id>', methods=['PATCH'])
@jwt_required()
def update_alert(alert_id):
    current_user_id = int(get_jwt_identity())

    # SECURITY CHECK: Join with Employee to verify THIS user owns the alert!
    alert = AuditAlert.query.join(Employee).filter(
        AuditAlert.id == alert_id,
        Employee.user_id == current_user_id
    ).first()

    if not alert:
        return jsonify({'message': 'Alert not found or access unauthorized'}), 404

    data = request.get_json()

    # Update status if provided
    if 'status' in data:
        alert.status = data['status'] # e.g. "Investigating", "Resolved"

    # Update notes if provided
    if 'notes' in data:
        alert.notes = data['notes']

    db.session.commit()

    return jsonify({
        'message': 'Alert updated successfully',
        'alert': alert.to_dict()
    }), 200


# 3. DISMISS / DELETE ALERT
@app.route('/api/alerts/<int:alert_id>', methods=['DELETE'])
@jwt_required()
def delete_alert(alert_id):
    current_user_id = int(get_jwt_identity())

    # SECURITY CHECK: Verify user ownership before deletion
    alert = AuditAlert.query.join(Employee).filter(
        AuditAlert.id == alert_id,
        Employee.user_id == current_user_id
    ).first()

    if not alert:
        return jsonify({'message': 'Alert not found or access unauthorized'}), 404

    db.session.delete(alert)
    db.session.commit()

    return jsonify({'message': f'Alert #{alert_id} dismissed successfully'}), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)