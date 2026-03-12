import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 rounded-lg text-sm
            bg-[var(--bg-tertiary)] text-[var(--text-primary)]
            border transition-colors duration-[var(--transition-fast)]
            placeholder:text-[var(--text-tertiary)]
            focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? "border-[var(--color-error)]" : "border-[var(--border-primary)]"}
            ${className}
          `.trim()}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--color-error)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
