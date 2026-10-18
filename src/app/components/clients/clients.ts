import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ShipmentService } from '../../services/shipment.services';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clients.html',
  styleUrls: ['./clients.css']
})
export class ClientsComponent implements OnInit {
  clients: any[] = [];
  isLoading = true;
  searchQ = '';
  showModal = false;
  editing: any = { company_name: '', contact_person: '', email: '', phone: '', address: '', city: '', country: '', tax_id: '', credit_limit: 50000 };

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
    this.svc.getClients(t, this.searchQ).subscribe({
      next: (d: any) => { this.clients = d; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; }
    });
  }

  openAdd() {
    this.editing = { company_name: '', contact_person: '', email: '', phone: '', address: '', city: '', country: '', tax_id: '', credit_limit: 50000 };
    this.showModal = true;
  }

  openEdit(c: any) { this.editing = { ...c }; this.showModal = true; }
  close() { this.showModal = false; }

  save() {
    const t = localStorage.getItem('access_token')!;
    if (!this.editing.company_name) { this.toastr.warning('Company name required'); return; }
    if (this.editing.id) {
      this.svc.updateClient(this.editing.id, this.editing, t).subscribe({
        next: () => { this.toastr.success('Client updated'); this.close(); this.load(); }
      });
    } else {
      this.svc.createClient(this.editing, t).subscribe({
        next: () => { this.toastr.success('Client added'); this.close(); this.load(); }
      });
    }
  }

  del(id: number) {
    if (!confirm('Delete this client?')) return;
    const t = localStorage.getItem('access_token')!;
    this.svc.deleteClient(id, t).subscribe(() => { this.toastr.success('Deleted'); this.load(); });
  }

  toggleTheme() { document.body.classList.toggle('light-theme'); }
  logout() { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
}