import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import React, { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import TopBanner from "./components/home/TopBanner";
import { ToasterProvider } from "./hooks/useToast";
import VaniSareesAnimationDialog from "./components/AnimatedDialogs/TextAnimationDialog";

// Lazy load all pages
const Home = lazy(() => import("./pages/Home"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ComboDetail = lazy(() => import("./pages/ComboDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Search = lazy(() => import("./pages/Search"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Wallet = lazy(() => import("./pages/Wallet"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Wishlist = lazy(() => import("./pages/Wishlist"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const AdminSellers = lazy(() => import("./pages/admin/Sellers"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const ProductApprovals = lazy(() => import("./pages/admin/ProductApprovals"));
const AdminWithdrawals = lazy(() => import("./pages/admin/Withdrawals"));

// Seller pages
const SellerDashboard = lazy(() => import("./pages/seller/Dashboard"));
const SellerProducts = lazy(() => import("./pages/seller/Products"));
const SellerOrders = lazy(() => import("./pages/seller/Orders"));
const SellerOrderDetail = lazy(() => import("./pages/seller/OrderDetail"));
const SellerCoupons = lazy(() => import("./pages/seller/Coupons"));
const SellerAnalytics = lazy(() => import("./pages/seller/Analytics"));
const SellerBankAccounts = lazy(() => import("./pages/seller/BankAccounts"));
const SellerWithdrawals = lazy(() => import("./pages/seller/Withdrawals"));
const SellerSettings = lazy(() => import("./pages/seller/Settings"));

// Affiliate pages
const AffiliateDashboard = lazy(() => import("./pages/affiliate/Dashboard"));
const AffiliateRefferals = lazy(() => import("./pages/affiliate/Refferals"));
const AffiliateWithdrawals = lazy(
  () => import("./pages/affiliate/Withdrawals")
);
const AffiliateBankAccounts = lazy(
  () => import("./pages/affiliate/BankAccounts")
);

// Other pages
const ContactUs = lazy(() => import("./pages/ContactUsPage"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicyPage"));
const ReturnsAndExchanges = lazy(() => import("./pages/ReturnAndRefundPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfService = lazy(() => import("./pages/TermsofServicePage"));

// const Loader = () => (
//   <div className="flex justify-center items-center h-screen">
//     <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500"></div>
//   </div>
// );

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <TopBanner />
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <VaniSareesAnimationDialog
              isOpen={true}
              variant="loading"
              theme="traditional"
              showCloseButton={false}
              subtitle="Curating the perfect sarees for you..."
            />
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/combo/:id" element={<ComboDetail />} />
            <Route path="/cart" element={<Cart />} />
            {/* <Route path="/wish-list" element={<Wishlist />} /> */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/shipping" element={<ShippingPolicy />} />
            <Route path="/returns" element={<ReturnsAndExchanges />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route
              path="/account/settings"
              element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/wallet"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/addresses"
              element={
                <ProtectedRoute>
                  <Addresses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/order/:id"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminOrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sellers"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminSellers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/product-approvals"
              element={
                <ProtectedRoute requireRole="admin">
                  <ProductApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminCategories />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/withdrawals"
              element={
                <ProtectedRoute requireRole="admin">
                  <AdminWithdrawals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/dashboard"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/orders"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/order/:id"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerOrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/coupons"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerCoupons />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/analytics"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/bank-accounts"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerBankAccounts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/withdrawals"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerWithdrawals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/settings"
              element={
                <ProtectedRoute requireRole="seller">
                  <SellerSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/affiliate/dashboard"
              element={<AffiliateDashboard />}
            />
            <Route
              path="/affiliate/refferals"
              element={<AffiliateRefferals />}
            />
            <Route
              path="/affiliate/withdrawals"
              element={<AffiliateWithdrawals />}
            />
            <Route
              path="/affiliate/bank-accounts"
              element={<AffiliateBankAccounts />}
            />
            <Route path="/auth/signin" element={<SignIn />} />
            <Route path="/auth/signup" element={<SignUp />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToasterProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <AppContent />
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ToasterProvider>
    </BrowserRouter>
  );
}

export default App;
