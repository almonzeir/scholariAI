import * as React from "react";
import clsx from "clsx";

export function Button({ variant = "primary", className, ...props }) {
  const base = "px-8 py-3 rounded-2xl font-semibold transition duration-300 ease-smooth focus:outline-none focus:ring-4";
  const styles = {
    primary: "text-white shadow-xl bg-gradient-to-r from-primary to-accent hover:scale-[1.02] focus:ring-primary/40",
    ghost: "text-white bg-elevated/60 backdrop-blur-md border border-border hover:bg-elevated focus:ring-accent/30",
  }[variant];
  return <button className={clsx(base, styles, className)} {...props} />;
}

// Default export for backward compatibility
export default Button;