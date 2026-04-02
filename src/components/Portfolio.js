import React from 'react';

export default function Portfolio() {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      padding: 40,
      maxWidth: 600,
      margin: "40px auto",
      textAlign: "center"
    }}>
      <h2 style={{ marginBottom: 24 }}>Investment Portfolio</h2>
      <p style={{ fontSize: 18, color: "#888" }}>
        Your investment portfolio overview will appear here.<br />
        (Feature coming soon!)
      </p>
    </div>
  );
}
