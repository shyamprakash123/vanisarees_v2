import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { CategoryPage } from './pages/CategoryPage';
import { ProductDetail } from './pages/ProductDetail';
import { ComboDetail } from './pages/ComboDetail';
import { Cart } from './pages/Cart';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Search } from './pages/Search';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { AccountSettings } from './pages/AccountSettings';
import { Wallet } from './pages/Wallet';
import { Addresses } from './pages/Addresses';
import { Wishlist } from './pages/Wishlist';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminProducts } from './pages/admin/Products';
import { AdminOrders } from './pages/admin/Orders';
import { AdminSellers } from './pages/admin/Sellers';
import { AdminUsers } from './pages/admin/Users';
import { AdminAnalytics } from './pages/admin/Analytics';
import { AdminCategories } from './pages/admin/Categories';
import { SellerDashboard } from './pages/seller/Dashboard';
import { SellerProducts } from './pages/seller/Products';
import { SellerOrders } from './pages/seller/Orders';
import { SellerCoupons } from './pages/seller/Coupons';
import { SellerAnalytics } from './pages/seller/Analytics';
import { SellerBankAccounts } from './pages/seller/BankAccounts';
import { SellerWithdrawals } from './pages/seller/Withdrawals';
import { ToastContainer } from './components/ui/Toast';
import { TopSlidingBar } from './components/ui/TopSlidingBar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useToast } from './hooks/useToast';

function AppContent() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="flex flex-col min-h-screen">
      <TopSlidingBar
        message="🎉 Welcome to VaniSarees! Free shipping on orders above ₹1000"
        link="/"
        linkText="Shop Now"
      />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/combo/:id" element={<ComboDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/account/settings" element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          } />
          <Route path="/account/wallet" element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } />
          <Route path="/account/addresses" element={
            <ProtectedRoute>
              <Addresses />
            </ProtectedRoute>
          } />
          <Route path="/account/wishlist" element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requireRole="admin">
              <AdminProducts />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute requireRole="admin">
              <AdminOrders />
            </ProtectedRoute>
          } />
          <Route path="/admin/sellers" element={
            <ProtectedRoute requireRole="admin">
              <AdminSellers />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute requireRole="admin">
              <AdminAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute requireRole="admin">
              <AdminCategories />
            </ProtectedRoute>
          } />
          <Route path="/seller" element={
            <ProtectedRoute requireRole="seller">
              <SellerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/seller/dashboard" element={
            <ProtectedRoute requireRole="seller">
              <SellerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/seller/products" element={
            <ProtectedRoute requireRole="seller">
              <SellerProducts />
            </ProtectedRoute>
          } />
          <Route path="/seller/orders" element={
            <ProtectedRoute requireRole="seller">
              <SellerOrders />
            </ProtectedRoute>
          } />
          <Route path="/seller/coupons" element={
            <ProtectedRoute requireRole="seller">
              <SellerCoupons />
            </ProtectedRoute>
          } />
          <Route path="/seller/analytics" element={
            <ProtectedRoute requireRole="seller">
              <SellerAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/seller/bank-accounts" element={
            <ProtectedRoute requireRole="seller">
              <SellerBankAccounts />
            </ProtectedRoute>
          } />
          <Route path="/seller/withdrawals" element={
            <ProtectedRoute requireRole="seller">
              <SellerWithdrawals />
            </ProtectedRoute>
          } />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
