import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ShipmentService } from '../../services/shipment.services';
import { ToastrService } from 'ngx-toastr';
import { ShipmentModalComponent } from '../shipment-modal/shipment-modal.component';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShipmentModalComponent],
  templateUrl: './shipment-list.html',
  styleUrls: ['./shipment-list.css']
})
export class ShipmentListComponent implements OnInit {
  shipments: any[] = [];
  isLoading = true;
  searchTerm: string = '';
  filterStatus: string = 'All';
  selectedShipment: any = null;

  get filteredShipments() {
    return this.shipments.filter(ship => {
      const matchesSearch =
        ship.shipment_number?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        ship.client_name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus =
        this.filterStatus === 'All' || ship.status === this.filterStatus;
      return matchesSearch && matchesStatus;
    });
  }

  constructor(
    private shipmentService: ShipmentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadShipments();
    } else {
      this.isLoading = false;
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
      error: (err: any) => {
        console.error('❌ Error loading shipments:', err);
        this.isLoading = false;
        if (err.status === 401) {
          localStorage.removeItem('access_token');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  // ========== MODAL METHODS ==========
  openModal(shipment: any) {
    this.selectedShipment = { ...shipment };
  }

  closeModal() {
    this.selectedShipment = null;
  }

  onShipmentUpdated(updatedShipment: any) {
    const index = this.shipments.findIndex(s => s.id === updatedShipment.id);
    if (index !== -1) {
      this.shipments[index] = updatedShipment;
    }
    this.cdr.detectChanges();
    this.toastr.success('Shipment updated successfully!', 'Success');
  }

  // ========== STATUS UPDATE ==========
  updateStatus(shipmentId: number, event: any) {
    const newStatus = event.target.value;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    this.shipmentService.updateShipment(shipmentId, newStatus, token).subscribe({
      next: () => {
        const shipment = this.shipments.find(s => s.id === shipmentId);
        if (shipment) shipment.status = newStatus;
        this.cdr.detectChanges();
        this.toastr.success(`Status updated to ${newStatus}`, 'Success');
      },
      error: (err: any) => {
        this.toastr.error('Failed to update status', 'Error');
      }
    });
  }

  // ========== DELETE ==========
  deleteShipment(id: number) {
    if (!confirm('Are you sure you want to delete this shipment?')) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    this.shipmentService.deleteShipment(id, token).subscribe({
      next: () => {
        this.shipments = this.shipments.filter(s => s.id !== id);
        this.cdr.detectChanges();
        this.toastr.success('Shipment deleted!', 'Success');
      },
      error: (err: any) => {
        this.toastr.error('Failed to delete shipment', 'Error');
      }
    });
  }

  // ========== EXPORT ==========
  exportExcel() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.toastr.warning('Please login first', 'Warning');
      return;
    }

    this.shipmentService.exportExcel(token).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'FreightPulse_Shipments.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('Excel downloaded!', 'Success');
      },
      error: (err: any) => {
        this.toastr.error('Failed to export Excel', 'Error');
      }
    });
  }

  exportPdf() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.toastr.warning('Please login first', 'Warning');
      return;
    }

    this.shipmentService.exportPdf(token).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'FreightPulse_Report.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success('PDF downloaded!', 'Success');
      },
      error: (err: any) => {
        this.toastr.error('Failed to export PDF', 'Error');
      }
    });
  }

  // ========== THEME ==========
  toggleTheme() {
    document.body.classList.toggle('light-theme');
  }

  // ========== LOGOUT ==========
  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}