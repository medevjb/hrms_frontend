"use client";

import { useRef, useState } from "react";
import { CameraIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { photoSrc } from "@/lib/photo";
import { cn } from "@/lib/utils";
import { useRemovePhoto, useUploadPhoto } from "@/services/profile";

const MAX_BYTES = 3 * 1024 * 1024;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function AvatarUpload({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const upload = useUploadPhoto();
  const remove = useRemovePhoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const busy = upload.isPending || remove.isPending;
  const src = preview ?? photoSrc(photoUrl);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is over 3 MB. Pick a smaller one.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    try {
      await upload.mutateAsync(file);
      toast.success("Photo updated");
    } catch (caught) {
      setPreview(null);
      toast.error(caught instanceof ApiError ? caught.message : "Couldn't upload that photo.");
    }
  }

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "group relative size-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted ring-1 ring-border/60 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          dragging && "ring-2 ring-primary",
        )}
        aria-label="Change your photo"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center bg-primary/10 text-xl font-bold text-primary">
            {initials(name)}
          </span>
        )}
        <span
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-[11px] font-semibold text-white opacity-0 transition-opacity",
            !busy && "group-hover:opacity-100",
          )}
        >
          <CameraIcon className="size-5" />
          Change
        </span>
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2Icon className="size-5 animate-spin text-white" />
          </span>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Profile photo</p>
        <p className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 3 MB.</p>
        {photoUrl && !preview && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              try {
                await remove.mutateAsync();
                toast.success("Photo removed");
              } catch {
                toast.error("Couldn't remove the photo.");
              }
            }}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
          >
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}
