import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state): boolean => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  const userRole: string | null = authService.getRole();
  const expectedRoles: string[] | undefined = route.data['expectedRoles'] as string[] | undefined;

  if (!expectedRoles || expectedRoles.length === 0) {
    return true;
  }

  if (userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  if (!authService.isLoggedIn()) {
    void router.navigate(['/login']);

    return false;
  }

  if (userRole === 'admin') {
    void router.navigate(['/admin']);
  } else if (userRole === 'doctor') {
    void router.navigate(['/doctor']);
  } else {
    void router.navigate(['/user/doctors']);
  }

  return false;
};
