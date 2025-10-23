import { BadgeCheck, Clock, CreditCard, Wallet, XCircle } from "lucide-react";

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <BadgeCheck className="w-3 h-3" /> Paid
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
          {status || "Unknown"}
        </span>
      );
  }
};

export const getMethodBadge = (method: string) => {
  switch (method) {
    case "cod":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          <Wallet className="w-3 h-3" /> Cash on Delivery
        </span>
      );
    case "prepaid":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          <CreditCard className="w-3 h-3" /> Prepaid
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 capitalize">
          {method}
        </span>
      );
  }
};
