import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  constructor(private router: Router) {}

  toggleTheme() {
    document.body.classList.toggle('light-theme');
  }

  // ✅ ADD THIS METHOD
  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }
}