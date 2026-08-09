import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShipmentService } from '../../services/shipment.services';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-shipment-modal',
  standalone: true,   // ✅ MUST be true
  imports: [CommonModule, FormsModule],
  templateUrl: './shipment-modal.component.html',
  styleUrls: ['./shipment-modal.component.css']
})
export class ShipmentModalComponent {
  @Input() shipment: any = {};
  @Output() closeModal = new EventEmitter<void>();
  @Output() shipmentUpdated = new EventEmitter<any>();

  constructor(
    private shipmentService: ShipmentService,
    private toastr: ToastrService
  ) {}

  close() {
    this.closeModal.emit();
  }

save() {
  console.log('🔵 save() called');
  const token = localStorage.getItem('access_token');
  if (!token) {
    this.toastr.warning('Please login first', 'Warning');
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
    console.log('✅ Save success:', data);
    this.toastr.success('Shipment updated successfully!', 'Success');
    this.shipmentUpdated.emit(this.shipment);
    this.close();
  })
  .catch(err => {
    console.error('❌ Save error:', err);
    this.toastr.error('Failed to update shipment', 'Error');
  });
}

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
}