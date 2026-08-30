import { SearchIcon } from "lucide-react";
import { AppSidebar } from "@/components/layouts/AppSidebar";
import { RouteGuard } from "@/components/layouts/RouteGuard";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CheckInDialog } from "@/features/attendance/CheckInDialog";
import { UserMenu } from "@/features/auth/UserMenu";

export function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background/50">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-card/90 px-4 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <div className="relative hidden w-64 md:block lg:w-80">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                className="h-9 w-full rounded-full border border-border/60 bg-muted/40 pl-9 pr-9 text-xs font-medium text-foreground placeholder:text-muted-foreground transition-all hover:bg-muted/70 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <kbd className="pointer-events-none absolute top-1/2 right-2.5 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded bg-background font-mono text-[10px] font-semibold text-muted-foreground shadow-xs border border-border/60">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle className="hidden sm:inline-flex" />
            <UserMenu />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </SidebarInset>
      <CheckInDialog />
    </SidebarProvider>
  );
}

