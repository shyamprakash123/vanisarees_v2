import React, { useState } from "react";
import {
  Copy,
  Check,
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";

interface Product {
  id: string;
  price: number;
  commission_rate?: number;
}

const ReferralShare = ({ sampleProduct }: { sampleProduct?: Product }) => {
  const [copied, setCopied] = useState(false);
  const { affiliateUser } = useAuth();
  const { toast } = useToast();

  const referralCode = affiliateUser?.affiliate_id;
  const referralLink = referralCode
    ? `${window.location.origin}?ref=${referralCode}`
    : `${window.location.origin}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Success", description: "Copied", variant: "success" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareData = {
    title: "Vani Sarees Referral",
    text: affiliateUser
      ? "✨ Discover elegant sarees from Vani Sarees! Use my referral link and enjoy exclusive offers:"
      : "💰 Join the Vani Sarees Affiliate Program and earn commission on every sale!",
    url: referralLink,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      alert(
        "Sharing not supported on this device. Please copy the link instead."
      );
    }
  };

  // Calculate commission if affiliate user
  const commissionRate = sampleProduct?.commission_rate ?? 5;
  const basePrice = sampleProduct?.price ?? 1000;
  const commissionValue = (basePrice * commissionRate) / 100;

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg flex flex-col items-center gap-4 mx-auto border border-amber-100">
      <h2 className="text-xl font-semibold text-[#991B1B]">
        {affiliateUser ? "Invite & Earn" : "Join Our Affiliate Program"}
      </h2>

      <p className="text-sm text-gray-600 text-center">
        {affiliateUser
          ? "Share your Vani Sarees referral link and earn exciting rewards when your friends shop! 💃"
          : "Become a Vani Sarees affiliate partner and start earning commission on every sale you refer! 💰"}
      </p>

      {/* Show commission info if affiliate */}
      {affiliateUser && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 w-full text-center">
          <p className="text-sm text-gray-800">
            💸{" "}
            <span className="font-semibold text-[#991B1B]">
              {commissionRate}%
            </span>{" "}
            commission on every sale!
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Example: Earn ₹{commissionValue.toFixed(2)} on a ₹{basePrice} saree
          </p>
        </div>
      )}

      {/* Referral or Join Link Box */}
      <div className="w-full flex items-center justify-between bg-amber-50 rounded-lg p-3">
        <span className="truncate text-sm text-gray-800">{referralLink}</span>
        <button
          onClick={handleCopy}
          className="ml-2 p-2 bg-[#991B1B] text-white rounded-lg hover:bg-[#7d1616] transition"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={() =>
            window.open(
              `https://wa.me/?text=${encodeURIComponent(
                shareData.text + " " + referralLink
              )}`
            )
          }
          className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
        >
          <MessageCircle className="w-4 h-4" />
        </button>

        <button
          onClick={() =>
            window.open(
              `https://t.me/share/url?url=${encodeURIComponent(
                referralLink
              )}&text=${encodeURIComponent(shareData.text)}`
            )
          }
          className="p-3 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition"
        >
          <Send className="w-4 h-4" />
        </button>

        <button
          onClick={() =>
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                referralLink
              )}`
            )
          }
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
        >
          <Facebook className="w-4 h-4" />
        </button>

        <button
          onClick={() =>
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                shareData.text
              )}&url=${encodeURIComponent(referralLink)}`
            )
          }
          className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition"
        >
          <Twitter className="w-4 h-4" />
        </button>

        <button
          onClick={handleNativeShare}
          className="p-3 bg-[#991B1B] text-white rounded-full hover:bg-[#7d1616] transition"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Elegant sarees crafted with love ❤️ by Vani Sarees
      </p>
    </div>
  );
};

export default ReferralShare;
