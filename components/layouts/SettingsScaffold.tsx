"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";

export type SettingsSection = {
  value: string;
  label: string;
  icon: LucideIcon;
  /** One line under the section title. */
  blurb?: string;
  render: () => React.ReactNode;
};

export type SettingsSectionGroup = {
  label?: string;
  sections: SettingsSection[];
};

/**
 * The shared shell for both the personal Account area and the admin System
 * settings console: a sticky left rail of sections and a single content
 * column. The active section lives in `?section=` so a link can land
 * straight on it and the browser back button works.
 */
export function SettingsScaffold({
  title,
  description,
  groups,
}: {
  title: string;
  description?: string;
  groups: SettingsSectionGroup[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const all = groups.flatMap((group) => group.sections);
  const fromUrl = searchParams.get("section");
  const [active, setActive] = useState(
    all.some((section) => section.value === fromUrl) ? (fromUrl as string) : all[0]?.value,
  );

  function select(value: string) {
    setActive(value);
    const params = new URLSearchParams(searchParams);
    params.set("section", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const current = all.find((section) => section.value === active) ?? all[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={title} description={description} />

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <nav className="lg:sticky lg:top-22 lg:h-fit lg:w-60 lg:shrink-0">
          {/* Horizontal scroller on small screens, vertical rail on large. */}
          <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {groups.map((group, index) => (
              <div key={group.label ?? index} className="contents lg:block">
                {group.label && (
                  <p className="mt-4 mb-1 hidden px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 first:mt-0 lg:block">
                    {group.label}
                  </p>
                )}
                {group.sections.map((section) => {
                  const isActive = section.value === current?.value;
                  return (
                    <button
                      key={section.value}
                      type="button"
                      onClick={() => select(section.value)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <section.icon className="size-4 shrink-0" />
                      <span className="whitespace-nowrap lg:whitespace-normal">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          {current && (
            <div className="max-w-2xl space-y-1">
              <div className="mb-5 flex items-center gap-2.5">
                <current.icon className="size-4.5 text-muted-foreground" />
                <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                  {current.label}
                </h2>
              </div>
              {current.blurb && (
                <p className="-mt-4 mb-5 text-sm text-muted-foreground">{current.blurb}</p>
              )}
              {current.render()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
