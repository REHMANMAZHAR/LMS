"use client";

import { FormEvent, useState } from "react";

export default function LoginPanel() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Sign-in failed.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed.");
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
              type="password"
              autoComplete="current-password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter the family code"
              minLength={12}
              required
            />
          </label>
          <button className="primary-button" disabled={busy || code.trim().length < 12}>
            {busy ? "Signing in..." : "Open study system"}
          </button>
        </form>
        {message && <div className="login-error" role="alert">{message}</div>}
        <small className="login-foot">Secure, independent family access · synchronized automatically</small>
      </section>
    </main>
  );
}
