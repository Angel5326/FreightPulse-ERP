import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private api = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private h(token: string) {
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Shipments
  getShipments(token: string, params: any = {}): Observable<any> {
    let url = `${this.api}/shipments/?`;
    Object.keys(params).forEach(k => { if (params[k] != null && params[k] !== '') url += `${k}=${params[k]}&`; });
    return this.http.get(url, { headers: this.h(token) });
  }
  getShipment(id: number, t: string) { return this.http.get(`${this.api}/shipments/${id}`, { headers: this.h(t) }); }
  createShipment(d: any, t: string) { return this.http.post(`${this.api}/shipments/`, d, { headers: this.h(t) }); }
  updateShipment(id: number, d: any, t: string) { return this.http.put(`${this.api}/shipments/${id}`, d, { headers: this.h(t) }); }
  deleteShipment(id: number, t: string) { return this.http.delete(`${this.api}/shipments/${id}`, { headers: this.h(t) }); }

  // Items
  addItem(sid: number, d: any, t: string) { return this.http.post(`${this.api}/shipments/${sid}/items`, d, { headers: this.h(t) }); }
  deleteItem(id: number, t: string) { return this.http.delete(`${this.api}/items/${id}`, { headers: this.h(t) }); }

  // Events
  addEvent(sid: number, d: any, t: string) { return this.http.post(`${this.api}/shipments/${sid}/events`, d, { headers: this.h(t) }); }

  // Clients
  getClients(t: string, q: string = '') { return this.http.get(`${this.api}/clients/?q=${q}`, { headers: this.h(t) }); }
  createClient(d: any, t: string) { return this.http.post(`${this.api}/clients/`, d, { headers: this.h(t) }); }
  updateClient(id: number, d: any, t: string) { return this.http.put(`${this.api}/clients/${id}`, d, { headers: this.h(t) }); }
  deleteClient(id: number, t: string) { return this.http.delete(`${this.api}/clients/${id}`, { headers: this.h(t) }); }
  getClientBalance(id: number, t: string) { return this.http.get(`${this.api}/clients/${id}/balance`, { headers: this.h(t) }); }

  // Invoices
  getInvoices(t: string, status: string = '') { return this.http.get(`${this.api}/invoices/?status=${status}`, { headers: this.h(t) }); }
  createInvoice(d: any, t: string) { return this.http.post(`${this.api}/invoices/`, d, { headers: this.h(t) }); }
  markPaid(id: number, t: string) { return this.http.put(`${this.api}/invoices/${id}/mark-paid`, {}, { headers: this.h(t) }); }
  deleteInvoice(id: number, t: string) { return this.http.delete(`${this.api}/invoices/${id}`, { headers: this.h(t) }); }

  // Payments
  getPayments(iid: number, t: string) { return this.http.get(`${this.api}/invoices/${iid}/payments`, { headers: this.h(t) }); }
  recordPayment(iid: number, d: any, t: string) { return this.http.post(`${this.api}/invoices/${iid}/payments`, d, { headers: this.h(t) }); }
  getAllPayments(t: string) { return this.http.get(`${this.api}/payments`, { headers: this.h(t) }); }

  // Documents
  uploadDocument(sid: number, file: File, fileType: string, t: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('file_type', fileType);
    return this.http.post(`${this.api}/shipments/${sid}/documents`, form,
      { headers: new HttpHeaders().set('Authorization', `Bearer ${t}`) });
  }
  getDocuments(sid: number, t: string) { return this.http.get(`${this.api}/shipments/${sid}/documents`, { headers: this.h(t) }); }
  downloadDocument(id: number, t: string) { return this.http.get(`${this.api}/documents/${id}/download`, { headers: this.h(t), responseType: 'blob' }); }
  deleteDocument(id: number, t: string) { return this.http.delete(`${this.api}/documents/${id}`, { headers: this.h(t) }); }

  // Notifications
  getNotifications(t: string) { return this.http.get(`${this.api}/notifications/`, { headers: this.h(t) }); }
  markNotifRead(id: number, t: string) { return this.http.put(`${this.api}/notifications/${id}/read`, {}, { headers: this.h(t) }); }
  markAllRead(t: string) { return this.http.put(`${this.api}/notifications/read-all`, {}, { headers: this.h(t) }); }

  // Reports
  exportExcel(t: string) { return this.http.get(`${this.api}/reports/excel`, { headers: this.h(t), responseType: 'blob' }); }
  exportPdf(t: string) { return this.http.get(`${this.api}/reports/pdf`, { headers: this.h(t), responseType: 'blob' }); }

  // Dashboard
  getRevenueAnalytics(t: string) { return this.http.get(`${this.api}/dashboard/revenue`, { headers: this.h(t) }); }
  getCarrierPerformance(t: string) { return this.http.get(`${this.api}/dashboard/carrier-performance`, { headers: this.h(t) }); }
  getHeatmap(t: string) { return this.http.get(`${this.api}/dashboard/heatmap`, { headers: this.h(t) }); }
  getProfitability(t: string) { return this.http.get(`${this.api}/dashboard/profitability`, { headers: this.h(t) }); }

  // Admin
  getAdminStats(t: string) { return this.http.get(`${this.api}/admin/stats`, { headers: this.h(t) }); }
  getAdminUsers(t: string) { return this.http.get(`${this.api}/admin/users`, { headers: this.h(t) }); }
  updateAdminUser(id: number, d: any, t: string) { return this.http.put(`${this.api}/admin/users/${id}`, d, { headers: this.h(t) }); }
  deleteAdminUser(id: number, t: string) { return this.http.delete(`${this.api}/admin/users/${id}`, { headers: this.h(t) }); }
  getAdminOrgs(t: string) { return this.http.get(`${this.api}/admin/organizations`, { headers: this.h(t) }); }
  updateAdminOrg(id: number, d: any, t: string) { return this.http.put(`${this.api}/admin/organizations/${id}`, d, { headers: this.h(t) }); }
}