"use client";

import { FormEvent, useState } from "react";

export default function LoginPanel() {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"error" | "success" | "">("");
  const [busy, setBusy] = useState(false);
  const codeLength = code.trim().length;

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setMessageKind("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Sign-in failed.");
      setMessage("Code accepted. Opening the study system...");
      setMessageKind("success");
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
      setMessageKind("error");
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-brand"><span>T</span><div><strong>Talha</strong><small>CIE 2027 Study System</small></div></div>
        <span className="eyebrow">PRIVATE FAMILY WORKSPACE</span>
        <h1>Study progress,<br />always in sync.</h1>
        <p>Use the family access code on Talha&apos;s Fire HD and the parent&apos;s iPhone. No ChatGPT account is required.</p>
        <form onSubmit={signIn}>
          <label>
            Family access code
            <input
              type={showCode ? "text" : "password"}
              autoComplete="current-password"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setMessage("");
                setMessageKind("");
              }}
              placeholder="Enter the family code"
              minLength={12}
              required
            />
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
            color: "#566863",
            cursor: "pointer",
            fontSize: 11,
          }}>
            <input
              type="checkbox"
              checked={showCode}
              onChange={(event) => setShowCode(event.target.checked)}
              style={{
                width: 16,
                height: 16,
                margin: 0,
                padding: 0,
                accentColor: "#174b43",
              }}
            />
            Show family access code
          </label>
          <button className="primary-button" disabled={busy || codeLength < 12}>
            {busy ? "Signing in..." : "Open study system"}
          </button>
        </form>
        {code.length > 0 && codeLength < 12 && !message && (
          <div className="login-error" role="status">Enter at least 12 characters.</div>
        )}
        {message && (
          <div
            className="login-error"
            role={messageKind === "success" ? "status" : "alert"}
            style={messageKind === "success" ? {
              borderColor: "#b8d7cb",
              background: "#e0eee8",
              color: "#246353",
            } : undefined}
          >
            {message}
          </div>
        )}
        <small className="login-foot">Secure, independent family access · synchronized automatically</small>
      </section>
    </main>
  );
}
