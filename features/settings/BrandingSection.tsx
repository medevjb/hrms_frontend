"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageLoadingSkeleton } from "@/components/ui/PageLoadingSkeleton";
import { toast } from "@/components/ui/toast";
import { proxyMedia } from "@/lib/media";
import { useBrandingSettings, useUpdateBranding } from "@/services/settings";
import type { Branding } from "@/types/settings";

type ImageSlot = {
  label: string;
  hint: string;
  url: string | null;
  file: File | null;
  cleared: boolean;
};

function ImagePicker({
  slot,
  onPick,
  onClear,
  square,
}: {
  slot: ImageSlot;
  onPick: (file: File) => void;
  onClear: () => void;
  square?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const preview = slot.file
    ? URL.createObjectURL(slot.file)
    : slot.cleared
      ? null
      : proxyMedia(slot.url);

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex ${square ? "size-14" : "h-14 w-24"} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="size-full object-contain" />
        ) : (
          <ImageIcon className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()}>
            <UploadIcon className="size-3.5" />
            {preview ? "Replace" : "Upload"}
          </Button>
          {preview && (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              <Trash2Icon className="size-3.5" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{slot.hint}</p>
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onPick(file);
          }}
        />
      </div>
    </div>
  );
}

function Form({ initial }: { initial: Branding }) {
  const update = useUpdateBranding();
  const router = useRouter();
  const [companyName, setCompanyName] = useState(initial.company_name);
  const [appTitle, setAppTitle] = useState(
    initial.app_title === initial.company_name ? "" : initial.app_title,
  );
  const [logo, setLogo] = useState<{ file: File | null; cleared: boolean }>({
    file: null,
    cleared: false,
  });
  const [favicon, setFavicon] = useState<{ file: File | null; cleared: boolean }>({
    file: null,
    cleared: false,
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    update.mutate(
      {
        company_name: companyName,
        app_title: appTitle.trim() || null,
        logo: logo.file,
        favicon: favicon.file,
        remove_logo: logo.cleared && !logo.file,
        remove_favicon: favicon.cleared && !favicon.file,
      },
      {
        onSuccess: () => {
          setLogo({ file: null, cleared: false });
          setFavicon({ file: null, cleared: false });
          toast.success("Branding saved");
          router.refresh();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Company name" htmlFor="brand_company">
        <Input
          id="brand_company"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </FormField>
      <FormField
        label="App title"
        htmlFor="brand_title"
        description="Shown in the sidebar and the browser tab. Leave blank to use the company name."
      >
        <Input
          id="brand_title"
          placeholder={companyName}
          value={appTitle ?? ""}
          onChange={(e) => setAppTitle(e.target.value)}
        />
      </FormField>

      <FormField label="Logo">
        <ImagePicker
          slot={{
            label: "Logo",
            hint: "PNG, SVG or WebP. Shown at 36px in the sidebar.",
            url: initial.logo_url,
            file: logo.file,
            cleared: logo.cleared,
          }}
          onPick={(file) => setLogo({ file, cleared: false })}
          onClear={() => setLogo({ file: null, cleared: true })}
        />
      </FormField>

      <FormField label="Favicon">
        <ImagePicker
          square
          slot={{
            label: "Favicon",
            hint: "PNG, ICO or SVG. Shown in the browser tab.",
            url: initial.favicon_url,
            file: favicon.file,
            cleared: favicon.cleared,
          }}
          onPick={(file) => setFavicon({ file, cleared: false })}
          onClear={() => setFavicon({ file: null, cleared: true })}
        />
      </FormField>

      <Button type="submit" disabled={update.isPending}>
        {update.isPending ? "Saving…" : "Save branding"}
      </Button>
    </form>
  );
}

export function BrandingSection() {
  const { data, isLoading } = useBrandingSettings();

  if (isLoading || !data) return <PageLoadingSkeleton />;

  return <Form initial={data} />;
}
