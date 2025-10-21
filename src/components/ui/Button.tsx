import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500":
              variant === "primary",
            "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus-visible:ring-secondary-200":
              variant === "secondary",
            "border border-primary-500 text-primary-500 hover:bg-primary-50 focus-visible:ring-primary-500":
              variant === "outline",
            "text-secondary-900 hover:bg-secondary-100 focus-visible:ring-secondary-200":
              variant === "ghost",
            "underline-offset-4 hover:underline text-primary-500 hover:text-primary-600":
              variant === "link",
            "h-9 px-4 py-2 text-sm": size === "sm",
            "h-11 px-6 py-3 text-sm": size === "md",
            "h-12 px-8 py-4 text-base": size === "lg",
          },
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
