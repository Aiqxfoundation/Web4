import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variant === 'default' && "bg-gradient-to-r from-orange-500 to-orange-600 text-primary-foreground hover:from-orange-600 hover:to-orange-700 shadow-sm",
          variant === 'outline' && "border border-border bg-transparent hover:bg-secondary text-foreground",
          variant === 'ghost' && "hover:bg-secondary hover:text-secondary-foreground text-foreground",
          variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          size === 'default' && "h-10 px-4 py-2",
          size === 'sm' && "h-8 rounded-md px-3 text-xs",
          size === 'lg' && "h-12 rounded-md px-8 text-lg",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return <div className={cn("glass-panel rounded-lg", className)}>{children}</div>;
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-muted-foreground mb-1 block", className)} {...props}>{children}</label>;
}

export function Badge({ 
  className, 
  children, 
  variant = 'default' 
}: { 
  className?: string, 
  children: React.ReactNode, 
  variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info' 
}) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors",
      variant === 'default' && "bg-secondary text-secondary-foreground",
      variant === 'success' && "bg-emerald-500/10 text-emerald-500",
      variant === 'destructive' && "bg-destructive/10 text-destructive",
      variant === 'warning' && "bg-amber-500/10 text-amber-500",
      variant === 'info' && "bg-blue-500/10 text-blue-500",
      className
    )}>
      {children}
    </span>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, color, className }: StatCardProps) {
  return (
    <div className={cn("stat-card flex flex-col relative overflow-hidden", className)}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        {icon && <div className={cn("text-muted-foreground", color)}>{icon}</div>}
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
    </div>
  );
}
