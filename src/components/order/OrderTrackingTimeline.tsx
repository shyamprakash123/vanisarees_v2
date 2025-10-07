import { Check, Package, Truck, Home, XCircle } from 'lucide-react';

interface TimelineStep {
  id: string;
  label: string;
  icon: any;
  date?: string;
}

interface OrderTrackingTimelineProps {
  status: string;
  createdAt: string;
  statusHistory?: Array<{ status: string; timestamp: string }>;
}

export function OrderTrackingTimeline({ status, createdAt }: OrderTrackingTimelineProps) {
  const steps: TimelineStep[] = [
    { id: 'pending', label: 'Order Placed', icon: Package, date: createdAt },
    { id: 'confirmed', label: 'Confirmed', icon: Check },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: Home },
  ];

  if (status === 'cancelled' || status === 'refunded') {
    steps.push({
      id: status,
      label: status === 'cancelled' ? 'Cancelled' : 'Refunded',
      icon: XCircle,
    });
  }

  const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'];
  const currentIndex = statusOrder.indexOf(status);

  const getStepStatus = (stepId: string) => {
    const stepIndex = statusOrder.indexOf(stepId);

    if (status === 'cancelled' || status === 'refunded') {
      if (stepId === status) return 'current';
      if (stepIndex < currentIndex && stepIndex >= 0) return 'completed';
      return 'pending';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Order Tracking</h2>

      <div className="relative">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          if (step.id === 'cancelled' || step.id === 'refunded') {
            if (status !== step.id) return null;
          }

          return (
            <div key={step.id} className="flex items-start gap-4 pb-8 last:pb-0 relative">
              {!isLast && (
                <div
                  className={`absolute left-6 top-12 w-0.5 h-full -ml-px ${
                    stepStatus === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}

              <div
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  stepStatus === 'completed'
                    ? 'bg-green-600 text-white'
                    : stepStatus === 'current'
                    ? status === 'cancelled' || status === 'refunded'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-800 text-white ring-4 ring-red-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepStatus === 'completed' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 pt-2">
                <h3
                  className={`font-semibold mb-1 ${
                    stepStatus === 'current'
                      ? status === 'cancelled' || status === 'refunded'
                        ? 'text-red-800'
                        : 'text-red-800'
                      : stepStatus === 'completed'
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </h3>
                {stepStatus === 'current' && (
                  <p className="text-sm text-gray-600">
                    {status === 'pending' && 'Your order has been placed and is being processed'}
                    {status === 'confirmed' && 'Your order has been confirmed and will be shipped soon'}
                    {status === 'shipped' && 'Your order is on its way'}
                    {status === 'delivered' && 'Your order has been delivered'}
                    {status === 'cancelled' && 'Your order has been cancelled'}
                    {status === 'refunded' && 'Your order has been refunded'}
                  </p>
                )}
                {step.date && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(step.date).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {status === 'delivered' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            Your order has been successfully delivered. Thank you for shopping with us!
          </p>
        </div>
      )}

      {(status === 'cancelled' || status === 'refunded') && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">
            {status === 'cancelled'
              ? 'This order has been cancelled.'
              : 'This order has been refunded.'}
          </p>
        </div>
      )}
    </div>
  );
}
