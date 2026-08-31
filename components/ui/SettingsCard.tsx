import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * A titled panel for one block of settings — used inside sections that lay
 * out more than a single form. Matches the card the SettingsScaffold wraps
 * simple sections in, so the whole console reads as one surface.
 */
export function SettingsCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="text-[0.95rem] font-bold tracking-tight">{title}</CardTitle>
          )}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
