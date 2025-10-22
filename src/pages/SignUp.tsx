import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Phone, Store } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useToast } from "../hooks/useToast";

type AccountRole = "user" | "seller";

export function SignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [accountType, setAccountType] = useState<AccountRole>("user");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    shopName: "",
    gstin: "",
    shopAddress: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "error",
      });
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast({
        title: "Error",
        description: "Enter a valid email address",
        variant: "error",
      });
      return false;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast({
        title: "Error",
        description: "Enter a valid 10-digit phone number",
        variant: "error",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "error",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "error",
      });
      return false;
    }

    if (accountType === "seller" && !formData.shopName.trim()) {
      toast({
        title: "Error",
        description: "Shop name is required for sellers",
        variant: "error",
      });
      return false;
    }

    if (accountType === "seller" && !formData.shopAddress.trim()) {
      toast({
        title: "Error",
        description: "Shop address is required for sellers",
        variant: "error",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            accountType,
            gstin: formData.gstin,
            shopName: formData.shopName,
            shopAddress: formData.shopAddress,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        if (accountType === "seller") {
          toast({
            title: "Success",
            description:
              "Seller application submitted! Awaiting admin approval.",
            variant: "success",
          });
        } else {
          toast({
            title: "Success",
            description: "Account created successfully!",
            variant: "success",
          });
        }
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign up",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/auth/signin"
              className="font-medium text-red-700 hover:text-red-800 transition"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(["user", "seller"] as AccountRole[]).map((type) => {
                const Icon = type === "user" ? User : Store;
                const isActive = accountType === type;
                return (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setAccountType(type)}
                    disabled={loading || type === "seller"}
                    className={`p-4 border-2 rounded-lg text-left disabled:opacity-50 transition-all ${
                      isActive
                        ? "border-red-700 bg-red-50"
                        : "border-gray-300 hover:border-gray-400 disabled:!border-gray-300"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 mb-2 ${
                        isActive ? "text-red-700" : "text-gray-600"
                      }`}
                    />
                    <div className="font-medium capitalize">{type}</div>
                    <span className="text-xs font-normal">
                      {type === "seller" && "(Comming Soon)"}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {type === "user" ? "Buy products" : "Sell products"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Common Fields */}
          {[
            { id: "name", icon: User, placeholder: "Full name" },
            {
              id: "email",
              icon: Mail,
              placeholder: "Email address",
              type: "email",
            },
            {
              id: "phone",
              icon: Phone,
              placeholder: "Phone number",
              type: "tel",
            },
          ].map(({ id, icon: Icon, placeholder, type = "text" }) => (
            <div key={id} className="relative">
              <Icon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                id={id}
                name={id}
                type={type}
                value={(formData as any)[id]}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder={placeholder}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:ring-red-700 focus:border-red-700"
              />
            </div>
          ))}

          {/* Seller Fields */}
          {accountType === "seller" && (
            <>
              {[
                {
                  id: "shopName",
                  icon: Store,
                  placeholder: "Shop name",
                  required: true,
                },
                { id: "gstin", icon: null, placeholder: "GSTIN (optional)" },
              ].map(({ id, icon: Icon, placeholder, required }) => (
                <div key={id} className="relative">
                  {Icon && (
                    <Icon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  )}
                  <input
                    id={id}
                    name={id}
                    value={(formData as any)[id]}
                    onChange={handleChange}
                    required={required}
                    disabled={loading}
                    placeholder={placeholder}
                    className={`w-full ${
                      Icon ? "pl-10" : "pl-3"
                    } pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:ring-red-700 focus:border-red-700`}
                  />
                </div>
              ))}

              <textarea
                id="shopAddress"
                name="shopAddress"
                value={formData.shopAddress}
                onChange={handleChange}
                required
                disabled={loading}
                rows={3}
                placeholder="Shop address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:ring-red-700 focus:border-red-700"
              />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Your seller application will be reviewed by our admin team.
                You’ll receive an email once approved.
              </div>
            </>
          )}

          {/* Password Fields */}
          {["password", "confirmPassword"].map((field) => (
            <div key={field} className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                id={field}
                name={field}
                type={showPassword ? "text" : "password"}
                value={(formData as any)[field]}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder={
                  field === "password"
                    ? "Password (min 6 characters)"
                    : "Confirm password"
                }
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:ring-red-700 focus:border-red-700"
              />
              {field === "password" && (
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-2.5"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-red-700 hover:bg-red-800 text-white font-medium text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Creating account..."
              : accountType === "seller"
              ? "Submit Application"
              : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
