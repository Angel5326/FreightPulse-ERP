import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './activity-log.html',
  styleUrls: ['./activity-log.css']
})
export class ActivityLogComponent implements OnInit {
  logs: any[] = [];
  isLoading = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private pid: Object
  ) {}

  get isAdmin(): boolean {
    if (!isPlatformBrowser(this.pid)) return false;
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.role === 'admin';
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.pid)) this.loadLogs();
  }

  loadLogs() {
    const token = localStorage.getItem('access_token');
    if (!token) { this.router.navigate(['/login']); return; }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('http://localhost:5000/api/activity-logs', { headers }).subscribe({
      next: (data: any) => {
        this.logs = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  toggleTheme() { document.body.classList.toggle('light-theme'); }
  logout() { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
}