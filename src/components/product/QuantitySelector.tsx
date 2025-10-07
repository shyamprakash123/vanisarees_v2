import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({ quantity, onChange, min = 1, max = 99 }: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Quantity:</span>
      <div className="flex items-center border border-gray-300 rounded-lg">
        <button
          onClick={handleDecrement}
          disabled={quantity <= min}
          className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
        <button
          onClick={handleIncrement}
          disabled={quantity >= max}
          className="p-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
