import React, {
  createContext,
  useContext,
  useId,
  useState,
  useCallback,
} from "react";
import { X, CheckCircle, Info, AlertTriangle } from "lucide-react";

// VaniSarees custom toaster using shadcn-style classes (Tailwind + shadcn conventions)
// Usage:
// 1. Wrap your app with <ToasterProvider />
// 2. Call `const { toast } = useToast()` then `toast({ title, description, variant })`

type ToastVariant = "default" | "success" | "error" | "info";

type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  duration?: number; // ms
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (t: Omit<ToastItem, "id">) => void;
  dismiss: (id?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToasterProvider");
  return ctx;
}

function IconForVariant({ variant }: { variant?: ToastVariant }) {
  switch (variant) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case "error":
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case "info":
      return <Info className="w-5 h-5 text-sky-600" />;
    default:
      return <Info className="w-5 h-5 text-gray-600" />;
  }
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = `toast-${Math.random().toString(36).slice(2, 9)}`;
    const item: ToastItem = {
      id,
      title: t.title,
      description: t.description,
      variant: t.variant ?? "default",
      duration: t.duration ?? 4000,
    };
    setToasts((s) => [item, ...s]);

    // auto-dismiss
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, item.duration);

    return id;
  }, []);

  const dismiss = useCallback((id?: string) => {
    if (!id) {
      setToasts([]);
      return;
    }
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-50 pointer-events-none">
        <div className="flex flex-col gap-3 items-center md:items-end">
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const id = useId();
  const variant = toast.variant ?? "default";

  const base =
    "pointer-events-auto w-80 max-w-full rounded-xl shadow-lg border overflow-hidden";

  const variantStyles: Record<ToastVariant, string> = {
    default: "bg-white border-gray-100",
    success: "bg-emerald-50 border-emerald-100",
    error: "bg-red-50 border-red-100",
    info: "bg-sky-50 border-sky-100",
  };

  const titleColor: Record<ToastVariant, string> = {
    default: "text-gray-900",
    success: "text-emerald-800",
    error: "text-red-800",
    info: "text-sky-800",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic
      id={id}
      className={`${base} ${variantStyles[variant]} transition transform translate-y-0 animate-slideUp pointer-events-auto`}
    >
      <div className="flex items-start p-3">
        <div className="mr-3 flex-shrink-0">
          <IconForVariant variant={variant} />
        </div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <div
              className={`font-semibold ${titleColor[variant]} text-sm truncate`}
            >
              {toast.title}
            </div>
          )}
          {toast.description && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-3">
              {toast.description}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-3 p-1 rounded-md hover:bg-gray-100 text-gray-500"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// small helper animation (should be in your global CSS)
// .animate-slideUp { animation: slideUp 320ms cubic-bezier(.16,.8,.25,1); }
// @keyframes slideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

// Example usage:
// function SomeComponent() {
//  const { toast } = useToast();
//  return <button onClick={() => toast({ title: 'Added to cart', description: 'Saree added to cart', variant: 'success' })}>Add</button>
// }
