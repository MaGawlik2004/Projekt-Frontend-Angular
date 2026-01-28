import { Injectable, inject, signal, computed, WritableSignal, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { UserState } from '../../models/user';
import { AuthResponse, TokenPayload } from '../../models/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http: HttpClient = inject(HttpClient);
  private apiUrl: string = 'http://localhost:8000/auth';

  private userSignal: WritableSignal<UserState | null> = signal<UserState | null>(
    this.getUserFromStorage(),
  );

  public userRole: WritableSignal<string | null> = signal<string | null>(
    localStorage.getItem('role'),
  );

  public isActive: WritableSignal<boolean> = signal<boolean>(
    localStorage.getItem('isActive') === 'true',
  );

  public currentUser: Signal<UserState | null> = computed(() => this.userSignal());

  // DODAJ TĘ LINIIĘ:
  public userName: Signal<string> = computed(() => this.userSignal()?.full_name || '');

  public login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    const formData: FormData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, formData).pipe(
      tap((res: AuthResponse): void => {
        const token: string = res.access_token;
        localStorage.setItem('token', token);

        const userData: UserState = res.user;
        localStorage.setItem('user_data', JSON.stringify(userData));
        this.userSignal.set(userData);

        const decoded: TokenPayload = jwtDecode<TokenPayload>(token);
        const role: string = decoded.role;
        const active: boolean = decoded.is_active !== undefined ? decoded.is_active : true;

        localStorage.setItem('role', role);
        localStorage.setItem('isActive', String(active));

        this.userRole.set(role);
        this.isActive.set(active);
      }),
    );
  }

  public updateLocalUserData(newName: string): void {
    const current: UserState | null = this.userSignal();
    if (current) {
      const updated: UserState = { ...current, full_name: newName };
      this.userSignal.set(updated);
      localStorage.setItem('user_data', JSON.stringify(updated));
    }
  }

  private getUserFromStorage(): UserState | null {
    const data: string | null = localStorage.getItem('user_data');
    try {
      return data ? (JSON.parse(data) as UserState) : null;
    } catch {
      return null;
    }
  }

  public register(userData: Partial<UserState>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public getRole(): string | null {
    return localStorage.getItem('role');
  }

  public logout(): void {
    localStorage.clear();
    this.userSignal.set(null);
    this.userRole.set(null);
    this.isActive.set(true);
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
