import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ShipmentService } from '../../services/shipment.services';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.css']
})
export class AdminPanelComponent implements OnInit {
  stats: any = {};
  users: any[] = [];
  orgs: any[] = [];
  isLoading = true;
  activeTab: 'overview' | 'users' | 'orgs' = 'overview';
  searchUser = '';

  constructor(
    private svc: ShipmentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private pid: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.pid)) this.load();
  }

  get isAdmin(): boolean {
    if (!isPlatformBrowser(this.pid)) return false;
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.role === 'admin';
  }

  get filteredUsers() {
    if (!this.searchUser) return this.users;
    const q = this.searchUser.toLowerCase();
    return this.users.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.organization?.toLowerCase().includes(q)
    );
  }

  load() {
    const t = localStorage.getItem('access_token');
    if (!t) { this.router.navigate(['/login']); return; }

    if (!this.isAdmin) {
      this.toastr.error('Admin access required', 'Access Denied');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.isLoading = true;
    this.svc.getAdminStats(t).subscribe({
      next: (d: any) => { this.stats = d; this.cdr.detectChanges(); }
    });
    this.svc.getAdminUsers(t).subscribe({
      next: (d: any) => { this.users = d; this.cdr.detectChanges(); },
      complete: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
    this.svc.getAdminOrgs(t).subscribe({
      next: (d: any) => { this.orgs = d; this.cdr.detectChanges(); }
    });
  }

  toggleUserActive(u: any) {
    const t = localStorage.getItem('access_token')!;
    this.svc.updateAdminUser(u.id, { is_active: !u.is_active }, t).subscribe({
      next: () => {
        this.toastr.success(`${u.username} ${!u.is_active ? 'activated' : 'disabled'}`, 'Success');
        this.load();
      },
      error: () => this.toastr.error('Failed to update', 'Error')
    });
  }

  changeRole(u: any, role: string) {
    const t = localStorage.getItem('access_token')!;
    this.svc.updateAdminUser(u.id, { role }, t).subscribe({
      next: () => { this.toastr.success(`Role changed to ${role}`, 'Success'); this.load(); }
    });
  }

  deleteUser(u: any) {
    if (!confirm(`Delete user "${u.username}"?`)) return;
    const t = localStorage.getItem('access_token')!;
    this.svc.deleteAdminUser(u.id, t).subscribe({
      next: () => { this.toastr.success('User deleted', 'Success'); this.load(); },
      error: (err) => this.toastr.error(err.error?.msg || 'Failed', 'Error')
    });
  }

  toggleOrgActive(o: any) {
    const t = localStorage.getItem('access_token')!;
    this.svc.updateAdminOrg(o.id, { is_active: !o.is_active }, t).subscribe({
      next: () => { this.toastr.success('Organization updated', 'Success'); this.load(); }
    });
  }

  changeOrgPlan(o: any, plan: string) {
    const t = localStorage.getItem('access_token')!;
    this.svc.updateAdminOrg(o.id, { plan }, t).subscribe({
      next: () => { this.toastr.success(`Plan changed to ${plan}`, 'Success'); this.load(); }
    });
  }

  toggleTheme() { document.body.classList.toggle('light-theme'); }
  logout() { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
}
