
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export default function StatCard({ 
  title,
  value,
  icon,
  description,
  trend,
  trendLabel,
  className
}: StatCardProps) {
  const isTrendPositive = trend && trend > 0;
  const isTrendNegative = trend && trend < 0;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-2 flex items-baseline">
          <p className="text-2xl font-semibold">{value}</p>
          {trend !== undefined && (
            <span 
              className={cn(
                "ml-2 text-xs font-medium",
                isTrendPositive ? "text-green-600" : "",
                isTrendNegative ? "text-red-600" : "",
                !isTrendPositive && !isTrendNegative ? "text-gray-500" : ""
              )}
            >
              {isTrendPositive && '+'}
              {trend}%
              {trendLabel && <span className="ml-1">{trendLabel}</span>}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
