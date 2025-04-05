import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const expectedRoles = route.data['roles'] as Array<string>;
    return this.authService.userData$.pipe(
      take(1),
      map((user) => {
        if (user && expectedRoles.includes(user.role)) {
          return true;
        }
        return false;
      }),
      tap((isAuthorized) => {
        if (!isAuthorized) {
          this.router.navigate(['/home']);
        }
      })
    );
  }
}
