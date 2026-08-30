import { Label } from "@/components/ui/label";

export function FormField({
  label,
  htmlFor,
  error,
  description,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description && !error && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

