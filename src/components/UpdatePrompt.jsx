import { useRegisterSW } from "virtual:pwa-register/react";
import ErrorBoundary from "./ErrorBoundary.jsx";

function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      // Check for updates every hour while app is open
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: "#1E1B4B",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 16px",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.25)",
      }}
    >
      <div>
        <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>🚀 Update available</p>
        <p style={{ fontSize: 11, opacity: 0.7, margin: 0 }}>A new version of Family Hub is ready.</p>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: "#6366F1",
          color: "white",
          border: "none",
          borderRadius: 10,
          padding: "8px 16px",
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

/** Wrapped in its own ErrorBoundary so a SW error never blanks the whole app */
export default function UpdatePrompt() {
  return (
    <ErrorBoundary>
      <UpdateBanner />
    </ErrorBoundary>
  );
}
