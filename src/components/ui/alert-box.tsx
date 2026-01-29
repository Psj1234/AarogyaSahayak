import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBoxProps {
  type: "success" | "warning" | "danger" | "info";
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  animated?: boolean;
}

const AlertBox: React.FC<AlertBoxProps> = ({
  type,
  title,
  message,
  dismissible = true,
  onDismiss,
  className,
  animated = true
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const alertConfig = {
    success: {
      icon: CheckCircle,
      bgClass: "bg-gradient-to-r from-success/10 to-success/5",
      borderClass: "border-success/30",
      iconClass: "text-success",
      titleClass: "text-success-foreground",
      pulseClass: "animate-pulse"
    },
    warning: {
      icon: AlertTriangle,
      bgClass: "bg-gradient-to-r from-warning/10 to-warning/5",
      borderClass: "border-warning/30",
      iconClass: "text-warning",
      titleClass: "text-warning-foreground",
      pulseClass: "animate-pulse"
    },
    danger: {
      icon: XCircle,
      bgClass: "bg-gradient-to-r from-destructive/10 to-destructive/5",
      borderClass: "border-destructive/30",
      iconClass: "text-destructive",
      titleClass: "text-destructive-foreground",
      pulseClass: "animate-pulse"
    },
    info: {
      icon: Info,
      bgClass: "bg-gradient-to-r from-primary/10 to-primary/5",
      borderClass: "border-primary/30",
      iconClass: "text-primary",
      titleClass: "text-primary-foreground",
      pulseClass: ""
    }
  };

  const config = alertConfig[type];
  const Icon = config.icon;

  const alertVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      scale: 0.95
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={animated ? alertVariants : undefined}
          initial={animated ? "hidden" : undefined}
          animate={animated ? "visible" : undefined}
          exit={animated ? "exit" : undefined}
          className={cn(
            "relative rounded-2xl border p-4 shadow-card",
            config.bgClass,
            config.borderClass,
            className
          )}
        >
          <div className="flex items-start space-x-3">
            <div className={cn("mt-0.5", config.iconClass, config.pulseClass)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              {title && (
                <h4 className={cn("text-sm font-semibold font-nunito", config.titleClass)}>
                  {title}
                </h4>
              )}
              <p className="text-sm text-foreground leading-relaxed">
                {message}
              </p>
            </div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { AlertBox };