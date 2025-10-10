import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Settings, Save, Loader, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function ShiprocketSettings() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pickupLocation, setPickupLocation] = useState("Primary");
  const [showPassword, setShowPassword] = useState(false);
  const [webhookToken, setWebhookToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      if (!user) return;

      const { data } = await supabase
        .from("shiprocket_credentials")
        .select("*")
        .eq("seller_id", user.id)
        .eq("active", true)
        .maybeSingle();

      const { data: webhookTokenData } = await supabase
        .from("webhook_tokens")
        .select("token")
        .eq("seller_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (webhookTokenData) {
        setWebhookToken(webhookTokenData.token);
      }

      if (data) {
        setEmail(data.email);
        setPassword(data.password);
        setPickupLocation(data.pickup_location || "Primary");
      }
    } catch (err) {
      console.error("Load credentials error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email || !password) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { data: sellerData } = await supabase
        .from("sellers")
        .select("id")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (!sellerData) throw new Error("Seller account not found");

      const { data: existingCreds } = await supabase
        .from("shiprocket_credentials")
        .select("id")
        .eq("seller_id", sellerData.id)
        .maybeSingle();

      if (existingCreds) {
        const { error } = await supabase
          .from("shiprocket_credentials")
          .update({
            email,
            password,
            pickup_location: pickupLocation,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCreds.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("shiprocket_credentials").insert({
          seller_id: sellerData.id,
          email,
          password,
          pickup_location: pickupLocation,
          active: true,
        });

        if (error) throw error;
      }

      setMessage({
        type: "success",
        text: "Shiprocket credentials saved successfully",
      });
    } catch (err) {
      console.error("Save credentials error:", err);
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save credentials",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-gray-700" />
        <h2 className="text-xl font-semibold">Shiprocket API Configuration</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Shiprocket Email *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your-email@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Shiprocket Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Shiprocket password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="pickupLocation"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Pickup Location Name *
          </label>
          <input
            type="text"
            id="pickupLocation"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Primary"
          />
          <p className="text-xs text-gray-500 mt-1">
            This should match the pickup location name configured in your
            Shiprocket account
          </p>
        </div>

        <div className="flex items-center justify-between space-x-4">
          <div className="text-sm text-gray-500 italic bg-green-50 p-2 rounded border border-green-200">
            <p className="font-semibold mb-1">
              Webhook URL for Shiprocket (set this in your Shiprocket account):
            </p>
            <p>
              https://kgyyubfudpkdkkftbrdg.supabase.co/functions/v1/shiprocket-webhook
              <span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "https://kgyyubfudpkdkkftbrdg.supabase.co/functions/v1/shiprocket-webhook"
                    );
                  }}
                  className="ml-2 text-blue-600 hover:underline"
                >
                  (Copy)
                </button>
              </span>
            </p>
          </div>
        </div>

        {webhookToken && (
          <div className="flex items-center justify-between space-x-4">
            <div className="text-sm text-gray-500 italic bg-green-50 p-2 rounded border border-green-200">
              <p className="font-semibold mb-1">
                Webhook Token for Shiprocket (set this in your Shiprocket
                account):
              </p>
              <p>
                {webhookToken}
                <span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(webhookToken || "");
                    }}
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    (Copy)
                  </button>
                </span>
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Credentials
            </>
          )}
        </button>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            How to get your credentials:
          </h3>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Log in to your Shiprocket account at shiprocket.in</li>
            <li>Use the same email and password you use to log in</li>
            <li>
              Make sure you have added at least one pickup location in your
              Shiprocket account
            </li>
            <li>
              The pickup location name should exactly match the name in your
              Shiprocket account
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
