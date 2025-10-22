import React from "react";
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Calendar,
  User,
  Shield,
} from "lucide-react";

interface TrackingScan {
  date: string;
  status: string;
  activity: string;
  location: string;
  "sr-status": string;
  "sr-status-label": string;
}

export interface ShipmentTrackingData {
  awb: string;
  courier_name: string;
  current_status: string;
  current_status_id: number;
  shipment_status: string;
  shipment_status_id: number;
  current_timestamp: string;
  order_id: string;
  sr_order_id: number;
  awb_assigned_date: string;
  pickup_scheduled_date: string;
  etd: string;
  scans: TrackingScan[];
  is_return: number;
  channel_id: number;
  pod_status: string;
  pod: string;
}

interface ShipmentTrackerProps {
  trackingData?: ShipmentTrackingData;
}

export function ShipmentTracker({ trackingData }: ShipmentTrackerProps) {
  // Filter customer-relevant scans
  const filterCustomerScans = (scans: TrackingScan[]) => {
    const excludeStatuses = ["MANIFEST GENERATED", "NA"];
    const excludeActivities = [
      "manifest",
      "bag added",
      "added to bag",
      "bag received",
      "weight captured",
      "scanned at",
      "sorted",
    ];

    return scans
      ?.filter((scan) => {
        if (excludeStatuses.includes(scan["sr-status-label"])) {
          return false;
        }

        const hasExcludedActivity = excludeActivities.some((keyword) =>
          scan.activity?.toLowerCase().includes(keyword)
        );

        return !hasExcludedActivity;
      })
      .reverse(); // Show latest first
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  // Format location for display
  const formatLocation = (location: string) => {
    return location
      .replace(/_/g, " ")
      .replace(/([A-Z])/g, " $1")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Get status color and icon
  const getStatusInfo = (statusId: number, statusLabel: string) => {
    switch (statusId) {
      case 19: // DELIVERED
        return {
          color: "text-green-600 bg-green-50 border-green-200",
          icon: CheckCircle,
        };
      case 17: // OUT FOR DELIVERY
        return {
          color: "text-blue-600 bg-blue-50 border-blue-200",
          icon: Truck,
        };
      case 18: // IN TRANSIT
        return {
          color: "text-yellow-600 bg-yellow-50 border-yellow-200",
          icon: Package,
        };
      case 42: // PICKED UP
        return {
          color: "text-purple-600 bg-purple-50 border-purple-200",
          icon: Package,
        };
      case 6: // SHIPPED
        return {
          color: "text-indigo-600 bg-indigo-50 border-indigo-200",
          icon: Package,
        };
      default:
        return {
          color: "text-gray-600 bg-gray-50 border-gray-200",
          icon: Circle,
        };
    }
  };

  const customerScans = filterCustomerScans(trackingData?.scans || []);
  const currentStatusInfo = getStatusInfo(
    trackingData?.shipment_status_id,
    trackingData?.shipment_status
  );
  const etdFormatted = formatDate(trackingData?.etd);
  const lastUpdate = formatDate(trackingData?.current_timestamp);

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Track Your Shipment</h2>
            <div className="flex items-center gap-2 text-blue-100">
              <Package className="h-4 w-4" />
              <span className="font-mono text-lg">{trackingData?.awb}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-blue-100 text-sm mb-1">Courier Partner</div>
            <div className="font-semibold">{trackingData?.courier_name}</div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div
        className={`grid grid-cols-1 ${
          trackingData?.pod_status ? "md:grid-cols-3" : "md:grid-cols-2"
        }  gap-4 p-6 bg-gray-50 border-b`}
      >
        {/* Current Status */}

        <div
          className={`flex-1 p-4 rounded-lg border-2 ${currentStatusInfo.color}`}
        >
          <div className="flex items-center gap-3 mb-2">
            <currentStatusInfo.icon className="h-5 w-5 animate-bounce" />
            <span className="font-semibold">Current Status</span>
          </div>
          <div className="text-lg font-bold">
            {trackingData?.shipment_status}
          </div>
          <div className="text-sm opacity-75 mt-1">
            Updated: {formatDate(trackingData?.updated_at).date} at{" "}
            {formatDate(trackingData?.updated_at).time}
          </div>
        </div>

        {/* Expected Delivery */}
        <div className="flex-1 p-4 rounded-lg border-2 border-green-200 bg-green-50 text-green-600">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5" />
            <span className="font-semibold">Expected Delivery</span>
          </div>
          <div className="text-lg font-bold">{etdFormatted.date}</div>
          <div className="text-sm opacity-75 mt-1">by {etdFormatted.time}</div>
        </div>

        {/* Delivery Type */}
        {trackingData?.pod_status && (
          <div className="flex-1 p-4 rounded-lg border-2 border-orange-200 bg-orange-50 text-orange-600">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">Delivery Method</span>
            </div>
            <div className="text-lg font-bold">{trackingData?.pod_status}</div>
            <div className="text-sm opacity-75 mt-1">
              Secure delivery verification
            </div>
          </div>
        )}
      </div>

      {/* Tracking Timeline */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Tracking History
        </h3>

        <div className="space-y-4">
          {customerScans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tracking updates available yet</p>
            </div>
          ) : (
            customerScans.map((scan, index) => {
              const scanDate = formatDate(scan.date);
              const scanStatus = getStatusInfo(
                parseInt(scan["sr-status"]),
                scan["sr-status-label"]
              );
              const StatusIcon = scanStatus.icon;

              return (
                <div key={`${scan.date}-${index}`} className="flex gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`p-2 rounded-full border-2 ${scanStatus.color}`}
                    >
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    {index < customerScans.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Event details */}
                  <div className="flex-1 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {scan.activity
                            .replace("In Transit - ", "")
                            .replace("Shipment ", "")}
                        </h4>

                        {scan.location && (
                          <div className="flex items-center gap-1 text-gray-600 mb-2">
                            <MapPin className="h-3 w-3" />
                            <span className="text-sm">
                              {formatLocation(scan.location)}
                            </span>
                          </div>
                        )}

                        {scan["sr-status-label"] !== "NA" && (
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded-full ${scanStatus.color}`}
                          >
                            {scan["sr-status-label"]}
                          </span>
                        )}
                      </div>

                      <div className="text-right text-sm text-gray-500 sm:min-w-[120px]">
                        <div className="font-medium">{scanDate.date}</div>
                        <div>{scanDate.time}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 px-6 py-4 border-t">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>
              Order ID:{" "}
              <span className="font-mono">{trackingData?.order_id}</span>
            </span>
            <span>•</span>
            <span>
              Shiprocket ID:{" "}
              <span className="font-mono">
                {trackingData?.raw_payload?.sr_order_id ||
                  trackingData?.sr_order_id}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>
              Last updated: {formatDate(trackingData?.updated_at).date} at{" "}
              {formatDate(trackingData?.updated_at).time}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
