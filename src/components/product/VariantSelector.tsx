interface Variant {
  name: string;
  options: string[];
}

interface VariantSelectorProps {
  variants: Variant[];
  selected: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

export function VariantSelector({ variants, selected, onChange }: VariantSelectorProps) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-4">
      {variants.map((variant) => (
        <div key={variant.name}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {variant.name}: <span className="text-gray-900">{selected[variant.name]}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((option) => (
              <button
                key={option}
                onClick={() => onChange(variant.name, option)}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  selected[variant.name] === option
                    ? 'border-red-800 bg-red-50 text-red-800'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
