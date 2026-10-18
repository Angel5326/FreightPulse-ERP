import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ShipmentService } from '../../services/shipment.services';
import { RealtimeService } from '../../services/realtime.service';
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
  searchTerm = '';
  filterStatus = 'All';
  selectedShipment: any = null;
  selectedIds = new Set<number>();
  sortColumn = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Advanced filters
  showAdvanced = false;
  filterFromDate = '';
  filterToDate = '';
  filterMinValue: any = null;
  filterMaxValue: any = null;
  filterOrigin = '';
  filterDestination = '';
  filterCarrier = '';

  constructor(
    private shipmentService: ShipmentService,
    private realtime: RealtimeService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private pid: Object
  ) {}

  // ✅ isAdmin getter INSIDE the class
  get isAdmin(): boolean {
    if (!isPlatformBrowser(this.pid)) return false;
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.role === 'admin';
  }

  get filteredShipments() {
    let arr = this.shipments.filter(ship => {
      const matchesSearch =
        ship.shipment_number?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        ship.client_name?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesStatus = this.filterStatus === 'All' || ship.status === this.filterStatus;
      return matchesSearch && matchesStatus;
    });
    arr.sort((a, b) => {
      const va = a[this.sortColumn];
      const vb = b[this.sortColumn];
      if (typeof va === 'string') {
        return this.sortDirection === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return this.sortDirection === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.pid)) {
      this.loadShipments();
      this.realtime.onShipmentUpdate().subscribe((u: any) => {
        const s = this.shipments.find(x => x.id === u.id);
        if (s) {
          s.status = u.status;
          this.toastr.info(`Shipment #${u.id} updated live!`, 'Real-Time');
          this.cdr.detectChanges();
        }
      });
      this.realtime.onShipmentCreated().subscribe((u: any) => {
        this.toastr.info(`New shipment: ${u.shipment_number}`, 'Real-Time');
        this.loadShipments();
      });
      this.realtime.onShipmentDeleted().subscribe((u: any) => {
        this.shipments = this.shipments.filter(s => s.id !== u.id);
        this.cdr.detectChanges();
      });
    }
  }

  loadShipments() {
    const token = localStorage.getItem('access_token');
    if (!token) { this.router.navigate(['/login']); return; }
    this.isLoading = true;
    this.shipmentService.getShipments(token).subscribe({
      next: (data: any) => {
        this.shipments = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 401) {
          localStorage.removeItem('access_token');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  applyFilters() {
    const t = localStorage.getItem('access_token');
    if (!t) return;
    const params: any = {};
    if (this.filterStatus && this.filterStatus !== 'All') params.status = this.filterStatus;
    if (this.searchTerm) params.q = this.searchTerm;
    if (this.filterFromDate) params.from_date = this.filterFromDate;
    if (this.filterToDate) params.to_date = this.filterToDate;
    if (this.filterMinValue != null) params.min_value = this.filterMinValue;
    if (this.filterMaxValue != null) params.max_value = this.filterMaxValue;
    if (this.filterOrigin) params.origin = this.filterOrigin;
    if (this.filterDestination) params.destination = this.filterDestination;
    if (this.filterCarrier) params.carrier = this.filterCarrier;

    this.isLoading = true;
    this.shipmentService.getShipments(t, params).subscribe({
      next: (data: any) => {
        this.shipments = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  clearFilters() {
    this.showAdvanced = false;
    this.searchTerm = '';
    this.filterStatus = 'All';
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterMinValue = null;
    this.filterMaxValue = null;
    this.filterOrigin = '';
    this.filterDestination = '';
    this.filterCarrier = '';
    this.loadShipments();
  }

  sortBy(col: string) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
  }

  toggleSelect(id: number, event: any) {
    if (event.target.checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  toggleAll(event: any) {
    if (event.target.checked) this.filteredShipments.forEach(s => this.selectedIds.add(s.id));
    else this.selectedIds.clear();
  }

  bulkDelete() {
    if (this.selectedIds.size === 0) return;
    if (!confirm(`Delete ${this.selectedIds.size} shipments?`)) return;
    const token = localStorage.getItem('access_token')!;
    const ids = Array.from(this.selectedIds);
    let done = 0;
    ids.forEach(id => {
      this.shipmentService.deleteShipment(id, token).subscribe({
        next: () => {
          done++;
          if (done === ids.length) {
            this.shipments = this.shipments.filter(s => !this.selectedIds.has(s.id));
            this.selectedIds.clear();
            this.toastr.success(`${ids.length} shipments deleted!`, 'Bulk Delete');
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  openModal(s: any) { this.selectedShipment = { ...s }; }
  closeModal() { this.selectedShipment = null; }
  onShipmentUpdated(u: any) {
    const i = this.shipments.findIndex(s => s.id === u.id);
    if (i !== -1) this.shipments[i] = u;
    this.cdr.detectChanges();
  }

  updateStatus(id: number, event: any) {
    const newStatus = event.target.value;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    this.shipmentService.updateShipment(id, { status: newStatus }, token).subscribe({
      next: () => {
        const s = this.shipments.find(x => x.id === id);
        if (s) s.status = newStatus;
        this.toastr.success(`Status: ${newStatus}`, 'Success');
        this.cdr.detectChanges();
      },
      error: () => this.toastr.error('Failed to update', 'Error')
    });
  }

  deleteShipment(id: number) {
    if (!confirm('Delete this shipment?')) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    this.shipmentService.deleteShipment(id, token).subscribe({
      next: () => {
        this.shipments = this.shipments.filter(s => s.id !== id);
        this.toastr.success('Deleted!', 'Success');
        this.cdr.detectChanges();
      }
    });
  }

  exportExcel() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    this.shipmentService.exportExcel(token).subscribe((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'Shipments.xlsx'; a.click();
      URL.revokeObjectURL(url);
      this.toastr.success('Excel downloaded!', 'Success');
    });
  }

  exportPdf() {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    this.shipmentService.exportPdf(token).subscribe((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'Report.pdf'; a.click();
      URL.revokeObjectURL(url);
      this.toastr.success('PDF downloaded!', 'Success');
    });
  }

  toggleTheme() { document.body.classList.toggle('light-theme'); }
  logout() { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
}