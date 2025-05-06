
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  description?: string;
  linkTo?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  description,
  linkTo = '/'
}: StatCardProps) {
  const content = (
    <CardContent className={cn(
      "flex items-center justify-between gap-4 p-6",
      linkTo && "hover:bg-muted/50 cursor-pointer transition-colors"
    )}>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-3xl font-semibold tracking-tight">{value}</h2>
          {trend !== undefined && (
            <div className={cn(
              "text-xs font-medium",
              trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : ""
            )}>
              {trend > 0 && "+"}{trend}% {trendLabel}
            </div>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
        {icon}
      </div>
    </CardContent>
  );

  if (linkTo) {
    return (
      <Card className="overflow-hidden">
        <Link to={linkTo}>
          {content}
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      {content}
    </Card>
  );
}
