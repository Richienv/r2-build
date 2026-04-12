"use client";

export function R2OSLink() {
  return (
    <button
      onClick={() => { window.location.href = "https://r2-os.vercel.app"; }}
      className="font-mono btn-press"
      style={{
        fontSize: 9,
        color: "#F0F0F025",
        letterSpacing: 1,
        padding: "4px 8px",
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      R2·OS ↗
    </button>
  );
}
