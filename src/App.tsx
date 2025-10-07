import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
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
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminProducts } from './pages/admin/Products';
import { AdminOrders } from './pages/admin/Orders';
import { AdminSellers } from './pages/admin/Sellers';
import { AdminUsers } from './pages/admin/Users';
import { AdminAnalytics } from './pages/admin/Analytics';
import { SellerDashboard } from './pages/seller/Dashboard';
import { SellerProducts } from './pages/seller/Products';
import { SellerOrders } from './pages/seller/Orders';
import { ToastContainer } from './components/ui/Toast';
import { TopSlidingBar } from './components/ui/TopSlidingBar';
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
          <Route path="/account/settings" element={<AccountSettings />} />
          <Route path="/account/wallet" element={<Wallet />} />
          <Route path="/account/addresses" element={<Addresses />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/sellers" element={<AdminSellers />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/products" element={<SellerProducts />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
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
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
