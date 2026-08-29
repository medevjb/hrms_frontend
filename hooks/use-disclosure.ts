import { useCallback, useState } from "react";

/**
 * Boolean state with open/close/toggle handlers — the one thing every
 * modal/dialog trigger in this app needs, without pulling in a library.
 */
export function useDisclosure(
  initial = false,
): [boolean, { open: () => void; close: () => void; toggle: () => void }] {
  const [opened, setOpened] = useState(initial);

  const open = useCallback(() => setOpened(true), []);
  const close = useCallback(() => setOpened(false), []);
  const toggle = useCallback(() => setOpened((current) => !current), []);

  return [opened, { open, close, toggle }];
}
