// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JwtService } from '../services/jwt.service';

export const authGuard: CanActivateFn = (route, state) => {
    const jwtService = inject(JwtService);
    const router = inject(Router);
    const isAuthenticated = jwtService.isAuthenticated();

    if (isAuthenticated) {
        return true;
    }

    console.warn('🚫 Auth Guard: accesso negato');
    jwtService.removeToken();

    router.navigate(['/login'], {
        queryParams: {
            returnUrl: state.url,
            reason: 'unauthorized'
        }
    });

    return false;
};