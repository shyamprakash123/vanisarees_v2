import React from "react";
import { MessageCircle } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  sku?: string;
  quantity?: number;
  product_images?: { image_url: string }[];
}

interface WhatsAppOrderButtonProps {
  product: Product;
  defaultQuantity?: number;
  sellerPhone?: string; // Seller WhatsApp number
}

const WhatsAppOrderButton: React.FC<WhatsAppOrderButtonProps> = ({
  product,
  defaultQuantity = 1,
  sellerPhone = "919550607240", // default seller number in international format
}) => {
  const handleWhatsAppOrder = () => {
    const message =
      `Hi! I would like to order the following saree from Vani Sarees:\n\n` +
      `📌 Product: ${product.title}\n` +
      `💰 Price: ₹${product.price}\n` +
      `🔢 Quantity: ${defaultQuantity}\n` +
      (product.sku ? `🆔 SKU: ${product.sku}\n` : "") +
      `Link: vanisarees.in/product/${product.slug}\n` +
      `\nPlease let me know the payment and delivery details.`;

    const whatsappUrl = `https://wa.me/${sellerPhone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <button
      onClick={handleWhatsAppOrder}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
    >
      <MessageCircle className="w-5 h-5" />
      Order on WhatsApp
    </button>
  );
};

export default WhatsAppOrderButton;
