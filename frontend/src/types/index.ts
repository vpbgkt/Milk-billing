// User Types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'supplier' | 'superadmin';
  address?: string;
  businessName?: string;
  businessType?: string;
  permissions?: string[];
  isActive: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'user' | 'supplier';
  address?: string;
  businessName?: string;
  businessType?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

// Milk Entry Types
export interface MilkEntry {
  _id: string;
  userId: string | User;
  supplierId?: string | User;
  date: string;
  quantity: number;
  status: 'confirmed' | 'pending' | 'rejected';
  entryType: 'supplier_entry' | 'user_request';
  notes?: string;
  pricePerLiter: number;
  totalAmount: number;
  deliveryTime?: 'morning' | 'evening';
  fat?: number;
  snf?: number;
  createdAt: string;
  updatedAt: string;
}

// Platform Analytics Types
export interface PlatformAnalytics {
  totalUsers: number;
  totalSuppliers: number;
  totalMilkEntries: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: number;
    suppliers: number;
    revenue: number;
  };
  recentActivities: Activity[];
}

export interface Activity {
  _id: string;
  type: 'user_registration' | 'supplier_registration' | 'milk_delivery' | 'payment';
  description: string;
  user?: string;
  createdAt: string;
}

// Platform Settings Types
export interface PlatformSettings {
  _id: string;
  platformName: string;
  platformFee: number;
  defaultMilkPrice: number;
  supportEmail: string;
  supportPhone: string;  features: {
    emailNotifications: boolean;
    // SMS notifications disabled - only available through mobile app
    whatsappIntegration: boolean;
    advancedAnalytics: boolean;
  };
  maintenanceMode: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Notification Types
export interface Notification {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'milk_delivery' | 'payment' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  _id: string;
  user: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  // SMS notifications disabled - only available through mobile app
  categories: {
    milkDeliveries: boolean;
    payments: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
  };
  createdAt: string;
  updatedAt: string;
}

export interface PushSubscription {
  _id: string;
  user: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Chart Data Types
export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'select' | 'textarea' | 'number';
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

// Component Props Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
