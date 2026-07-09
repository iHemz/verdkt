import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost";
};

export function Button({ variant = "solid", className, ...props }: ButtonProps) {
  const cls = ["vk-btn", variant === "ghost" ? "vk-btn-ghost" : "", className]
    .filter(Boolean)
    .join(" ");
  return <button className={cls} {...props} />;
}
