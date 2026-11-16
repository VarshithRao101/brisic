"use client";

import { useSyncExternalStore } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Browser "install this web app" prompt, when the browser offers one. */
export function useInstall() {
  const canInstall = useSyncExternalStore(subscribe, () => !!deferred, () => false);
  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    deferred = null;
    notify();
    return choice.outcome === "accepted";
  };
  return { canInstall, install };
}

const inApp = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  /BrisicApp/i.test(navigator.userAgent) ||
  (navigator as unknown as { standalone?: boolean }).standalone === true;

/** True when running as the installed app (PWA or the Android APK), where "get the app" prompts are hidden. */
export function useIsInstalledApp() {
  return useSyncExternalStore(() => () => {}, inApp, () => false);
}
