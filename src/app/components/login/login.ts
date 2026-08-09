import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  // Login fields
  username = '';
  password = '';

  // Signup fields
  showSignup = false;
  signupUsername = '';
  signupPassword = '';
  confirmPassword = '';

  // UI toggles
  showLoginPassword = false;
  showSignupPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  // 3D Tilt
  cardTransform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';

  constructor(private authService: AuthService, private router: Router, private toastr: ToastrService) {}

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const card = (event.target as HTMLElement).closest('.login-card') as HTMLElement;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    this.cardTransform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  // ---------- TOGGLE SIGNUP ----------
  toggleSignup(event: Event) {
    event.preventDefault();
    this.showSignup = !this.showSignup;
    if (!this.showSignup) {
      this.signupUsername = '';
      this.signupPassword = '';
      this.confirmPassword = '';
    }
  }

  // ---------- LOGIN ----------
  onLogin() {
    if (!this.username || !this.password) {
      alert('⚠️ Please fill in both fields.');
      return;
    }
    this.isLoading = true;
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },
      error: (err) => {
        alert('❌ Login failed: ' + (err.error?.msg || 'Invalid credentials'));
        this.isLoading = false;
      }
    });
  }

  // ---------- SIGNUP ----------
  onSignup() {
    if (!this.signupUsername || !this.signupPassword || !this.confirmPassword) {
      alert('⚠️ Please fill in all signup fields.');
      return;
    }
    if (this.signupPassword !== this.confirmPassword) {
      alert('⚠️ Passwords do not match!');
      return;
    }
    if (this.signupPassword.length < 4) {
      alert('⚠️ Password must be at least 4 characters.');
      return;
    }

    this.isLoading = true;
    this.authService.signup(this.signupUsername, this.signupPassword).subscribe({
      next: () => {
        alert('✅ Account created! Logging you in...');
        this.username = this.signupUsername;
        this.password = this.signupPassword;
        this.showSignup = false;
        this.onLogin(); // Auto-login
        this.isLoading = false;
      },
      error: (err) => {
        alert('❌ Signup failed: ' + (err.error?.msg || 'Username might already exist.'));
        this.isLoading = false;
      }
    });
  }
    ngOnInit(): void {
    // Clear any leftover values (prevents autofill)
    this.username = '';
    this.password = '';
    this.signupUsername = '';
    this.signupPassword = '';
    this.confirmPassword = '';
  }

}
