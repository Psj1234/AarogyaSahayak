import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface MedicalCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "elevated" | "outlined" | "gradient";
  children: React.ReactNode;
}

const MedicalCard = React.forwardRef<HTMLDivElement, MedicalCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantClasses = {
      default: "medical-card",
      elevated: "medical-card shadow-float hover-lift",
      outlined: "bg-card border-2 border-primary/20 rounded-2xl hover:border-primary/40 transition-colors",
      gradient: "bg-gradient-card border border-border/50 rounded-2xl shadow-card backdrop-blur-sm"
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(variantClasses[variant], "overflow-hidden", className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MedicalCard.displayName = "MedicalCard";

const MedicalCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-2 p-6", className)} {...props} />
  )
);
MedicalCardHeader.displayName = "MedicalCardHeader";

const MedicalCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={cn("text-xl font-nunito font-semibold leading-tight tracking-tight text-card-foreground", className)} 
      {...props} 
    />
  )
);
MedicalCardTitle.displayName = "MedicalCardTitle";

const MedicalCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props} />
  )
);
MedicalCardDescription.displayName = "MedicalCardDescription";

const MedicalCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
MedicalCardContent.displayName = "MedicalCardContent";

const MedicalCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-between p-6 pt-0", className)} {...props} />
  )
);
MedicalCardFooter.displayName = "MedicalCardFooter";

export { 
  MedicalCard, 
  MedicalCardHeader, 
  MedicalCardFooter, 
  MedicalCardTitle, 
  MedicalCardDescription, 
  MedicalCardContent 
};