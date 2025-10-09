import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  createShiprocketOrder,
  checkServiceability,
  assignAWB,
  generatePickup,
  ShiprocketCredentials,
  ShiprocketOrderPayload,
  CourierServiceability,
} from "../../utils/shiprocket";
import { formatCurrency } from "../../utils/format";
import {
  Truck,
  Loader,
  Package,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeftRight,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { useAuth } from "../../contexts/AuthContext";

interface Order {
  id: string;
  order_number: string;
  items: any[];
  shipping_address: any;
  billing_address: any;
  subtotal: number;
  shipping: number;
  payment_method: string;
  created_at: string;
  shiprocket_order_id?: string;
  shiprocket_shipment_id?: number;
  tracking_number?: string;
}

interface ShiprocketManagerProps {
  orderId: string;
  order: Order;
  shipmentData: any | null;
  onSuccess?: (trackingNumber: string) => void;
}

export function ShiprocketManager({
  orderId,
  order,
  shipmentData,
  onSuccess,
}: ShiprocketManagerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
      >
        Shipping Manager
      </button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Shiprocket Shipment for Order #${order.order_number}`}
        size="lg"
      >
        <ShiprocketComponent
          orderId={orderId}
          order={order}
          shipmentData={shipmentData}
          onSuccess={onSuccess}
        />
      </Modal>
    </>
  );
}

