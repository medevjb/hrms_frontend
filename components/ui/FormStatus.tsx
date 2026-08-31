import { AlertCircleIcon, CircleCheckIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * The error / just-saved banner pair every settings form shows above its
 * fields. Renders nothing until there's something to say.
 */
export function FormStatus({
  error,
  saved,
  savedText = "Saved.",
}: {
  error?: string | null;
  saved?: boolean;
  savedText?: string;
}) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (saved) {
    return (
      <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10">
        <CircleCheckIcon className="text-emerald-600 dark:text-emerald-400" />
        <AlertDescription className="text-emerald-800 dark:text-emerald-300">
          {savedText}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
