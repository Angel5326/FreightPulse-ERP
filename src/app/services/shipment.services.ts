import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // ✅ Get all shipments
  getShipments(token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.apiUrl}/shipments/`, { headers });
  }

  // ✅ Create a new shipment
  createShipment(data: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post(`${this.apiUrl}/shipments/`, data, { headers });
  }

  // ✅ Update shipment status (needed for the dropdown)
updateShipment(id: number, status: string, token: string): Observable<any> {
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.put(`${this.apiUrl}/shipments/${id}`, { status }, { headers });
}


  // ✅ Delete a shipment (needed for the delete button)
  deleteShipment(id: number, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete(`${this.apiUrl}/shipments/${id}`, { headers });
  }

  // Export Excel
exportExcel(token: string): Observable<Blob> {
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get(`${this.apiUrl}/reports/excel`, {
    headers: headers,
    responseType: 'blob'
  });
}

// Export PDF
exportPdf(token: string): Observable<Blob> {
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  return this.http.get(`${this.apiUrl}/reports/pdf`, {
    headers: headers,
    responseType: 'blob'
  });
}


}