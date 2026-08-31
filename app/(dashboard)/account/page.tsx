import { Suspense } from "react";
import { AccountPage } from "@/features/account/AccountPage";

export const metadata = { title: "My profile" };

export default function Account() {
  return (
    <Suspense>
      <AccountPage />
    </Suspense>
  );
}
