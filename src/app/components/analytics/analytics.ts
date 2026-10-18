import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class AnalyticsComponent implements OnInit {
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
    if (isPlatformBrowser(this.pid)) {
      this.loadStats();
      this.loadAdvanced();
    }
  }

  loadStats() {
    const t = localStorage.getItem('access_token');
    if (!t) { this.router.navigate(['/login']); return; }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${t}`);
    this.http.get('http://localhost:5000/api/dashboard/advanced-stats', { headers }).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.renderBar('topClientsChart', data.topClients.labels, data.topClients.values, 'Shipments', '#C9A84C');
          this.renderHorizontal('topRoutesChart', data.topRoutes.labels, data.topRoutes.values, 'Shipments', '#22c55e');
        }, 100);
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadAdvanced() {
    const t = localStorage.getItem('access_token');
    if (!t) return;
    const h = { headers: { Authorization: `Bearer ${t}` } };
    this.http.get('http://localhost:5000/api/dashboard/revenue', h).subscribe((d: any) => {
      this.renderBar('revenueChart', d.months, d.revenueByMonth, 'Revenue', '#C9A84C');
      const e1 = document.getElementById('revenueKpi'); if (e1) e1.textContent = '$' + (d.totalInvoiced / 1000).toFixed(1) + 'K';
      const e2 = document.getElementById('paidKpi'); if (e2) e2.textContent = '$' + (d.totalPaid / 1000).toFixed(1) + 'K';
      const e3 = document.getElementById('outstandingKpi'); if (e3) e3.textContent = '$' + (d.outstanding / 1000).toFixed(1) + 'K';
    });
    this.http.get('http://localhost:5000/api/dashboard/carrier-performance', h).subscribe((d: any) => {
      this.renderBar('carrierChart', d.map((x: any) => x.carrier), d.map((x: any) => x.shipments), 'Shipments', '#1a3a6a');
    });
    this.http.get('http://localhost:5000/api/dashboard/profitability', h).subscribe((d: any) => {
      this.renderBar('profitChart', d.map((x: any) => x.client), d.map((x: any) => x.revenue), 'Revenue', '#22c55e');
    });
    this.http.get('http://localhost:5000/api/dashboard/heatmap', h).subscribe((d: any) => {
      const sorted = d.sort((a: any, b: any) => b.count - a.count).slice(0, 10);
      this.renderHorizontal('heatmapChart', sorted.map((x: any) => x.city), sorted.map((x: any) => x.count), 'Shipments', '#a855f7');
    });
  }

  renderBar(id: string, labels: string[], values: number[], label: string, color: string) {
    const ctx = document.getElementById(id) as HTMLCanvasElement;
    if (!ctx) return;
    const ex = Chart.getChart(id); if (ex) ex.destroy();
    new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label, data: values, backgroundColor: color, borderRadius: 8 }] },
      options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } } }
    });
  }

  renderHorizontal(id: string, labels: string[], values: number[], label: string, color: string) {
    const ctx = document.getElementById(id) as HTMLCanvasElement;
    if (!ctx) return;
    const ex = Chart.getChart(id); if (ex) ex.destroy();
    new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label, data: values, backgroundColor: color, borderRadius: 8 }] },
      options: { indexAxis: 'y', responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } } }
    });
  }

  toggleTheme() { document.body.classList.toggle('light-theme'); }
  logout() { localStorage.removeItem('access_token'); this.router.navigate(['/login']); }
}