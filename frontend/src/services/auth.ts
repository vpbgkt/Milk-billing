import { apiService } from './api';
import { 
  LoginCredentials, 
  RegisterData, 
  AuthResponse, 
  User,
  ApiResponse 
} from '@/types';
import Cookies from 'js-cookie';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.token) {
      // Store token in cookie
      Cookies.set('token', response.token, { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', data);
    
    if (response.success && response.token) {
      Cookies.set('token', response.token, { 
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiService.get<ApiResponse<User>>('/auth/me');
      return response.data || null;
    } catch (error) {
      return null;
    }
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return await apiService.post<ApiResponse>('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return await apiService.post<ApiResponse>('/auth/reset-password', { token, password });
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return await apiService.put<ApiResponse<User>>('/auth/profile', data);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return await apiService.post<ApiResponse>('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  isAuthenticated(): boolean {
    return !!Cookies.get('token');
  }

  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  }

  hasPermission(permission: string): boolean {
    const user = this.getStoredUser();
    return user?.permissions?.includes(permission) || false;
  }
}

export const authService = new AuthService();
