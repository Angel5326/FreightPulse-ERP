from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required
from flask_sqlalchemy import SQLAlchemy
import bcrypt
from datetime import datetime
from faker import Faker
from sqlalchemy import func
import random

# ---------- APP INIT ----------
app = Flask(__name__)

# ✅ SINGLE CORS CONFIG – this handles everything
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.config['SECRET_KEY'] = 'freightpulse-2026-super-secret-key'
app.config['JWT_SECRET_KEY'] = 'freightpulse-jwt-secret-2026'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:BE5326@localhost/freight_db'  # ⚠️ Check this password
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
jwt = JWTManager(app)
fake = Faker()

# ---------- MODELS ----------
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Shipment(db.Model):
    __tablename__ = 'shipments'
    id = db.Column(db.Integer, primary_key=True)
    shipment_number = db.Column(db.String(20), unique=True, nullable=False)
    client_name = db.Column(db.String(100))
    origin = db.Column(db.String(100))
    destination = db.Column(db.String(100))
    status = db.Column(db.String(20), default='Draft')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

# ---------- CREATE TABLES ----------
with app.app_context():
    db.create_all()

# ---------- ROUTES ----------
@app.route('/')
def home():
    return "🚀 FreightPulse Backend is running!"

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'msg': 'Username and password required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'msg': 'Username already taken'}), 409
    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'msg': 'User created successfully!'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'msg': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        'data': {
            'access_token': access_token,
            'user': {'id': user.id, 'username': user.username, 'role': user.role}
        }
    }), 200

@app.route('/api/shipments/', methods=['GET'])
@jwt_required()
def list_shipments():
    shipments = Shipment.query.all()
    return jsonify([{
        'id': s.id,
        'shipment_number': s.shipment_number,
        'client_name': s.client_name,
        'origin': s.origin,
        'destination': s.destination,
        'status': s.status,
        'latitude': s.latitude,
        'longitude': s.longitude
    } for s in shipments]), 200

@app.route('/api/shipments/', methods=['POST'])
@jwt_required()
def create_shipment():
    data = request.get_json()
    shipment = Shipment(
        shipment_number=f"SHP-{datetime.now().year}-{random.randint(1000, 9999)}",
        client_name=data.get('clientName', 'Unknown'),
        origin=data.get('origin', ''),
        destination=data.get('destination', ''),
        status='Confirmed'
    )
    db.session.add(shipment)
    db.session.commit()
    return jsonify({'msg': 'Shipment saved!', 'id': shipment.id}), 201

# ✅ CORRECT PUT ENDPOINT – no manual OPTIONS handling, CORS handles it
@app.route('/api/shipments/<int:shipment_id>', methods=['PUT'])
@jwt_required()
def update_shipment(shipment_id):
    data = request.get_json()
    shipment = Shipment.query.get(shipment_id)
    if not shipment:
        return jsonify({'msg': 'Shipment not found'}), 404

    if 'client_name' in data:
        shipment.client_name = data['client_name']
    if 'origin' in data:
        shipment.origin = data['origin']
    if 'destination' in data:
        shipment.destination = data['destination']
    if 'status' in data:
        shipment.status = data['status']

    db.session.commit()
    return jsonify({
        'id': shipment.id,
        'shipment_number': shipment.shipment_number,
        'client_name': shipment.client_name,
        'origin': shipment.origin,
        'destination': shipment.destination,
        'status': shipment.status
    }), 200

@app.route('/api/shipments/<int:shipment_id>', methods=['DELETE'])
@jwt_required()
def delete_shipment(shipment_id):
    shipment = Shipment.query.get(shipment_id)
    if not shipment:
        return jsonify({'msg': 'Shipment not found'}), 404
    db.session.delete(shipment)
    db.session.commit()
    return jsonify({'msg': 'Shipment deleted'}), 200

@app.route('/api/dashboard/stats', methods=['GET'])
@jwt_required()
def dashboard_stats():
    total = Shipment.query.count()
    in_transit = Shipment.query.filter_by(status='In Transit').count()
    delivered = Shipment.query.filter_by(status='Delivered').count()
    confirmed = Shipment.query.filter_by(status='Confirmed').count()
    draft = Shipment.query.filter_by(status='Draft').count()
    return jsonify({
        'total': total,
        'inTransit': in_transit,
        'delivered': delivered,
        'labels': ['Draft', 'Confirmed', 'In Transit', 'Delivered'],
        'values': [draft, confirmed, in_transit, delivered]
    }), 200

