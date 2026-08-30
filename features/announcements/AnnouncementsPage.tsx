"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/features/auth/CurrentUserContext";
import { useDisclosure } from "@/hooks/use-disclosure";
import { AnnouncementsList } from "./AnnouncementsList";
import { CreateAnnouncementDialog } from "./CreateAnnouncementDialog";

export function AnnouncementsPage() {
  const user = useCurrentUser();
  const canCreate = user.permissions.includes("announcement.create");
  const canManage = canCreate || user.permissions.includes("announcement.publish");
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Company notices — what's been shared with you, and, if you run comms, everything in flight."
        actions={canCreate ? <Button onClick={open}>New announcement</Button> : undefined}
      />

      {canManage ? (
        <Tabs defaultValue="feed">
          <TabsList>
            <TabsTrigger value="feed">For me</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
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

      {canCreate && <CreateAnnouncementDialog opened={opened} onClose={close} />}
    </>
  );
}
