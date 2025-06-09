import * as React from "react";

import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "./label";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  postfix?: React.ReactNode;
  preicon?: React.ReactNode;
  error?: boolean;
  label?: string;
  required?: boolean;
  errorMsg?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      postfix,
      preicon,
      label,
      disabled,
      error,
      required,
      errorMsg,
      ...props
    },
    ref
  ) => {
    const [isPasswordVisible, setPasswordVisible] = React.useState(false);
    const togglePasswordVisibility = () => {
      if (!disabled) {
        setPasswordVisible(!isPasswordVisible);
      }
    };
    return (
      <>
        {label && (
          <Label className="text-primary font-semibold">
            {label}
          </Label>
        )}
        <div className="relative w-full flex items-center">
          <input
            type={isPasswordVisible ? "text" : type}
            className={cn(
              error ? "border border-destructive" : "border border-grey-normal",
              "flex h-[52px] w-full rounded-lg  bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-grey-normal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              type === "tel" ? "pl-[70px]" : preicon ? "pl-[40px]" : "",
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            {...props}
          />
          {errorMsg && (
            <span className="text-[#DB1A21] text-sm">{errorMsg}</span>
          )}

          {type === "password" && (
            <button
              type="button"
              className={cn(
                "absolute right-3 top-1/2 transform -translate-y-1/2",
                {
                  "cursor-not-allowed opacity-50": disabled,
                }
              )}
              onClick={togglePasswordVisibility}
              disabled={disabled}
            >
              {isPasswordVisible ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          )}
          {preicon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {preicon}
            </div>
          )}
          {postfix && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {postfix}
            </div>
          )}
        </div>
      </>
    );
  }
);
Input.displayName = "Input";

export { Input };
