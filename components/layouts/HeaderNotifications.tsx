"use client";

import { useState } from "react";
import Link from "next/link";
import { BellIcon, CheckIcon, MegaphoneIcon, PalmtreeIcon, WalletIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "LEAVE" | "ANNOUNCEMENT" | "PAYROLL";
  unread: boolean;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Casual Leave Approved",
    description: "Your leave request for 02 May 2026 was approved by Team Leader.",
    time: "10 mins ago",
    type: "LEAVE",
    unread: true,
  },
  {
    id: "notif-2",
    title: "Holiday Notice: Buddha Purnima",
    description: "Office will remain closed on 26 May for Buddha Purnima.",
    time: "2 hours ago",
    type: "ANNOUNCEMENT",
    unread: true,
  },
  {
    id: "notif-3",
    title: "Monthly Salary Slip Ready",
    description: "April 2026 payslip has been prepared and published.",
    time: "1 day ago",
    type: "PAYROLL",
    unread: false,
  },
];

export function HeaderNotifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex size-9 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
        <BellIcon className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 font-mono text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-xl border-border/70">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-xs font-bold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <DropdownMenuSeparator className="my-1" />

        <div className="max-h-80 space-y-1 overflow-y-auto py-1">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-muted/40 cursor-pointer ${
                item.unread ? "bg-primary/[0.03]" : ""
              }`}
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                {item.type === "LEAVE" && <PalmtreeIcon className="size-3.5" />}
                {item.type === "ANNOUNCEMENT" && <MegaphoneIcon className="size-3.5" />}
                {item.type === "PAYROLL" && <WalletIcon className="size-3.5" />}
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${item.unread ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                    {item.title}
                  </p>
                  {item.unread && <span className="size-1.5 rounded-full bg-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground/70 pt-0.5">
                  {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem asChild className="rounded-xl cursor-pointer text-center justify-center py-2 text-xs font-semibold text-primary">
          <Link href="/announcements">
            View all announcements & alerts
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
