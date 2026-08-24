"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./i18n";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaRegistrar() {
  const { t } = useLocale();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((registration) => registration.update()).catch(() => undefined);
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
    const capture = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallEvent); };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  if (standalone || dismissed) return null;
  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") setDismissed(true);
    setInstallEvent(null);
  };
  return <aside className="install-prompt" aria-label={t("pwaPromptTitle")}><div><b>{t("pwaPromptTitle")}</b><span>{t("pwaPromptBody")}</span><small>{t("pwaInstallSteps")}</small></div><div>{installEvent && <button className="button light" type="button" onClick={install}>{t("installApp")}</button>}<button className="text-button" type="button" onClick={() => setDismissed(true)}>{t("dismissInstall")}</button></div></aside>;
}

export function PwaPanel() {
  const { t } = useLocale();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported");
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);
  const enable = async () => {
    if (!("Notification" in window)) return;
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next === "granted") {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(t("notificationReady"), { body: t("notificationReadyBody"), icon: "/rad-icon.svg", badge: "/rad-icon.svg", data: { url: "/orders" } });
    }
  };
  return <section className="profile-panel pwa-panel"><span className="eyebrow">{t("pwaEyebrow")}</span><h2>{t("pwaTitle")}</h2><p>{standalone ? t("pwaInstalled") : t("pwaInstallHelp")}</p>{!standalone && <small className="pwa-steps">{t("pwaInstallSteps")}</small>}<div className="profile-actions"><button type="button" className="button outline" onClick={enable} disabled={permission === "granted" || permission === "unsupported"}>{permission === "granted" ? t("notificationsEnabled") : t("enableNotifications")}</button></div></section>;
}
