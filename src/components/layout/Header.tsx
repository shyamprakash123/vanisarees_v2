import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  Wallet as WalletIcon,
  MapPin,
  Package,
  LayoutDashboard,
  Store,
  Moon,
  Sun,
  Languages,
  Handshake,
  Loader2,
} from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabase";
import Button from "../ui/Button";

export function Header() {
  const { itemCount } = useCart();
  const { user, role, affiliateUser, handleAffiliateJoin, affiliateLoading } =
    useAuth();
  // const { theme, toggleTheme } = useTheme();
  // const { language, setLanguage } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    setUserMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-min">
          <div className="flex items-center gap-4">
            {/* <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button> */}

            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/images/vanisarees_logo.png"
                alt="Logo"
                className="h-20 w-28"
              />
              {/* <div className="text-2xl font-bold text-red-700 group-hover:scale-110 transition-transform">
                VaniSarees
              </div> */}
            </Link>
          </div>

          {/* <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/category/sarees"
              className="text-gray-700 hover:text-red-700 transition-colors font-medium"
            >
              Sarees
            </Link>
            <Link
              to="/category/jewellery"
              className="text-gray-700 hover:text-red-700 transition-colors font-medium"
            >
              Jewellery
            </Link>
            <Link
              to="/category/combos"
              className="text-gray-700 hover:text-red-700 transition-colors font-medium"
            >
              Combos
            </Link>
          </nav> */}

          <div className="flex items-center gap-3">
            <form
              onSubmit={handleSearch}
              className="hidden md:flex items-center gap-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent w-64"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-red-800 text-white hover:bg-red-900 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            <button
              onClick={() => navigate("/search")}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            {/* <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-gray-700" />
              ) : (
                <Sun className="w-5 h-5 text-gray-300" />
              )}
            </button>

            <button
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
              title="Change Language"
            >
              <Languages className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                {language}
              </span>
            </button> */}

            <div ref={menuRef} className="relative">
              {user ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-5 h-5 text-gray-700" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50">
                      {role === "admin" && (
                        <>
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                          <div className="border-t my-1"></div>
                        </>
                      )}
                      {role === "seller" && (
                        <>
                          <Link
                            to="/seller/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Store className="w-4 h-4" />
                            Seller Dashboard
                          </Link>
                          <div className="border-t my-1"></div>
                        </>
                      )}
                      {affiliateUser ? (
                        <>
                          <Link
                            to="/affiliate/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Handshake className="w-4 h-4" />
                            Affiliate Dashboard
                          </Link>
                          <div className="border-t my-1"></div>
                        </>
                      ) : (
                        <div className="px-4 py-2 border-b items-center flex">
                          <p className="w-full pb-2 text-left text-sm text-gray-700 flex items-center gap-2">
                            <Handshake className="w-4 h-4" />
                            Affiliate Partner
                          </p>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAffiliateJoin}
                          >
                            {affiliateLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span className="text-nowrap">Joining...</span>
                              </>
                            ) : (
                              <span className="text-nowrap">Join</span>
                            )}
                          </Button>
                        </div>
                      )}
                      <Link
                        to="/account/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Account Settings
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        My Orders
                      </Link>
                      <Link
                        to="/account/wallet"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <WalletIcon className="w-4 h-4" />
                        Wallet
                      </Link>
                      <Link
                        to="/account/addresses"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Addresses
                      </Link>
                      <div className="border-t my-1"></div>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/auth/signin"
                  className="p-2 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-gray-700 " />
                </Link>
              )}
            </div>

            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white animate-slideDown">
            <nav className="flex flex-col px-4 py-4 gap-2">
              <Link
                to="/category/sarees"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sarees
              </Link>
              <Link
                to="/category/jewellery"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jewellery
              </Link>
              <Link
                to="/category/combos"
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Combos
              </Link>
            </nav>
          </div>
        )} */}
      </div>
    </header>
  );
}
