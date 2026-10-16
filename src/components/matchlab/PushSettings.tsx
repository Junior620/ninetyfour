"use client";
import { useEffect, useState } from "react";
import { api } from "./shared";
import { errorMessage } from "@/lib/matchlab/messages";
export function PushSettings() {
  const [config, setConfig] = useState<{
    configured: boolean;
    publicKey?: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/matchlab/push", { cache: "no-store" })
      .then((r) => r.json())
      .then((c) => {
        if (active) setConfig(c);
      })
      .catch(() => {
        if (active) setMessage("Configuration indisponible.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function update(subscribe: boolean) {
    setBusy(true);
    setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        throw new Error("PUSH_UNSUPPORTED");
      const registration = subscribe
        ? await navigator.serviceWorker.register("/matchlab/sw.js", {
            scope: "/matchlab/",
          })
        : await navigator.serviceWorker.getRegistration("/matchlab/");
      if (!subscribe) {
        await api("push", { action: "unsubscribe" });
        await (
          await registration?.pushManager.getSubscription()
        )?.unsubscribe();
        setMessage("Abonnement aux notifications retiré.");
        return;
      }
      if (!config?.configured || !config.publicKey)
        throw new Error("PUSH_NOT_CONFIGURED");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage(
          "Notifications non autorisées. Les alertes internes restent disponibles.",
        );
        return;
      }
      const key = Uint8Array.from(
        atob(config.publicKey.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      );
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration!.pushManager.getSubscription()) ||
        (await registration!.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }));
      try {
        await api("push", {
          action: "subscribe",
          subscription: subscription.toJSON(),
        });
      } catch (e) {
        await subscription.unsubscribe();
        throw e;
      }
      setMessage("Abonnement enregistré. Aucun message de test envoyé.");
    } catch (e) {
      setMessage(
        errorMessage(e instanceof Error ? e.message : "INTERNAL_ERROR"),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ml-card">
      <h2>Notifications sur cet appareil</h2>
      <p>
        {config?.configured
          ? "Activez les notifications uniquement sur un appareil personnel. Leur contenu ne comprend aucune donnée de joueur."
          : "Le service Push n’est pas configuré. Les alertes internes fonctionnent sans abonnement."}
      </p>
      <div className="ml-actions">
        <button
          className="ml-button"
          disabled={!config?.configured || busy}
          onClick={() => update(true)}
        >
          Activer les notifications
        </button>
        <button
          className="ml-button secondary"
          disabled={busy}
          onClick={() => update(false)}
        >
          Retirer mon abonnement
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
