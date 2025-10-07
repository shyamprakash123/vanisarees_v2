import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface CheckoutStepsProps {
  currentStep: number;
  steps: Step[];
}

export function CheckoutSteps({ currentStep, steps }: CheckoutStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center relative flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step.id < currentStep
                    ? 'bg-green-600 border-green-600 text-white'
                    : step.id === currentStep
                    ? 'bg-red-800 border-red-800 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step.id}</span>
                )}
              </div>
              <span
                className={`text-sm mt-2 font-medium ${
                  step.id === currentStep ? 'text-red-800' : 'text-gray-600'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 mb-6 ${
                  step.id < currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
