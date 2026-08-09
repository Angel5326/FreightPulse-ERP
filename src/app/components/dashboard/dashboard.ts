import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
Chart.register(...registerables);

// ✅ Only import Leaflet dynamically (not at the top)
// import * as L from 'leaflet'; // ❌ Remove this line

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
  private map: any; // Use 'any' to avoid Leaflet type issues

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchStats();
    }
  }

  // ========== MAIN STATS ==========
  fetchStats() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

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
          this.loadMap();  // 👈 Load the map
        },
        error: (err) => {
          console.error('Error loading stats:', err);
          this.isLoading = false;
          if (err.status === 401) {
            localStorage.removeItem('access_token');
            this.router.navigate(['/login']);
          }
        }
      });
  }

  // ========== DOUGHNUT CHART ==========
  renderChart(labels: string[], values: number[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    const ctx = document.getElementById('shipmentChart') as HTMLCanvasElement;
    if (ctx) {
      const existing = Chart.getChart('shipmentChart');
      if (existing) existing.destroy();
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            label: 'Shipments by Status',
            data: values,
            backgroundColor: ['#94a3b8', '#C9A84C', '#1a3a6a', '#22c55e'],
            borderColor: '#0a1628',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#cbd5e1' } }
          }
        }
      });
    }
  }

  // ========== LINE CHART (TRENDS) ==========
  loadTrends() {
    if (!isPlatformBrowser(this.platformId)) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('http://localhost:5000/api/dashboard/trends', { headers })
      .subscribe({
        next: (data: any) => {
          this.trendData = data;
          const labels = data.map((d: any) => d.date);
          const values = data.map((d: any) => d.count);
          this.renderLineChart(labels, values);
        },
        error: (err) => console.error('Error loading trends:', err)
      });
  }

  renderLineChart(labels: string[], values: number[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    const ctx = document.getElementById('trendChart') as HTMLCanvasElement;
    if (ctx) {
      const existing = Chart.getChart('trendChart');
      if (existing) existing.destroy();

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Shipments per Day',
            data: values,
            borderColor: '#C9A84C',
            backgroundColor: 'rgba(201, 168, 76, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#C9A84C',
            pointBorderColor: '#0a1628',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { size: 12 } }
            }
          },
          scales: {
            x: {
              ticks: { color: '#94a3b8', maxTicksLimit: 10 },
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
              ticks: { color: '#94a3b8', stepSize: 1 },
              grid: { color: 'rgba(255,255,255,0.05)' },
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  // ========== WORLD MAP ==========
  loadMap() {
    // ✅ Only run in browser
    if (!isPlatformBrowser(this.platformId)) {
      console.log('🖥️ Skipping map on server');
      return;
    }

    console.log('🌍 Loading map...');
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get('http://localhost:5000/api/shipments/', { headers })
      .subscribe({
        next: (data: any) => {
          console.log('📦 Shipments for map:', data);
          // ✅ Dynamically import Leaflet ONLY in browser
          import('leaflet').then(L => {
            this.renderMap(L, data);
          }).catch(err => {
            console.error('❌ Failed to load Leaflet:', err);
          });
        },
        error: (err) => {
          console.error('❌ Error loading shipments for map:', err);
        }
      });
  }

  renderMap(L: any, shipments: any[]) {
    // ✅ Only run in browser
    if (!isPlatformBrowser(this.platformId)) return;

    // Wait for the DOM to render the map container
    setTimeout(() => {
      const mapContainer = document.getElementById('worldMap');
      if (!mapContainer) {
        console.error('❌ Map container #worldMap not found!');
        return;
      }

      // Destroy existing map if it exists
      if (this.map) {
        this.map.remove();
        this.map = undefined;
      }

      // Create the map
      this.map = L.map('worldMap').setView([20, 0], 2);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Filter shipments with coordinates
      const validShipments = shipments.filter((s: any) => s.latitude && s.longitude);
      console.log('📍 Valid shipments with coordinates:', validShipments.length);

      if (validShipments.length === 0) {
        console.warn('⚠️ No shipments with coordinates found. Seed data with coordinates first.');
        L.marker([20, 0], {
          icon: L.divIcon({
            html: '<div style="background:rgba(201,168,76,0.9);padding:10px;border-radius:8px;color:#0a1628;font-weight:bold;">No shipments with coordinates.<br>Click "Seed Random Data"</div>',
            className: 'no-data-marker',
            iconSize: [200, 50]
          })
        }).addTo(this.map);
        return;
      }

      // Custom icon
      const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Add markers
      const markers: any[] = [];
      validShipments.forEach((ship: any) => {
        const marker = L.marker([ship.latitude, ship.longitude], { icon: customIcon })
          .addTo(this.map)
          .bindPopup(`
            <strong>${ship.client_name || 'Unknown'}</strong><br>
            Origin: ${ship.origin || 'N/A'}<br>
            Destination: ${ship.destination || 'N/A'}<br>
            Status: ${ship.status || 'Draft'}
          `);
        markers.push(marker);
      });

      // Fit map to show all markers
      if (markers.length > 0) {
        const group = L.featureGroup(markers);
        this.map.fitBounds(group.getBounds().pad(0.2));
      }

      console.log('✅ Map rendered with', validShipments.length, 'markers');
    }, 500);
  }

  // ========== SEED DATA ==========
  seedData() {
    if (!isPlatformBrowser(this.platformId)) return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.toastr.warning('Please login first', 'Warning');
      return;
    }

    this.http.post('http://localhost:5000/api/seed', {}, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    }).subscribe({
      next: (res: any) => {
        this.toastr.success(res.msg, 'Database Seeded!');
        this.fetchStats();
      },
      error: (err) => {
        this.toastr.error('Failed to seed data', 'Error');
      }
    });
  }

  // ========== CLEAR DATA ==========
  clearData() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!confirm('⚠️ Are you sure you want to delete ALL shipments? This cannot be undone!')) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    this.http.delete('http://localhost:5000/api/clear', {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    }).subscribe({
      next: (res: any) => {
        this.toastr.success(res.msg, 'Cleared!');
        this.fetchStats();
      },
      error: (err) => {
        this.toastr.error('Failed to clear data', 'Error');
      }
    });
  }

  // ========== THEME TOGGLE ==========
  toggleTheme() {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.classList.toggle('light-theme');
  }

  // ========== LOGOUT ==========
  logout() {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}