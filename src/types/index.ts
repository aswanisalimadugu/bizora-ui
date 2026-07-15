export type Role = 'ADMIN' | 'OWNER' | 'CUSTOMER';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: Role;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export interface Business {
  id: string;
  ownerId?: string;
  businessName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  businessHours?: string;
  isOpen?: boolean;
  active?: boolean;
  verified?: boolean;
  status?: string;
  createdAt?: string;
  categories?: Category[];
  products?: Product[];
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  mobile: string;
  email?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId?: string;
  name: string;
  description?: string;
  /** Comma-separated options, e.g. "Spicy, Double masala" */
  options?: string;
  imageUrl?: string;
  price: number;
  available: boolean;
  createdAt?: string;
}

export interface OrderItem {
  id?: string;
  productId: string;
  quantity: number;
  price?: number;
  selectedOption?: string;
}

export interface Order {
  id: string;
  businessId: string;
  customerId: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  items?: OrderItem[];
}

export interface DashboardStats {
  totalUsers: number;
  totalBusinesses: number;
  activeBusinesses: number;
  totalCustomers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
}

export interface AdminBusinessRow {
  businessId: string;
  slug: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  city: string;
  subscriptionPlan: string;
  status: string;
  verified: boolean;
  createdDate: string;
}

export interface AdminSubscriptionRow {
  id: string;
  business: string;
  businessId: string;
  plan: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface AdminPaymentRow {
  id: string;
  transactionId: string;
  business: string;
  businessId: string;
  amount: number;
  gateway: string;
  status: string;
  date: string;
}

export interface RevenueReport {
  monthlyRevenue: { month: string; revenue: number }[];
  totalRevenue: number;
  subscriptionRevenue: number;
}

export interface SubscriptionPlan {
  id?: string;
  name: string;
  price: number;
  durationDays: number;
  features: string;
  active: boolean;
}

export interface BusinessQr {
  id: string;
  businessId: string;
  label?: string;
  qrImagePath: string;
  scanUrl: string;
  createdAt: string;
}

export interface TenantSubscription {
  id: string;
  businessId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface ProductLimits {
  current: number;
  max: number;
  unlimited: boolean;
}

export type PlanLimits = ProductLimits;

export type CategoryLimits = ProductLimits;

export interface OrderTrack {
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  totalAmount: number;
  createdAt: string;
  businessName: string;
  businessSlug: string;
  items: { productName: string; quantity: number; price: number; selectedOption?: string }[];
}

export interface CartItem {
  /** Unique line key: productId + option */
  lineKey: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  available: boolean;
  selectedOption?: string;
}
