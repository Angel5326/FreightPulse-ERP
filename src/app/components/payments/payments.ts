import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ShipmentService } from '../../services/shipment.services';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payments.html',
  styleUrls: ['./payments.css']
})
export class PaymentsComponent implements OnInit {
  payments: any[] = [];
  isLoading = true;

  constructor(
    private svc: ShipmentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
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
    this.svc.getAllPayments(t).subscribe({
      next: (d: any) => { this.payments = d; this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  toggleTheme() { document.body.classList.toggle('light-theme'); }
  logout() { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
}