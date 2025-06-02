import { ApiResponse, MilkEntry } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class MilkService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  async addEntry(data: {
    date: string;
    quantity: number;
    supplierId?: string;
    notes?: string;
    deliveryTime?: 'morning' | 'evening';
  }): Promise<ApiResponse<MilkEntry>> {
    const response = await fetch(`${API_BASE_URL}/milk/add-entry`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    return response.json();
  }

  async getDailyEntry(date: string): Promise<ApiResponse<MilkEntry>> {
    const response = await fetch(`${API_BASE_URL}/milk/daily-entry/${date}`,{
      headers: this.getAuthHeaders()
    });

    return response.json();
  }
  async updateEntry(entryId: string, data: {
    quantity?: number;
    notes?: string;
    deliveryTime?: 'morning' | 'evening';
  }): Promise<ApiResponse<MilkEntry>> {
    const response = await fetch(`${API_BASE_URL}/milk/entry/${entryId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    return response.json();
  }

  async getMonthlyData(year: number, month: number): Promise<ApiResponse<{
    entries: MilkEntry[];
    totalQuantity: number;
    totalAmount: number;
    avgPerDay: number;
  }>> {
    const response = await fetch(`${API_BASE_URL}/milk/monthly-data/${year}/${month}`, {
      headers: this.getAuthHeaders()
    });

    return response.json();
  }

  async getPendingEntries(): Promise<ApiResponse<MilkEntry[]>> {
    const response = await fetch(`${API_BASE_URL}/milk/pending-entries`, {
      headers: this.getAuthHeaders()
    });

    return response.json();
  }
}

export const milkService = new MilkService();
