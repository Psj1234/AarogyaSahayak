import * as React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
  status?: "default" | "success" | "warning" | "danger" | "normal";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
  variant = "default",
  status
}) => {
  const resolvedVariant = variant !== "default" 
    ? variant 
    : (status === "normal" ? "success" : (status || "default"));

  const variantClasses = {
    default: "bg-gradient-card border-border",
    success: "bg-gradient-to-br from-success/10 to-success/5 border-success/20",
    warning: "bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20",
    danger: "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20"
  };

  const iconColors = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive"
  };

  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 shadow-card backdrop-blur-sm transition-all duration-300",
        variantClasses[variant],
        "hover:shadow-float",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-bold font-nunito text-foreground">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className={cn("flex items-center text-sm font-medium", trendColors[trend])}>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("rounded-xl p-3 bg-background/50", iconColors[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export { StatCard };