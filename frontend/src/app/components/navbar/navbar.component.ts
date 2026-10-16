import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: false,
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  protected authSrv = inject(AuthService);

  isAuthenticated$ = this.authSrv.isAuthenticated$;
  currentUser$ = this.authSrv.currentUser$;

  logout(): void {
    this.authSrv.logout().subscribe();
  }
}
