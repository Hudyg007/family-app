import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import App from "../FamilyHub.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import UpdateBanner from "./components/UpdateBanner.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
      {/* Rendered outside AuthProvider so it shows on every screen including login */}
      <UpdateBanner />
    </ErrorBoundary>
  </StrictMode>
);

/* ── Service Worker registration with update detection ── */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      // BASE_URL is "/" in dev and "/family-app/" on GitHub Pages
      const reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);

      // Check for a new SW every hour while the app is open
      setInterval(() => reg.update(), 60 * 60 * 1000);

      // Also check immediately in case the page has been open a while
      reg.update();

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          // "installed" + existing controller = new version waiting
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent("swUpdateReady"));
          }
        });
      });
    } catch (e) {
      console.warn("SW registration failed:", e);
    }
  });
}
