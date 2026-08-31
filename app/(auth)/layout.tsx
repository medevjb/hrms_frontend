import { SparklesIcon } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { getBranding } from "@/lib/branding";
import { proxyMedia } from "@/lib/media";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const branding = await getBranding();
  const logoUrl = proxyMedia(branding.logo_url);

  return (
    <div className="flex min-h-screen flex-1">
      {/* Brand panel — a calm, always-dark surface that carries the identity.
          Hidden below lg so the form gets the full screen on phones. */}
      <aside className="relative hidden w-[44%] max-w-2xl flex-col justify-between overflow-hidden bg-[oklch(0.20_0.05_275)] p-12 lg:flex xl:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.09) 1px, transparent 0)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 110% 80% at 25% 0%, black, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse 110% 80% at 25% 0%, black, transparent 78%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1/3 left-1/2 h-[70%] w-[85%] -translate-x-1/2 rounded-full"
          style={{
            background: "radial-gradient(ellipse, oklch(0.55 0.22 275 / 0.5), transparent 70%)",
          }}
        />

        <div className="relative flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small branded asset, no next/image config in this app
            <img src={logoUrl} alt="" className="size-11 rounded-2xl bg-white/10 object-contain p-1" />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-indigo-400 shadow-lg shadow-primary/40">
              <SparklesIcon className="size-6 text-white" />
            </div>
          )}
          <div>
            <p className="font-heading text-lg font-extrabold tracking-tight text-white">
              {branding.app_title}
            </p>
            {branding.company_name !== branding.app_title && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                {branding.company_name}
              </p>
            )}
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-heading text-[2rem] font-extrabold leading-[1.15] tracking-tight text-white xl:text-[2.5rem]">
            The whole agency&apos;s people operations, in one system.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-white/55">
            Attendance, leave, shifts and payroll — managed together, visible to the people who
            need them, and auditable end to end.
          </p>
        </div>

        <p className="relative text-xs text-white/35">
          © {new Date().getFullYear()} {branding.company_name}
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 flex-col items-center justify-center bg-background px-5 py-14 sm:px-8">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="mb-9 flex items-center gap-2.5 lg:hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small branded asset, no next/image config in this app
            <img src={logoUrl} alt="" className="size-9 rounded-xl object-contain" />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-indigo-400">
              <SparklesIcon className="size-5 text-white" />
            </div>
          )}
          <span className="font-heading text-base font-extrabold tracking-tight">
            {branding.app_title}
          </span>
        </div>

        <div className="w-full max-w-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