@app.route('/api/dashboard/trends', methods=['GET'])
@jwt_required()
def shipment_trends():
    trends = db.session.query(
        func.date(Shipment.created_at).label('date'),
        func.count(Shipment.id).label('count')
    ).group_by(func.date(Shipment.created_at)).order_by(func.date(Shipment.created_at)).all()
    return jsonify([{'date': str(r.date), 'count': r.count} for r in trends]), 200

@app.route('/api/reports/excel', methods=['GET'])
@jwt_required()
def export_excel():
    from openpyxl import Workbook
    from io import BytesIO
    shipments = Shipment.query.all()
    wb = Workbook()
    ws = wb.active
    ws.title = "Shipments"
    headers = ['ID', 'Shipment #', 'Client', 'Origin', 'Destination', 'Status']
    ws.append(headers)
    for s in shipments:
        ws.append([s.id, s.shipment_number, s.client_name, s.origin, s.destination, s.status])
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        ws.column_dimensions[column].width = max_length + 2
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return send_file(
        output,
        as_attachment=True,
        download_name='FreightPulse_Shipments.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.route('/api/reports/pdf', methods=['GET'])
@jwt_required()
def export_pdf():
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from io import BytesIO
    shipments = Shipment.query.all()
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    elements = []
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#0a1628'), alignment=1, spaceAfter=12)
    title = Paragraph("FreightPulse - Shipment Report", title_style)
    elements.append(title)
    date_style = ParagraphStyle('DateStyle', parent=styles['Normal'], fontSize=10, textColor=colors.grey, alignment=1, spaceAfter=20)
    date_str = f"Generated on: {datetime.now().strftime('%B %d, %Y %H:%M')}"
    elements.append(Paragraph(date_str, date_style))
    elements.append(Spacer(1, 0.2 * inch))
    data = [['#', 'Shipment #', 'Client', 'Origin', 'Destination', 'Status']]
    for idx, s in enumerate(shipments, start=1):
        data.append([str(idx), s.shipment_number, s.client_name or 'N/A', s.origin or 'N/A', s.destination or 'N/A', s.status or 'Draft'])
    table = Table(data, colWidths=[0.5*inch, 1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch, 1.2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#C9A84C')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey])
    ]))
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name='FreightPulse_Report.pdf',
        mimetype='application/pdf'
    )

@app.route('/api/seed', methods=['POST', 'OPTIONS'])
@jwt_required()
def seed_data():
    if request.method == 'OPTIONS':
        return '', 200
    Shipment.query.delete()
    db.session.commit()
    statuses = ['Draft', 'Confirmed', 'In Transit', 'Delivered']
    cities = [
        ("Shanghai", 31.2304, 121.4737),
        ("New York", 40.7128, -74.0060),
        ("London", 51.5074, -0.1278),
        ("Tokyo", 35.6762, 139.6503),
        ("Mumbai", 19.0760, 72.8777),
        ("Beijing", 39.9042, 116.4074),
        ("Los Angeles", 34.0522, -118.2437),
        ("Singapore", 1.3521, 103.8198),
        ("Dubai", 25.2048, 55.2708),
        ("Sydney", -33.8688, 151.2093),
        ("Moscow", 55.7558, 37.6173),
        ("Cape Town", -33.9249, 18.4241),
        ("Rio de Janeiro", -22.9068, -43.1729),
        ("Toronto", 43.6532, -79.3832),
    ]
    for _ in range(30):
        origin = random.choice(cities)
        destination = random.choice(cities)
        shipment = Shipment(
            shipment_number=f"SHP-{fake.year()}-{fake.random_number(digits=4)}",
            client_name=fake.company(),
            origin=origin[0],
            destination=destination[0],
            status=random.choice(statuses),
            latitude=origin[1],
            longitude=origin[2]
        )
        db.session.add(shipment)
    db.session.commit()
    return jsonify({'msg': '30 shipments seeded with coordinates!'}), 201

@app.route('/api/clear', methods=['DELETE'])
@jwt_required()
def clear_shipments():
    Shipment.query.delete()
    db.session.commit()
    return jsonify({'msg': 'All shipments deleted!'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)