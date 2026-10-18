import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css'] // We'll copy the CSS next
})
export class Signup {
  signupUsername = '';
  signupPassword = '';
  confirmPassword = '';
  showSignupPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  constructor(private authService: AuthService, private router: Router) {}

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
        alert('✅ Account created! Redirecting to Login...');
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert('❌ Signup failed: ' + (err.error?.msg || 'Username might already exist.'));
        this.isLoading = false;
      }
    });
  }
}

import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

// In constructor:
@Inject(PLATFORM_ID) private pid: Object

// Add this getter:
get isAdmin(): boolean {
  if (!isPlatformBrowser(this.pid)) return false;
  const u = JSON.parse(localStorage.getItem('user') || '{}');
  return u.role === 'admin';
}