import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  stats: any = { total: 0, inTransit: 0, delivered: 0 };
  isLoading = true;
  trendData: any[] = [];
  private trendChart: Chart | undefined;
  private map: any;

  constructor(
    private http: HttpClient,
    private router: Router,
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

  ngOnInit(): void {
    if (isPlatformBrowser(this.pid)) this.fetchStats();
  }

  fetchStats() {
    const token = localStorage.getItem('access_token');
    if (!token) { this.router.navigate(['/login']); return; }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('http://localhost:5000/api/dashboard/stats', { headers })
      .subscribe({
        next: (data: any) => {
          this.stats = {
            total: data.total ?? 0,
            inTransit: data.inTransit ?? 0,
            delivered: data.delivered ?? 0,
            labels: data.labels ?? [],
            values: data.values ?? []
          };
          this.isLoading = false;
          this.cdr.detectChanges();
          this.renderChart(this.stats.labels, this.stats.values);
          this.loadTrends();
          this.loadMap();
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 401) { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
        }
      });
  }

  renderChart(labels: string[], values: number[]) {
    if (!isPlatformBrowser(this.pid)) return;
    const ctx = document.getElementById('shipmentChart') as HTMLCanvasElement;
    if (ctx) {
      const ex = Chart.getChart('shipmentChart'); if (ex) ex.destroy();
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            label: 'Shipments by Status', data: values,
            backgroundColor: ['#94a3b8', '#C9A84C', '#1a3a6a', '#22c55e'],
            borderColor: '#0a1628', borderWidth: 2
          }]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: '#cbd5e1' } } } }
      });
    }
  }

  loadTrends() {
    if (!isPlatformBrowser(this.pid)) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('http://localhost:5000/api/dashboard/trends', { headers }).subscribe({
      next: (data: any) => {
        this.trendData = data;
        const labels = data.map((d: any) => d.date);
        const values = data.map((d: any) => d.count);
        this.renderLineChart(labels, values);
      }
    });
  }

  renderLineChart(labels: string[], values: number[]) {
    if (!isPlatformBrowser(this.pid)) return;
    const ctx = document.getElementById('trendChart') as HTMLCanvasElement;
    if (ctx) {
      const ex = Chart.getChart('trendChart'); if (ex) ex.destroy();
      new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Shipments per Day', data: values,
            borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)',
            tension: 0.4, fill: true,
            pointBackgroundColor: '#C9A84C', pointBorderColor: '#0a1628', pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
          }
        }
      });
    }
  }

  loadMap() {
    if (!isPlatformBrowser(this.pid)) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('http://localhost:5000/api/shipments/', { headers }).subscribe({
      next: (data: any) => {
        import('leaflet').then((L: any) => this.renderMap(L, data)).catch(() => {});
      }
    });
  }

  renderMap(L: any, shipments: any[]) {
    if (!isPlatformBrowser(this.pid)) return;
    setTimeout(() => {
      const c = document.getElementById('worldMap');
      if (!c) return;
      if (this.map) { this.map.remove(); this.map = undefined; }
      this.map = L.map('worldMap').setView([20, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(this.map);
      const valid = shipments.filter((s: any) => s.latitude && s.longitude);
      if (valid.length === 0) return;
      const icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
      });
      const markers: any[] = [];
      valid.forEach((s: any) => {
        const m = L.marker([s.latitude, s.longitude], { icon })
          .addTo(this.map)
          .bindPopup(`<strong>${s.client_name || 'Unknown'}</strong><br>${s.origin} → ${s.destination}<br>Status: ${s.status}`);
        markers.push(m);
      });
      if (markers.length > 0) {
        const grp = L.featureGroup(markers);
        this.map.fitBounds(grp.getBounds().pad(0.2));
      }
    }, 500);
  }

  seedData() {
    const token = localStorage.getItem('access_token');
    if (!token) { this.toastr.warning('Login first'); return; }
    this.http.post('http://localhost:5000/api/seed', {}, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    }).subscribe({
      next: (r: any) => { this.toastr.success(r.msg, 'Seeded'); this.fetchStats(); },
      error: () => this.toastr.error('Failed to seed', 'Error')
    });
  }

  clearData() {
    if (!confirm('Delete ALL shipments?')) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    this.http.delete('http://localhost:5000/api/clear', {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    }).subscribe({
      next: (r: any) => { this.toastr.success(r.msg, 'Cleared'); this.fetchStats(); },
      error: () => this.toastr.error('Failed to clear', 'Error')
    });
  }

  toggleTheme() { document.body.classList.toggle('light-theme'); }
  logout() { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
}