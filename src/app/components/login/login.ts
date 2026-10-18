import { Component, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  username = '';
  password = '';
  showSignup = false;
  signupUsername = '';
  signupPassword = '';
  confirmPassword = '';
  showLoginPassword = false;
  showSignupPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  cardTransform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    @Inject(PLATFORM_ID) private pid: Object
  ) {}

  get isAdmin(): boolean {
    if (!isPlatformBrowser(this.pid)) return false;
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.role === 'admin';
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const card = (event.target as HTMLElement).closest('.login-card') as HTMLElement;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -5;
    const ry = ((x - cx) / cx) * 5;
    this.cardTransform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  toggleSignup(event: Event) {
    event.preventDefault();
    this.showSignup = !this.showSignup;
    if (!this.showSignup) {
      this.signupUsername = '';
      this.signupPassword = '';
      this.confirmPassword = '';
    }
  }

  onLogin() {
    if (!this.username || !this.password) {
      this.toastr.warning('Please fill in both fields.', 'Warning');
      return;
    }
    this.isLoading = true;
    this.authService.login(this.username, this.password).subscribe({
      next: (res: any) => {
        const token = res?.data?.access_token || res?.access_token;
        if (token) {
          localStorage.setItem('access_token', token);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
        this.toastr.success('Login successful!', 'Welcome');
        this.router.navigate(['/dashboard']);
        this.isLoading = false;
      },
      error: (err: any) => {
        this.toastr.error('Login failed: ' + (err.error?.msg || 'Invalid credentials'), 'Error');
        this.isLoading = false;
      }
    });
  }

  onSignup() {
    if (!this.signupUsername || !this.signupPassword || !this.confirmPassword) {
      this.toastr.warning('Please fill in all fields.', 'Warning');
      return;
    }
    if (this.signupPassword !== this.confirmPassword) {
      this.toastr.warning('Passwords do not match!', 'Warning');
      return;
    }
    if (this.signupPassword.length < 4) {
      this.toastr.warning('Password must be at least 4 characters.', 'Warning');
      return;
    }
    this.isLoading = true;
    this.authService.signup(this.signupUsername, this.signupPassword).subscribe({
      next: () => {
        this.toastr.success('Account created! Logging you in...', 'Success');
        this.username = this.signupUsername;
        this.password = this.signupPassword;
        this.showSignup = false;
        this.onLogin();
      },
      error: (err: any) => {
        this.toastr.error('Signup failed: ' + (err.error?.msg || 'Try again'), 'Error');
        this.isLoading = false;
      }
    });
  }
}