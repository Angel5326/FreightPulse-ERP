import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShipmentService } from '../../services/shipment.services';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.css']
})
export class PaymentModalComponent implements OnInit {
  @Input() invoice: any = {};
  @Output() closeModal = new EventEmitter<void>();
  @Output() paymentRecorded = new EventEmitter<void>();

  payments: any[] = [];
  form: any = { amount: 0, method: 'Bank Transfer', reference: '', notes: '' };

  constructor(private svc: ShipmentService, private toastr: ToastrService) {}

  ngOnInit() {
    if (this.invoice?.id) this.loadPayments();
    this.form.amount = this.invoice?.balance || 0;
  }

  loadPayments() {
    const t = localStorage.getItem('access_token')!;
    this.svc.getPayments(this.invoice.id, t).subscribe((d: any) => this.payments = d);
  }

  close() { this.closeModal.emit(); }

  record() {
    const t = localStorage.getItem('access_token');
    if (!t) return;
    if (!this.form.amount || this.form.amount <= 0) {
      this.toastr.warning('Enter a valid amount');
      return;
    }
    this.svc.recordPayment(this.invoice.id, this.form, t).subscribe({
      next: (r: any) => {
        this.toastr.success(`Payment recorded. Balance: $${r.balance}`, 'Success');
        this.paymentRecorded.emit();
        this.form = { amount: r.balance, method: 'Bank Transfer', reference: '', notes: '' };
        this.loadPayments();
      },
      error: () => this.toastr.error('Failed to record payment', 'Error')
    });
  }
}