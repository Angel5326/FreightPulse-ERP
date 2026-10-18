import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ShipmentService } from '../../services/shipment.services';
import { ToastrService } from 'ngx-toastr';
import { PaymentModalComponent } from '../payment-modal/payment-modal.component';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaymentModalComponent],
  templateUrl: './invoices.html',
  styleUrls: ['./invoices.css']
})
export class InvoicesComponent implements OnInit {
  invoices: any[] = [];
  isLoading = true;
  filterStatus = 'All';
  selectedInvoice: any = null;

  constructor(
    private svc: ShipmentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private pid: Object
  ) {}

  get isAdmin(): boolean {
    if (!isPlatformBrowser(this.pid)) return false;
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.role === 'admin';
  }

  ngOnInit() {
    if (isPlatformBrowser(this.pid)) this.load();
  }

  load() {
    const t = localStorage.getItem('access_token');
    if (!t) { this.router.navigate(['/login']); return; }
    this.isLoading = true;
    this.svc.getInvoices(t, this.filterStatus === 'All' ? '' : this.filterStatus).subscribe({
      next: (d: any) => { this.invoices = d; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; }
    });
  }

  openPayment(inv: any) { this.selectedInvoice = { ...inv }; }

  markPaid(id: number) {
    const t = localStorage.getItem('access_token')!;
    this.svc.markPaid(id, t).subscribe(() => { this.toastr.success('Marked as Paid'); this.load(); });
  }

  del(id: number) {
    if (!confirm('Delete this invoice?')) return;
    const t = localStorage.getItem('access_token')!;
    this.svc.deleteInvoice(id, t).subscribe(() => { this.toastr.success('Deleted'); this.load(); });
  }

  toggleTheme() { document.body.classList.toggle('light-theme'); }
  logout() { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
}