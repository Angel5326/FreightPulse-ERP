import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';   // ✅ REQUIRED for ngIf, ngFor
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ShipmentService } from '../../services/shipment.services';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [CommonModule, RouterModule],   // ✅ ADD CommonModule here
  templateUrl: './shipment-list.html',
  styleUrls: ['./shipment-list.css']
})
export class ShipmentListComponent implements OnInit {
  shipments: any[] = [];
  isLoading = true;

  constructor(
    private shipmentService: ShipmentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadShipments();
    }
  }

  loadShipments() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.shipmentService.getShipments(token).subscribe({
      next: (data: any) => {
        this.shipments = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading shipments:', err);
        this.isLoading = false;
        if (err.status === 401) {
          localStorage.removeItem('access_token');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // ✅ ADD THIS METHOD (needed for status dropdown)
  updateStatus(shipmentId: number, event: any) {
    const newStatus = event.target.value;
    const token = localStorage.getItem('access_token');
    
    if (!token) return;

    this.shipmentService.updateShipment(shipmentId, newStatus, token).subscribe({
      next: () => {
        const shipment = this.shipments.find(s => s.id === shipmentId);
        if (shipment) {
          shipment.status = newStatus;
        }
        this.cdr.detectChanges();
        console.log(`✅ Shipment ${shipmentId} updated to ${newStatus}`);
      },
      error: (err) => {
        console.error('❌ Error updating status:', err);
        alert('Failed to update status. Please try again.');
      }
    });
  }

  // ✅ ADD THIS METHOD (needed for delete button)
  deleteShipment(id: number) {
    if (!confirm('Are you sure you want to delete this shipment?')) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) return;

    this.shipmentService.deleteShipment(id, token).subscribe({
      next: () => {
        this.shipments = this.shipments.filter(s => s.id !== id);
        this.cdr.detectChanges();
        console.log(`🗑️ Shipment ${id} deleted`);
      },
      error: (err) => {
        console.error('❌ Error deleting shipment:', err);
        alert('Failed to delete shipment.');
      }
    });
  }
}