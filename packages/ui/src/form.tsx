"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "./lib.js";

const fieldBase =
  "block w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:border-redrock-500 focus:outline-none focus:ring-2 focus:ring-redrock-500/20 disabled:opacity-50";

export type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-sm font-medium text-charcoal-800", className)}
      {...props}
    />
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, required, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
    return (
      <div className={cn("w-full", className)}>
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span className="ml-0.5 text-redrock-500" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(fieldBase, error && "border-danger-600 focus:border-danger-600")}
          {...props}
        />
        {hint && !error ? (
          <p id={`${id}-hint`} className="mt-1 text-xs text-charcoal-600">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, required, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
    return (
      <div className={cn("w-full", className)}>
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span className="ml-0.5 text-redrock-500" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
        <textarea
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(fieldBase, "min-h-24", error && "border-danger-600")}
          {...props}
        />
        {hint && !error ? (
          <p id={`${id}-hint`} className="mt-1 text-xs text-charcoal-600">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> &
  FieldProps & {
    options: Array<{ value: string; label: string }>;
  };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, required, options, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
    return (
      <div className={cn("w-full", className)}>
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span className="ml-0.5 text-redrock-500" aria-hidden>
              *
            </span>
          ) : null}
        </Label>
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(fieldBase, error && "border-danger-600")}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {hint && !error ? (
          <p id={`${id}-hint`} className="mt-1 text-xs text-charcoal-600">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = "Select";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  hint?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    return (
      <div className={cn("flex items-start gap-2", className)}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="mt-0.5 size-4 rounded border-charcoal-300 text-redrock-500 focus:ring-redrock-500"
          {...props}
        />
        <div className="grid gap-0.5">
          <label htmlFor={id} className="text-sm font-medium text-charcoal-800">
            {label}
          </label>
          {hint ? <p className="text-xs text-charcoal-600">{hint}</p> : null}
        </div>
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
