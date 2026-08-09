 
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Shipment, Client, db
from app.utils import generate_shipment_number

shipment_bp = Blueprint('shipment', __name__)

@shipment_bp.route('/', methods=['POST'])
@jwt_required()  # User must be logged in
def create_shipment():
    data = request.get_json()
    
    # For now, we'll create a dummy client if not provided
    client = Client.query.get(data.get('client_id'))
    if not client:
        # Create a fallback client (or you can modify to accept client name)
        client = Client(name=data.get('clientName', 'Default Client'))
        db.session.add(client)
        db.session.commit()

    shipment_number = data.get('shipmentNumber') or generate_shipment_number()

    shipment = Shipment(
        shipment_number=shipment_number,
        client_id=client.id,
        origin=data.get('origin'),
        destination=data.get('destination'),
        status='Confirmed',  # or Draft
        # We will add more fields later (carrier, weight, etc.)
    )
    db.session.add(shipment)
    db.session.commit()
    return jsonify({'msg': 'Shipment created', 'id': shipment.id}), 201

@shipment_bp.route('/', methods=['GET'])
@jwt_required()
def list_shipments():
    shipments = Shipment.query.all()
    return jsonify([{
        'id': s.id,
        'shipment_number': s.shipment_number,
        'origin': s.origin,
        'destination': s.destination,
        'status': s.status,
        'client': s.client.name
    } for s in shipments]), 200