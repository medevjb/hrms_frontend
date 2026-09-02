"use client";

import { useMemo } from "react";
import {
  AlertCircleIcon,
  BellIcon,
  CheckCircle2Icon,
  FileTextIcon,
  MegaphoneIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/stat-tile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useAnnouncements } from "@/services/announcements";
import { AnnouncementsList } from "./AnnouncementsList";
import { SaveAnnouncementDialog } from "./SaveAnnouncementDialog";

export function AnnouncementsPage() {
  const user = useCurrentUser();
  const canCreate = user.permissions.includes("announcement.create");
  const canManage = canCreate || user.permissions.includes("announcement.publish");
  const [opened, { open, close }] = useDisclosure(false);

  const { data: feedData } = useAnnouncements({ mine: true });
  const { data: manageData } = useAnnouncements(canManage ? {} : { mine: true });

  const feedList = useMemo(() => feedData?.data ?? [], [feedData]);
  const manageList = useMemo(() => manageData?.data ?? [], [manageData]);

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
    <>
      <PageHeader
        title="Announcements & Notices"
        description="Company broadcasts, HR policies, holiday notices, and team announcements."
        actions={
          canCreate ? (
            <Button onClick={open}>
              <PlusIcon />
              Create announcement
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="For you"
            value={stats.totalMine}
            icon={BellIcon}
            tone="blue"
            subtext={`${stats.unread} unread`}
          />
          <StatTile
            label="Action required"
            value={stats.actionRequired}
            icon={AlertCircleIcon}
            tone="rose"
            subtext="Awaiting your acknowledgement"
          />
          {canManage && (
            <>
              <StatTile
                label="Published"
                value={stats.publishedCount}
                icon={CheckCircle2Icon}
                tone="emerald"
                subtext="Visible to employees"
              />
              <StatTile
                label="Drafts"
                value={stats.draftCount}
                icon={FileTextIcon}
                tone="amber"
                subtext="Not yet published"
              />
            </>
          )}
        </div>

        {canManage ? (
          <Tabs defaultValue="feed">
            <TabsList>
              <TabsTrigger value="feed">
                <BellIcon />
                My feed
              </TabsTrigger>
              <TabsTrigger value="manage">
                <MegaphoneIcon />
                Manage
              </TabsTrigger>
            </TabsList>
            <TabsContent value="feed" className="pt-6">
              <AnnouncementsList mode="feed" />
            </TabsContent>
            <TabsContent value="manage" className="pt-6">
              <AnnouncementsList mode="manage" />
            </TabsContent>
          </Tabs>
        ) : (
          <AnnouncementsList mode="feed" />
        )}
      </div>

      {canCreate && <SaveAnnouncementDialog opened={opened} onClose={close} />}
    </>
  );
}
