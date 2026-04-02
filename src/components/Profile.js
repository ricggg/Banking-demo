import React, { useState } from 'react';

export default function Profile({ user }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    setMessage('Profile updated! (Demo)');
    // In a real app, send the updated info to your backend here
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      padding: 40,
      maxWidth: 420,
      margin: "40px auto",
      textAlign: "center"
    }}>
      <h2 style={{ marginBottom: 24 }}>Profile</h2>
      <img
        src={user?.avatar || "https://randomuser.me/api/portraits/men/32.jpg"}
        alt="Profile"
        style={{
          width: 90, height: 90, borderRadius: "50%", border: "3px solid #2563eb", marginBottom: 18, objectFit: "cover"
        }}
      />
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Phone</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
        <button
          type="submit"
          style={{
            width: '100%',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '14px 0',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            marginTop: 10
          }}
        >
          Update Profile
        </button>
        {message && (
          <div style={{
            marginTop: 18,
            color: "#28a745",
            fontWeight: 600,
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

const labelStyle = {
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 6,
  display: "block"
};
const inputStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ddd",
  marginTop: 6,
  fontSize: 16,
  boxSizing: "border-box"
};
