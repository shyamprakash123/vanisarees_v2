import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { User, Mail, Phone, Building, Bell } from "lucide-react";

export function AccountSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gstin, setGstin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newsletter: false,
    newArrivals: true,
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth/signin");
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("name, phone, gstin")
        .eq("id", user!.id)
        .single();

      if (error) throw error;
      if (data) {
        setName(data.name || "");
        setPhone(data.phone || "");
        setGstin(data.gstin || "");
        if (data.notification_preferences) {
          setNotifications(data.notification_preferences);
        }
      }
    } catch (error) {
      console.error("Load profile error:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name,
          phone,
          gstin,
          // notification_preferences: notifications,
        })
        .eq("id", user!.id);

      if (error) throw error;
      setMessage("Profile updated successfully");
    } catch (error) {
      setMessage("Error updating profile");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4" />
            Email
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4" />
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Phone className="h-4 w-4" />
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Building className="h-4 w-4" />
            GSTIN (Optional)
          </label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            placeholder="Enter your GSTIN for business purchases"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-800 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            For GST invoice generation
          </p>
        </div>

        {/* <div className="border-t pt-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">Order Updates</span>
              <input
                type="checkbox"
                checked={notifications.orderUpdates}
                onChange={(e) => setNotifications({ ...notifications, orderUpdates: e.target.checked })}
                className="w-5 h-5 text-red-800 border-gray-300 rounded focus:ring-red-800"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">Promotions & Offers</span>
              <input
                type="checkbox"
                checked={notifications.promotions}
                onChange={(e) => setNotifications({ ...notifications, promotions: e.target.checked })}
                className="w-5 h-5 text-red-800 border-gray-300 rounded focus:ring-red-800"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">Newsletter</span>
              <input
                type="checkbox"
                checked={notifications.newsletter}
                onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
                className="w-5 h-5 text-red-800 border-gray-300 rounded focus:ring-red-800"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-sm font-medium text-gray-700">New Arrivals</span>
              <input
                type="checkbox"
                checked={notifications.newArrivals}
                onChange={(e) => setNotifications({ ...notifications, newArrivals: e.target.checked })}
                className="w-5 h-5 text-red-800 border-gray-300 rounded focus:ring-red-800"
              />
            </label>
          </div>
        </div> */}

        {message && (
          <div
            className={`p-3 rounded-lg ${
              message.includes("success")
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 bg-red-800 text-white rounded-lg font-semibold hover:bg-red-900 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
