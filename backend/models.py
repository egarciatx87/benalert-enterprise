from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    # Relationship: One User has Many Employees
    employees = db.relationship('Employee', backref='owner', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email
        }


class Employee(db.Model):
    __tablename__ = 'employees'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(100), nullable=False)
    hr_status = db.Column(db.String(50), default='Active')
    
    # Foreign Key pointing to the User who owns this employee record
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationship: One Employee has Many AuditAlerts
    alerts = db.relationship('AuditAlert', backref='employee', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'hr_status': self.hr_status,
            'user_id': self.user_id,
            'open_alerts_count': len([a for a in self.alerts if a.status != 'Dismissed'])
        }


class AuditAlert(db.Model):
    __tablename__ = 'audit_alerts'

    id = db.Column(db.Integer, primary_key=True)
    carrier_name = db.Column(db.String(100), nullable=False) # e.g. Blue Cross
    carrier_status = db.Column(db.String(50), nullable=False) # e.g. Dropped / Terminated
    status = db.Column(db.String(50), default='Open') # Open, Investigating, Resolved, Dismissed
    notes = db.Column(db.String(255), default='')

    # Foreign Key pointing to the Employee this alert belongs to
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': self.employee.name if self.employee else 'Unknown',
            'carrier_name': self.carrier_name,
            'carrier_status': self.carrier_status,
            'status': self.status,
            'notes': self.notes
        }