// ================================================================
// FILE: shipment-entry-form.ts
// Complete component class with all properties and methods
// ================================================================

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ShipmentService } from './../services/shipment.services';


@Component({
  selector: 'app-shipment-entry-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe, RouterModule], // 👈 ADD RouterModule
  templateUrl: './shipment-entry-form.html',
  styleUrls: ['./shipment-entry-form.css']
})
export class ShipmentEntryFormComponent {
  // ---- Form ----
  shipmentForm!: FormGroup;

  // ---- UI State ----
  currentStep = 1;
  totalSteps = 4;
  collapsedSections: { [key: number]: boolean } = {};
  lastSaved = new Date();

  // ---- Data model (for quick binding in template) ----
  formData = {
    branch: 'export',
    shipmentType: 'import',
    transportMode: 'sea',
    serviceType: 'doorToDoor',
    hblType: 'master',
  };

  // ---- Auto-generated shipment number ----
  shipmentNumber = '';

  constructor(
    private fb: FormBuilder,
    private shipmentService: ShipmentService, // (if you have one)
    private router: Router  ) {
    this.buildForm();
    this.generateShipmentNumber();
    this.setupAutoSave();
  }

  // ============================================================
  // FORM BUILDING
  // ============================================================
  private buildForm(): void {
    this.shipmentForm = this.fb.group({
      // General
      clientName: ['', Validators.required],
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      etd: ['', Validators.required],
      eta: ['', Validators.required],

      // Vessel / Flight
      carrier: ['', Validators.required],
      vesselFlight: ['', Validators.required],
      pol: ['', Validators.required],
      pod: ['', Validators.required],
      confirmed: [false],

      // Cargo
      packages: [1, [Validators.required, Validators.min(1)]],
      grossWeight: [0, [Validators.required, Validators.min(0)]],
      netWeight: [0, [Validators.min(0)]],
      packageType: ['', Validators.required],
      volume: [{ value: 0, disabled: true }],
      dimLength: [0],
      dimWidth: [0],
      dimHeight: [0],
      hazardous: [false],
      temperatureControlled: [false],
      hsCode: [''],
      remark: [''],

      // Parties & HBL
      shipper: ['', Validators.required],
      consignee: ['', Validators.required],
      hblNumber: [''],
      bookingRef: [''],
      payableAt: [''],
      dispatchAt: [''],
      partiesRemark: [''],
    });

    // Set default ETD/ETA to now + 7 days / + 14 days
    const now = new Date();
    const etd = new Date(now);
    etd.setDate(etd.getDate() + 7);
    const eta = new Date(now);
    eta.setDate(eta.getDate() + 14);

    this.shipmentForm.patchValue({
      etd: this.formatDateTimeLocal(etd),
      eta: this.formatDateTimeLocal(eta),
    });
  }

  // ============================================================
  // SHIPMENT NUMBER GENERATION
  // ============================================================
  private generateShipmentNumber(): void {
    const prefix = 'SHP';
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    this.shipmentNumber = `${prefix}-${year}-${seq}`;
  }

  // ============================================================
  // AUTO-SAVE (simulated)
  // ============================================================
  private setupAutoSave(): void {
    setInterval(() => {
      this.lastSaved = new Date();
    }, 30000);
  }

