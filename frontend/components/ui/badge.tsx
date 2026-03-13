import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[-0.01em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#eef4ff] text-[#2754c5]",
        outline: "border-[#d2d2d7] bg-white text-[#3a3a3c]",
        success: "border-transparent bg-[#e7f6ed] text-[#217a4d]",
        warning: "border-transparent bg-[#fff3de] text-[#9a5b00]",
        destructive: "border-transparent bg-[#fdecec] text-[#b42318]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
