"use client";

import { createContext, useContext } from "react";
import type { CurrentUser } from "@/types/auth";

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <CurrentUserContext.Provider value={user}>
      {children}
    </CurrentUserContext.Provider>
  );
}

/** Only valid under (dashboard), where the layout guarantees a signed-in user. */
export function useCurrentUser(): CurrentUser {
  const user = useContext(CurrentUserContext);

  if (!user) {
    throw new Error("useCurrentUser() called outside CurrentUserProvider");
  }

  return user;
}
