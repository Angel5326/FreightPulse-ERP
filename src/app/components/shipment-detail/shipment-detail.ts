import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ShipmentService } from '../../services/shipment.services';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-shipment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './shipment-detail.html',
  styleUrls: ['./shipment-detail.css']
})
export class ShipmentDetailComponent implements OnInit {
  shipment: any = null;
  isLoading = true;
  activeTab = 'items';
  documents: any[] = [];
  newItem: any = { description: '', quantity: 1, weight_kg: 0, declared_value: 0, hs_code: '', package_type: 'Cartons' };
  newEvent: any = { status: 'In Transit', location: '', notes: '' };
  delayRisk: any = null;
  showInvoiceModal = false;
  invoiceForm: any = { amount: 0, tax_rate: 0.18, notes: '' };
  uploadFileType = 'Bill of Lading';
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private svc: ShipmentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private pid: Object
  ) {}

  // ✅ isAdmin getter INSIDE the class
  get isAdmin(): boolean {
    if (!isPlatformBrowser(this.pid)) return false;
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.role === 'admin';
  }

  ngOnInit() {
    if (isPlatformBrowser(this.pid)) {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.load(id);
      this.loadRisk(id);
      this.loadDocuments();
    }
  }

  load(id: number) {
    const t = localStorage.getItem('access_token');
    if (!t) { this.router.navigate(['/login']); return; }
    this.svc.getShipment(id, t).subscribe({
      next: (d: any) => { this.shipment = d; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  loadRisk(id: number) {
    const t = localStorage.getItem('access_token');
    if (!t) return;
    this.http.get(`http://localhost:5000/api/shipments/${id}/delay-risk`,
      { headers: new HttpHeaders().set('Authorization', `Bearer ${t}`) })
      .subscribe({ next: (d: any) => this.delayRisk = d });
  }

  loadDocuments() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const t = localStorage.getItem('access_token');
    if (!t) return;
    this.svc.getDocuments(id, t).subscribe({
      next: (d: any) => { this.documents = d; this.cdr.detectChanges(); }
    });
  }

  addItem() {
    const t = localStorage.getItem('access_token')!;
    if (!this.newItem.description) { this.toastr.warning('Description required'); return; }
    this.svc.addItem(this.shipment.id, this.newItem, t).subscribe({
      next: () => {
        this.toastr.success('Item added');
        this.newItem = { description: '', quantity: 1, weight_kg: 0, declared_value: 0, hs_code: '', package_type: 'Cartons' };
        this.load(this.shipment.id);
      }
    });
  }

  delItem(id: number) {
    if (!confirm('Remove item?')) return;
    const t = localStorage.getItem('access_token')!;
    this.svc.deleteItem(id, t).subscribe(() => { this.toastr.success('Removed'); this.load(this.shipment.id); });
  }

  addEvent() {
    const t = localStorage.getItem('access_token')!;
    this.svc.addEvent(this.shipment.id, this.newEvent, t).subscribe({
      next: () => {
        this.toastr.success('Event added');
        this.newEvent = { status: 'In Transit', location: '', notes: '' };
        this.load(this.shipment.id);
      }
    });
  }

  onFileSelected(e: any) { this.selectedFile = e.target.files[0] || null; }

  uploadDoc() {
    if (!this.selectedFile) { this.toastr.warning('Choose a file'); return; }
    const t = localStorage.getItem('access_token')!;
    this.svc.uploadDocument(this.shipment.id, this.selectedFile, this.uploadFileType, t).subscribe({
      next: () => { this.toastr.success('Uploaded'); this.selectedFile = null; this.loadDocuments(); },
      error: () => this.toastr.error('Upload failed')
    });
  }

  downloadDoc(d: any) {
    const t = localStorage.getItem('access_token')!;
    this.svc.downloadDocument(d.id, t).subscribe((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = d.original_name; a.click();
      URL.revokeObjectURL(url);
    });
  }

  deleteDoc(id: number) {
    if (!confirm('Delete this document?')) return;
    const t = localStorage.getItem('access_token')!;
    this.svc.deleteDocument(id, t).subscribe(() => { this.toastr.success('Deleted'); this.loadDocuments(); });
  }

  openInvoice() {
    this.invoiceForm.amount = this.shipment.total_value || 0;
    this.showInvoiceModal = true;
  }

  createInvoice() {
    const t = localStorage.getItem('access_token')!;
    this.svc.createInvoice({ shipment_id: this.shipment.id, ...this.invoiceForm }, t).subscribe({
      next: (r: any) => { this.toastr.success(`Invoice ${r.invoice_number} created`); this.showInvoiceModal = false; }
    });
  }

  toggleTheme() { document.body.classList.toggle('light-theme'); }
  logout() { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
}