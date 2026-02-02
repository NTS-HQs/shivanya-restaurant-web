import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  active?: boolean;
}

export function BentoCard({
  children,
  className,
  onClick,
  title,
  subtitle,
  icon,
  active = false,
}: BentoCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 relative overflow-hidden group",
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        active && "ring-2 ring-orange-500 ring-offset-2",
        className
      )}
    >
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-4 relative z-10">
          {icon && (
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div>
            {title && (
              <h3 className="font-bold text-lg text-slate-800 leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm font-medium text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>

      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] -mr-8 -mt-8 z-0 transition-colors group-hover:bg-orange-50/50" />
    </div>
  );
}
