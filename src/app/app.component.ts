import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    FormsModule,
    RouterLinkActive,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  user$: Observable<any | null>;

  constructor(private authService: AuthService, private router: Router) {
    this.user$ = this.authService.userData$;
  }

  logout() {
    this.authService
      .logout()
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch((err) => {
        console.error('Błąd podczas wylogowywania:', err);
      });
  }
}