function ShiprocketComponent({
  orderId,
  order,
  shipmentData,
  onSuccess,
}: ShiprocketManagerProps) {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<ShiprocketCredentials | null>(
    null
  );
  const [pickupLocation, setPickupLocation] = useState("Primary");
  const [loading, setLoading] = useState(false);
  const [checkingCouriers, setCheckingCouriers] = useState(false);
  const [couriers, setCouriers] = useState<CourierServiceability[]>([]);
  const [selectedCourier, setSelectedCourier] =
    useState<CourierServiceability | null>(() => {
      if (shipmentData && shipmentData.courier_id) {
        return {
          courier_company_id: shipmentData.courier_id,
          courier_name: shipmentData.courier_name,
          freight_charge: shipmentData.freight_charge,
          cod_charges: shipmentData.cod_charges,
          estimated_delivery_days: shipmentData.estimated_delivery_days,
        };
      }
      return null;
    });
  const [step, setStep] = useState<
    "credentials" | "couriers" | "confirm" | "complete"
  >("credentials");
  const [shipmentDataState, setShipmentDataState] = useState<any | null>(
    shipmentData
  );
  const [awbCode, setAwbCode] = useState<string | null>(
    order.tracking_number || null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials();
    if (order.shiprocket_shipment_id && order.tracking_number) {
      setStep("complete");
    } else if (shipmentData && shipmentData.shipment_id) {
      setStep("confirm");
    }
    console.log("Shipment Data:", shipmentData);
  }, []);

  const loadCredentials = async () => {
    try {
      if (!user) return;

      const { data } = await supabase
        .from("shiprocket_credentials")
        .select("*")
        .eq("seller_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (data) {
        setCredentials({
          email: data.email,
          password: data.password,
        });
        setPickupLocation(data.pickup_location || "Primary");
      }
    } catch (err) {
      console.error("Load credentials error:", err);
    }
  };

  const handleCheckCouriers = async () => {
    if (!credentials) {
      setError("Please configure Shiprocket credentials first");
      return;
    }

    setCheckingCouriers(true);
    setError(null);

    try {
      const totalWeight = order.items.reduce((sum, item) => {
        return sum + (item.weight || 0.5) * item.quantity;
      }, 0);

      const isCOD = order.payment_method === "cod";

      const availableCouriers = await checkServiceability(
        credentials,
        "500049",
        order.shipping_address.pincode,
        isCOD,
        totalWeight > 0 ? totalWeight : 0.5,
        order.subtotal
      );
      const available = availableCouriers.length > 0 ? availableCouriers : [];

      setCouriers(available);
      setStep("couriers");
    } catch (err) {
      console.error("Check serviceability error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to check courier serviceability"
      );
    } finally {
      setCheckingCouriers(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!credentials || !selectedCourier) return;

    setLoading(true);
    setError(null);

    try {
      const totalWeight = order.items.reduce((sum, item) => {
        return sum + (item.weight || 0.5) * item.quantity;
      }, 0);

      const shippingAddr = order.shipping_address;
      const billingAddr = order.billing_address || order.shipping_address;

      const orderPayload: ShiprocketOrderPayload = {
        order_id: order.order_number,
        order_date: new Date(order.created_at).toISOString(),
        pickup_location: pickupLocation,
        billing_customer_name:
          billingAddr.name.split(" ")[0] || billingAddr.name,
        billing_last_name: billingAddr.name.split(" ").slice(1).join(" ") || "",
        billing_address: billingAddr.address_line1,
        billing_address_2: billingAddr.address_line2 || "",
        billing_city: billingAddr.city,
        billing_pincode: billingAddr.pincode,
        billing_state: billingAddr.state,
        billing_country: billingAddr.country || "India",
        billing_email: billingAddr.email || "customer@example.com",
        billing_phone: billingAddr.phone,
        shipping_is_billing: !order.billing_address,
        shipping_customer_name:
          shippingAddr.name.split(" ")[0] || shippingAddr.name,
        shipping_last_name:
          shippingAddr.name.split(" ").slice(1).join(" ") || "",
        shipping_address: shippingAddr.address_line1,
        shipping_address_2: shippingAddr.address_line2 || "",
        shipping_city: shippingAddr.city,
        shipping_pincode: shippingAddr.pincode,
        shipping_country: shippingAddr.country || "India",
        shipping_state: shippingAddr.state,
        shipping_email: shippingAddr.email || "customer@example.com",
        shipping_phone: shippingAddr.phone,
        order_items: order.items.map((item) => ({
          name: item.title || "Product",
          sku: item.sku || item.product_id || "SKU",
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: item.tax || 0,
          hsn: item.hsn_code ? parseInt(item.hsn_code) : undefined,
        })),
        payment_method: order.payment_method === "cod" ? "COD" : "Prepaid",
        shipping_charges: order.shipping || 0,
        sub_total: order.subtotal,
        length: 10,
        breadth: 10,
        height: 10,
        weight: totalWeight > 0 ? totalWeight : 0.5,
      };

      const result = await createShiprocketOrder(credentials, orderPayload);

      if (result.order_id && result.shipment_id) {
        const shippingDetails = {
          order_id: orderId,
          shiprocket_order_id: result.order_id.toString(),
          shipment_id: result.shipment_id,
          courier_id: selectedCourier.courier_company_id,
          courier_name: selectedCourier.courier_name,
          freight_charge: selectedCourier.freight_charge,
          cod_charges: selectedCourier.cod_charges,
          estimated_delivery_days: selectedCourier.estimated_delivery_days,
          status: "created",
          metadata: result,
        };

        setShipmentDataState(shippingDetails);

        await supabase
          .from("orders")
          .update({
            shiprocket_order_id: result.order_id.toString(),
            shiprocket_shipment_id: result.shipment_id,
          })
          .eq("id", orderId);

        await supabase.from("shiprocket_shipments").insert({
          ...shippingDetails,
        });

        setStep("confirm");
      }
    } catch (err) {
      console.error("Create order error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create Shiprocket order"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateShipment = async () => {
    if (!credentials || !selectedCourier) return;

    setLoading(true);
    setError(null);

    try {
      if (
        shipmentDataState?.shiprocket_order_id &&
        shipmentDataState?.shipment_id
      ) {
        const shippingDetails = {
          order_id: orderId,
          shiprocket_order_id: shipmentDataState.shiprocket_order_id.toString(),
          shipment_id: shipmentDataState.shipment_id,
          courier_id: selectedCourier.courier_company_id,
          courier_name: selectedCourier.courier_name,
          freight_charge: selectedCourier.freight_charge,
          cod_charges: selectedCourier.cod_charges,
          estimated_delivery_days: selectedCourier.estimated_delivery_days,
        };

        setShipmentDataState(shippingDetails);

        await supabase
          .from("shiprocket_shipments")
          .update({
            ...shippingDetails,
          })
          .eq("id", shipmentDataState.id);

        setStep("confirm");
      }
    } catch (err) {
      console.error("Create order error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create Shiprocket order"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAWB = async () => {
    if (!credentials || !shipmentDataState || !selectedCourier) return;

    setLoading(true);
    setError(null);

    try {
      const result = await assignAWB(
        credentials,
        shipmentDataState.shipment_id,
        selectedCourier.courier_company_id
      );

      if (result.response?.data?.awb_code) {
        const awb = result.response.data.awb_code;
        setAwbCode(awb);

        await supabase
          .from("orders")
          .update({
            tracking_number: awb,
            status: "processing",
          })
          .eq("id", orderId);

        await supabase
          .from("shiprocket_shipments")
          .update({
            awb_code: awb,
            status: "pickup_scheduled",
          })
          .eq("shipment_id", shipmentDataState.shipment_id);

        await generatePickup(credentials, [shipmentDataState.shipment_id]);

        setStep("complete");

        if (onSuccess) {
          onSuccess(awb);
        }
      } else {
        setError(result?.message || "Failed to assign AWB");
      }
    } catch (err) {
      console.error("Assign AWB error:", err);
      setError(err instanceof Error ? err.message : "Failed to assign AWB");
    } finally {
      setLoading(false);
    }
  };

  if (step === "complete" && awbCode) {
    return (
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">
            Shipment Created Successfully
          </h3>
        </div>
        <div className="space-y-2 text-sm text-green-800">
          <p>
            <span className="font-medium">AWB Code:</span>{" "}
            <span className="font-mono text-lg">{awbCode}</span>
          </p>
          <p>
            <span className="font-medium">Courier:</span>{" "}
            {selectedCourier?.courier_name || "N/A"}
          </p>
          <p className="text-xs text-green-600 mt-3">
            Pickup has been scheduled with the courier partner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === "credentials" && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Create Shiprocket Shipment
          </h3>

          {!credentials ? (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                Please configure your Shiprocket credentials in the seller
                settings to create shipments.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Click below to check available courier services for this order.
              </p>
              <button
                onClick={handleCheckCouriers}
                disabled={checkingCouriers}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {checkingCouriers ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Checking Serviceability...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    Check Available Couriers
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {step === "couriers" && couriers?.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Select Courier Service</h3>
          <div className="space-y-3">
            {couriers.map((courier) => (
              <div
                key={courier.courier_company_id}
                onClick={() => setSelectedCourier(courier)}
                className={`p-5 border rounded-lg cursor-pointer transition-all ${
                  selectedCourier?.courier_company_id ===
                  courier.courier_company_id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header with courier name and key indicators */}
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {courier.courier_name}
                      </h4>
                      {courier.realtime_tracking === "Real Time" && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          Live Tracking
                        </span>
                      )}
                      {courier.call_before_delivery === "Available" && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                          Call Before Delivery
                        </span>
                      )}
                    </div>

                    {/* Performance metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-semibold text-gray-900">
                          {courier.rating}/5
                        </div>
                        <div className="text-xs text-gray-600">
                          Overall Rating
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-semibold text-gray-900">
                          {courier.pickup_performance}/5
                        </div>
                        <div className="text-xs text-gray-600">
                          Pickup Performance
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-semibold text-gray-900">
                          {courier.delivery_performance}/5
                        </div>
                        <div className="text-xs text-gray-600">
                          Delivery Performance
                        </div>
                      </div>
                    </div>

                    {/* Delivery timeline */}
                    <div className="bg-yellow-50 p-3 rounded mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            Expected Delivery: {courier.etd}
                          </div>
                          <div className="text-xs text-gray-600">
                            {courier.estimated_delivery_days} working days •
                            Pickup cutoff: {courier.cutoff_time}
                          </div>
                        </div>
                        <Calendar className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>

                    {/* Cost breakdown */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Freight Charge:</span>
                        <span className="font-semibold">
                          {formatCurrency(courier.freight_charge)}
                        </span>
                      </div>

                      {courier.cod_charges > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">COD Charges:</span>
                          <span className="font-semibold">
                            {formatCurrency(courier.cod_charges)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Coverage Charges:</span>
                        <span className="font-semibold">
                          {formatCurrency(courier.coverage_charges)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">RTO Charges:</span>
                        <span className="font-semibold">
                          {formatCurrency(courier.rto_charges)}
                        </span>
                      </div>
                    </div>

                    {/* Additional service info */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>
                            Mode: {courier.is_surface ? "Surface" : "Air"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          <span>
                            Weight: {courier.min_weight}kg -{" "}
                            {courier.surface_max_weight}kg
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          <span>POD: {courier.pod_available}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>
                            Track Performance: {courier.tracking_performance}/5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Risk indicators */}
                    {courier.rto_performance < 3.5 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <div className="flex items-center gap-1 text-xs text-red-700">
                          <XCircle className="h-3 w-3" />
                          <span>
                            Low RTO Performance: {courier.rto_performance}/5
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total cost sidebar */}
                  <div className="text-right ml-4">
                    <div className="bg-gray-50 p-3 rounded text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(courier.rate)}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">Total Rate</p>

                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Freight:</span>
                          <span>{formatCurrency(courier.freight_charge)}</span>
                        </div>
                        {courier.cod_charges > 0 && (
                          <div className="flex justify-between">
                            <span>COD:</span>
                            <span>{formatCurrency(courier.cod_charges)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Other:</span>
                          <span>
                            {formatCurrency(
                              courier.coverage_charges + courier.other_charges
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {shipmentDataState ? (
            <div className="sticky bottom-0 flex space-x-4 bg-white pt-4 pb-10 mt-4 border-t">
              <button
                onClick={updateShipment}
                disabled={!selectedCourier || loading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Updating Shipment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Update Shipment with Selected Courier
                  </>
                )}
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={!selectedCourier || loading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <>
                  <XCircle className="h-4 w-4" />
                  Discard & Continue to Confirmation
                </>
              </button>
            </div>
          ) : (
            <button
              onClick={handleCreateOrder}
              disabled={!selectedCourier || loading}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Creating Shipment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Create Shipment with Selected Courier
                </>
              )}
            </button>
          )}
        </div>
      )}

      {step === "couriers" && couriers?.length === 0 && !checkingCouriers && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="h-5 w-5" />
            <p className="text-sm">
              No courier services available for this delivery location.
            </p>
          </div>
        </div>
      )}

      {step === "confirm" && shipmentDataState && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Assign AWB Number</h3>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <p className="text-sm text-blue-800">
              Shiprocket order created successfully. Click below to assign AWB
              number and schedule pickup.
            </p>
            <div className="mt-2 text-xs text-blue-600">
              <p>Shipment ID: {shipmentDataState.shipment_id}</p>
              <p>Courier: {selectedCourier?.courier_name}</p>
              <p>
                Freight Charge:{" "}
                <span className="font-semibold">
                  {formatCurrency(shipmentDataState?.freight_charge || 0)}
                </span>
              </p>
              {shipmentDataState?.cod_charges > 0 && (
                <p>
                  COD Charges:{" "}
                  <span className="font-semibold">
                    {formatCurrency(shipmentDataState?.cod_charges || 0)}
                  </span>
                </p>
              )}
              <p>
                Estimated Delivery: {shipmentDataState?.etd} (
                {shipmentDataState?.estimated_delivery_days} working days)
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleAssignAWB}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Assigning AWB...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Assign AWB & Schedule Pickup
                </>
              )}
            </button>
            {!loading && (
              <button
                onClick={handleCheckCouriers}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <>
                  <ArrowLeftRight className="h-4 w-4" />
                  Change Courier partner
                </>
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
