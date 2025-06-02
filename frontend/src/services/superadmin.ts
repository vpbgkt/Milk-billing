import { apiService } from './api';
import type { PlatformAnalytics, User, MilkEntry, PlatformSettings, ApiResponse } from '@/types';

export class SuperAdminService {
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const response = await apiService.get<ApiResponse<PlatformAnalytics>>('/superadmin/analytics');
    if (!response.data) throw new Error('Failed to load analytics data');
    return response.data;
  }
  async getAllUsers(page: number = 1, limit: number = 10, search: string = '', role: string = ''): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(role && { role })
    });
    const response = await apiService.get<ApiResponse<any>>(`/superadmin/users?${params}`);
    if (!response.data) throw new Error('Failed to load users');
    return response.data;
  }
  async suspendUser(userId: string, reason: string): Promise<any> {
    const response = await apiService.post<ApiResponse<any>>(`/superadmin/users/${userId}/suspend`, { reason });
    if (!response.data) throw new Error('Failed to suspend user');
    return response.data;
  }
  async unsuspendUser(userId: string): Promise<any> {
    const response = await apiService.post<ApiResponse<any>>(`/superadmin/users/${userId}/unsuspend`);
    if (!response.data) throw new Error('Failed to unsuspend user');
    return response.data;
  }
  async deleteUser(userId: string): Promise<any> {
    const response = await apiService.delete<ApiResponse<any>>(`/superadmin/users/${userId}`);
    if (!response.data) throw new Error('Failed to delete user');
    return response.data;
  }
}

export const superAdminService = new SuperAdminService();
