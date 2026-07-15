import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import PublicBusinessPage from '../pages/public/PublicBusinessPage';
import PublicItemPage from '../pages/public/PublicItemPage';
import OrderTrackPage from '../pages/public/OrderTrackPage';

import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UsersPage from '../pages/admin/UsersPage';
import BusinessesPage from '../pages/admin/BusinessesPage';
import SubscriptionsPage from '../pages/admin/SubscriptionsPage';
import PaymentsPage from '../pages/admin/PaymentsPage';
import ReportsPage from '../pages/admin/ReportsPage';
import PlansPage from '../pages/admin/PlansPage';

import OwnerLayout from '../pages/owner/OwnerLayout';
import OwnerDashboardPage from '../pages/owner/OwnerDashboardPage';
import ProfilePage from '../pages/owner/ProfilePage';
import CategoriesPage from '../pages/owner/CategoriesPage';
import ProductsPage from '../pages/owner/ProductsPage';
import QrCodePage from '../pages/owner/QrCodePage';
import OrdersPage from '../pages/owner/OrdersPage';
import SubscriptionPage from '../pages/owner/SubscriptionPage';
import CustomersPage from '../pages/owner/CustomersPage';
import OwnerPaymentsPage from '../pages/owner/OwnerPaymentsPage';
import OwnerReportsPage from '../pages/owner/OwnerReportsPage';
import SettingsPage from '../pages/owner/SettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/business/:slug" element={<PublicBusinessPage />} />
      <Route path="/business/:slug/item/:productId" element={<PublicItemPage />} />
      <Route path="/track" element={<OrderTrackPage />} />
      <Route path="/track/:orderNumber" element={<OrderTrackPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="businesses" element={<BusinessesPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['OWNER']}>
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OwnerDashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="qr" element={<QrCodePage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="reports" element={<OwnerReportsPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="payments" element={<OwnerPaymentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
