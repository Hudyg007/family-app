import { Component } from "react";

/**
 * Catches any render error in child components and shows a recovery screen
 * instead of a blank page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[FamilyHub] Render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)",
            padding: 24,
            fontFamily: "'Inter',system-ui,sans-serif",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 32,
              maxWidth: 360,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: "#1f2937", marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 24 }}>
              Your data is safe — tap below to reload the app.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                width: "100%",
                padding: "12px 0",
                background: "#4f46e5",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