  // ============================================================
  // STEP NAVIGATION
  // ============================================================
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.isCurrentSectionValid()) {
        this.currentStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        this.markCurrentSectionTouched();
      }
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ============================================================
  // SECTION COLLAPSE
  // ============================================================
  toggleSection(sectionId: number): void {
    this.collapsedSections[sectionId] = !this.collapsedSections[sectionId];
  }

  // ============================================================
  // VALIDATION HELPERS
  // ============================================================
  private isCurrentSectionValid(): boolean {
    const controls = this.getControlsForStep(this.currentStep);
    let valid = true;
    for (const key of controls) {
      const control = this.shipmentForm.get(key);
      if (control && control.invalid) {
        valid = false;
        break;
      }
    }
    return valid;
  }

  private markCurrentSectionTouched(): void {
    const controls = this.getControlsForStep(this.currentStep);
    for (const key of controls) {
      const control = this.shipmentForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    }
  }

  private getControlsForStep(step: number): string[] {
    switch (step) {
      case 1: return ['clientName', 'origin', 'destination', 'etd', 'eta'];
      case 2: return ['carrier', 'vesselFlight', 'pol', 'pod'];
      case 3: return ['packages', 'grossWeight', 'packageType'];
      case 4: return ['shipper', 'consignee'];
      default: return [];
    }
  }

  // ============================================================
  // UI SETTERS (for button groups)
  // ============================================================
  setBranch(value: string): void {
    this.formData.branch = value;
  }

  setShipmentType(value: string): void {
    this.formData.shipmentType = value;
  }

  setTransportMode(value: string): void {
    this.formData.transportMode = value;
  }

  setServiceType(value: string): void {
    this.formData.serviceType = value;
  }

  setHblType(value: string): void {
    this.formData.hblType = value;
  }

  // ============================================================
  // VOLUME CALCULATION (auto from dimensions)
  // ============================================================
  calculateVolume(): void {
    const len = this.shipmentForm.get('dimLength')?.value || 0;
    const wid = this.shipmentForm.get('dimWidth')?.value || 0;
    const hei = this.shipmentForm.get('dimHeight')?.value || 0;
    const packages = this.shipmentForm.get('packages')?.value || 1;

    if (len > 0 && wid > 0 && hei > 0) {
      const volumePerUnit = (len * wid * hei) / 1000000;
      const totalVolume = volumePerUnit * packages;
      this.shipmentForm.patchValue({ volume: parseFloat(totalVolume.toFixed(4)) });
    } else {
      this.shipmentForm.patchValue({ volume: 0 });
    }
  }

  // ============================================================
  // FORM ACTIONS
  // ============================================================
onSubmit(): void {
  // ========== VALIDATION BLOCK ==========
  if (this.shipmentForm.invalid) {
    Object.keys(this.shipmentForm.controls).forEach((key) => {
      this.shipmentForm.get(key)?.markAsTouched();
    });
    for (let step = 1; step <= this.totalSteps; step++) {
      const controls = this.getControlsForStep(step);
      let hasError = false;
      for (const key of controls) {
        const control = this.shipmentForm.get(key);
        if (control && control.invalid) {
          hasError = true;
          break;
        }
      }
      if (hasError) {
        this.currentStep = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      }
    }
    return;
  }

  // ========== SUCCESS BLOCK ==========
  const payload = { ...this.shipmentForm.getRawValue(), ...this.formData };
  const token = localStorage.getItem('access_token');

  if (!token) {
    alert('Please login first!');
    return;
  }

  this.shipmentService.createShipment(payload, token).subscribe({
    next: (res: any) => {
      alert(`✅ Shipment ${payload.shipmentNumber} confirmed successfully!`);
      // 👇 THIS IS WHERE YOU ADD THE NAVIGATION
      this.router.navigate(['/dashboard']);   // ✅ CORRECT PLACE
    },
    error: (err: any) => {
      console.error(err);
      alert('Error saving shipment. Check console.');
    }
  });
}

  onCancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      this.shipmentForm.reset();
      this.currentStep = 1;
      this.generateShipmentNumber();
      const now = new Date();
      const etd = new Date(now);
      etd.setDate(etd.getDate() + 7);
      const eta = new Date(now);
      eta.setDate(eta.getDate() + 14);
      this.shipmentForm.patchValue({
        etd: this.formatDateTimeLocal(etd),
        eta: this.formatDateTimeLocal(eta),
        packages: 1,
        grossWeight: 0,
        netWeight: 0,
        volume: 0,
        confirmed: false,
        hazardous: false,
        temperatureControlled: false,
      });
      this.formData = {
        branch: 'export',
        shipmentType: 'import',
        transportMode: 'sea',
        serviceType: 'doorToDoor',
        hblType: 'master',
      };
      this.lastSaved = new Date();
    }
  }

  onSaveDraft(): void {
    this.lastSaved = new Date();
    alert(`💾 Draft saved at ${this.lastSaved.toLocaleTimeString()}`);
    localStorage.setItem('shipmentDraft', JSON.stringify({
      form: this.shipmentForm.getRawValue(),
      formData: this.formData,
      shipmentNumber: this.shipmentNumber,
      lastSaved: this.lastSaved,
    }));
    console.log('💾 Draft saved to localStorage');
  }

  // ============================================================
  // UTILITY
  // ============================================================
  private formatDateTimeLocal(date: Date): string {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }
  logout() {
  localStorage.removeItem('access_token');
  this.router.navigate(['/login']);
}
toggleTheme() {
  document.body.classList.toggle('light-theme');
}
}