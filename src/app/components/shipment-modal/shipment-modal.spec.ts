import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShipmentModal } from './shipment-modal';

describe('ShipmentModal', () => {
  let component: ShipmentModal;
  let fixture: ComponentFixture<ShipmentModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipmentModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipmentModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  testSave() {
  console.log('🧪 Test save called');
  const token = localStorage.getItem('access_token');
  console.log('🔑 Token:', token);
  console.log('📦 Shipment data:', this.shipment);
  
  if (!token) {
    this.toastr.warning('No token', 'Warning');
    return;
  }

  fetch(`http://localhost:5000/api/shipments/${this.shipment.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(this.shipment)
  })
  .then(res => res.json())
  .then(data => {
    console.log('✅ Test save success:', data);
    this.toastr.success('Test save worked!', 'Success');
    this.shipmentUpdated.emit(this.shipment);
    this.close();
  })
  .catch(err => {
    console.error('❌ Test save error:', err);
    this.toastr.error('Test save failed', 'Error');
  });
}
});
