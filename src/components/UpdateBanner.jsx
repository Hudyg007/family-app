import { useState, useEffect } from "react";

/**
 * Shows a fixed banner whenever a new service worker has taken control.
 * Rendered at the very top of the app so it appears on every screen.
 */
export default function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Fires when a new SW takes control of the page
    const onControllerChange = () => setShow(true);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    // Also catch the custom event dispatched by main.jsx when an update is found
    const onSwUpdate = () => setShow(true);
    window.addEventListener("swUpdateReady", onSwUpdate);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("swUpdateReady", onSwUpdate);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top) + 10px)",
        left: 12,
        right: 12,
        zIndex: 999999,
        background: "#1E1B4B",
        color: "white",
        borderRadius: 16,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        animation: "fadeUp 0.3s ease-out",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 13, margin: 0, whiteSpace: "nowrap" }}>
          🚀 Update available
        </p>
        <p style={{ fontSize: 11, opacity: 0.65, margin: 0 }}>
          New version of Family App is ready
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "#6366F1",
          color: "white",
          border: "none",
          borderRadius: 10,
          padding: "8px 14px",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }}
      >
        Update Now
      </button>
    </div>
  );
}
