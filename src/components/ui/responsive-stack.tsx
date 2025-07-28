import { cn } from "@/lib/utils";

interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: "column" | "row" | "column-reverse" | "row-reverse";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  gap?: "sm" | "md" | "lg";
  wrap?: boolean;
  breakpoint?: "sm" | "md" | "lg";
  className?: string;
}

export function ResponsiveStack({ 
  children, 
  direction = "column",
  align = "stretch",
  justify = "start",
  gap = "md",
  wrap = false,
  breakpoint = "sm",
  className 
}: ResponsiveStackProps) {
  const directionClasses = {
    column: "flex-col",
    row: "flex-row",
    "column-reverse": "flex-col-reverse",
    "row-reverse": "flex-row-reverse"
  };

  const alignClasses = {
    start: "items-start",
    center: "items-center", 
    end: "items-end",
    stretch: "items-stretch"
  };

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly"
  };

  const gapClasses = {
    sm: "gap-2 sm:gap-3",
    md: "gap-3 sm:gap-4",
    lg: "gap-4 sm:gap-6"
  };

  const responsiveClass = direction === "column" 
    ? `flex-col ${breakpoint}:flex-row`
    : `flex-row ${breakpoint}:flex-col`;

  return (
    <div className={cn(
      "flex",
      responsiveClass,
      alignClasses[align],
      justifyClasses[justify],
      gapClasses[gap],
      wrap && "flex-wrap",
      className
    )}>
      {children}
    </div>
  );
}