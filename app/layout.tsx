import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import { getBranding } from "@/lib/branding";
import { proxyMedia } from "@/lib/media";
import { Providers } from "./providers";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  const favicon = proxyMedia(branding.favicon_url);

  return {
    title: {
      default: branding.app_title,
      template: `%s · ${branding.app_title}`,
    },
    description: `${branding.company_name} — Human Resource Management`,
    ...(favicon ? { icons: { icon: favicon } } : {}),
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
