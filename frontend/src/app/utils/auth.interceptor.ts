import { inject } from '@angular/core';
import {
    HttpHandlerFn,
    HttpRequest,
    HttpErrorResponse,
    HttpClient
} from '@angular/common/http';
import { JwtService } from '../services/jwt.service';
import { Router } from '@angular/router';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../environments/environment';

const AUTH_SKIP_URLS = ['/auth/login', '/auth/register', '/auth/refresh'];

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
    const jwtService = inject(JwtService);
    const router = inject(Router);
    const http = inject(HttpClient);

    if (AUTH_SKIP_URLS.some(url => req.url.includes(url))) {
        return next(req);
    }

    const authTokens = jwtService.getToken();

    if (!authTokens) {
        return next(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    jwtService.removeToken();
                    router.navigate(['/login'], { queryParams: { reason: 'no_token' } });
                }
                return throwError(() => error);
            })
        );
    }

    const clonedReq = req.clone({
        setHeaders: { Authorization: `Bearer ${authTokens.token}` }
    });

    return next(clonedReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                const refreshToken = authTokens.refreshToken;

                if (refreshToken && jwtService.isRefreshTokenValid()) {
                    return http.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
                        `${environment.apiUrl}/auth/refresh`,
                        { refreshToken }
                    ).pipe(
                        switchMap((response) => {
                            jwtService.setToken(response.data.accessToken, response.data.refreshToken);
                            const retryReq = req.clone({
                                setHeaders: { Authorization: `Bearer ${response.data.accessToken}` }
                            });
                            return next(retryReq);
                        }),
                        catchError((refreshError: HttpErrorResponse) => {
                            jwtService.removeToken();
                            router.navigate(['/login'], { queryParams: { reason: 'session_expired' } });
                            return throwError(() => refreshError);
                        })
                    );
                } else {
                    jwtService.removeToken();
                    router.navigate(['/login'], { queryParams: { reason: 'no_refresh_token' } });
                    return throwError(() => error);
                }
            }

            if (error.status === 403) {
                router.navigate(['/unauthorized']);
            }

            return throwError(() => error);
        })
    );
}
