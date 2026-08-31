"use client";

import { useMemo } from "react";
import {
  AlertCircleIcon,
  BellIcon,
  CheckCircle2Icon,
  FileTextIcon,
  PlusIcon,
  MegaphoneIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/stat-tile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useAnnouncements } from "@/services/announcements";
import { AnnouncementsList } from "./AnnouncementsList";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";

export function AnnouncementsPage() {
  const user = useCurrentUser();
  const canCreate = user.permissions.includes("announcement.create");
  const canManage = canCreate || user.permissions.includes("announcement.publish");
  const [opened, { open, close }] = useDisclosure(false);

  const { data: feedData } = useAnnouncements({ mine: true });
  const { data: manageData } = useAnnouncements(canManage ? {} : { mine: true });

  const feedList = feedData?.data ?? [];
  const manageList = manageData?.data ?? [];

  const stats = useMemo(() => {
    const actionRequired = feedList.filter(
      (a) => a.acknowledgement_required && !a.my_read?.acknowledged,
    ).length;
    const unread = feedList.filter((a) => !a.my_read).length;
    const publishedCount = manageList.filter((a) => a.status === "PUBLISHED").length;
    const draftCount = manageList.filter((a) => a.status === "DRAFT").length;

    return { actionRequired, unread, publishedCount, draftCount, totalMine: feedList.length };
  }, [feedList, manageList]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements & Notices"
        description="Stay updated with company broadcasts, HR policies, holiday notices, and team announcements."
        actions={
          canCreate ? (
            <Button onClick={open} className="gap-2 shadow-sm">
              <PlusIcon className="size-4" />
              <span>Create Announcement</span>
            </Button>
          ) : undefined
        }
      />

      {/* KPI Overview Tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="For You"
          value={stats.totalMine}
          icon={BellIcon}
          tone="blue"
          subtext={`${stats.unread} unread notices`}
        />
        <StatTile
          label="Action Required"
          value={stats.actionRequired}
          icon={AlertCircleIcon}
          tone="rose"
          subtext="Requires your acknowledgement"
        />
        {canManage && (
          <>
            <StatTile
              label="Active Published"
              value={stats.publishedCount}
              icon={CheckCircle2Icon}
              tone="emerald"
              subtext="Currently visible to employees"
            />
            <StatTile
              label="Drafts in Flight"
              value={stats.draftCount}
              icon={FileTextIcon}
              tone="amber"
              subtext="Pending review or publication"
            />
          </>
        )}
      </div>

      {canManage ? (
        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="bg-muted/60 p-1 border border-border rounded-xl">
            <TabsTrigger value="feed" className="gap-2 text-xs font-medium rounded-lg">
              <BellIcon className="size-3.5" />
              My Notice Feed
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2 text-xs font-medium rounded-lg">
              <MegaphoneIcon className="size-3.5" />
              Manage & Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <AnnouncementsList mode="feed" />
          </TabsContent>
          <TabsContent value="manage">
            <AnnouncementsList mode="manage" />
          </TabsContent>
        </Tabs>
      ) : (
        <AnnouncementsList mode="feed" />
      )}

      {canCreate && <CreateAnnouncementDialog opened={opened} onClose={close} />}
    </div>
  );
}

