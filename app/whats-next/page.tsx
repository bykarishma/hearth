"use client";

import { useState } from "react";

type Step = "form" | "loading" | "plan";

interface Plan {
  week1: string[];
  weeks23: string[];
  week4: string[];
}

export default function WhatsNext() {
  const [step, setStep] = useState<Step>("form");
  const [careStage, setCareStage] = useState("");
  const [condition, setCondition] = useState("");
  const [concern, setConcern] = useState("");
  const [timeAvailable, setTimeAvailable] = useState("");
  const [isPrimary, setIsPrimary] = useState<boolean | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setStep("loading");
    setError(null);
    try {
      const res = await fetch("/api/whats-next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careStage, condition, concern, timeAvailable, isPrimary }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setPlan(data);
      setStep("plan");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("form");
    }
  }

  function reset() {
    setStep("form");
    setCareStage(""); setCondition(""); setConcern("");
    setTimeAvailable(""); setIsPrimary(null);
    setPlan(null); setError(null);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:          #F0EBE3;
          --surface:     #FAF7F3;
          --surface-alt: #F4EFE8;
          --burg:        #722F37;
          --burg-deep:   #591E26;
          --burg-light:  #F5EAEB;
          --burg-border: #D4A8AC;
          --ink:         #1C1C1C;
          --ink-soft:    #3A3530;
          --muted:       #6E6560;
          --faint:       #A09890;
          --border:      #DDD7CF;
          --border-soft: #E8E3DC;
          --radius-sm:   10px;
          --radius-md:   16px;
          --radius-lg:   24px;
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        .wrap { max-width: 620px; margin: 0 auto; padding: 3rem 2rem 6rem; }

        .top-nav {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2.5rem;
        }

        .back-link {
          font-size: 14px;
          color: var(--muted);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .back-link:hover { color: var(--ink); }

        .wm-icon {
          width: 26px; height: 26px;
          background: var(--burg);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          margin-left: auto;
        }

        .wm-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 500;
          color: var(--ink); letter-spacing: 0.04em;
        }

        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 5vw, 38px);
          font-weight: 500;
          color: var(--ink);
          line-height: 1.25;
          letter-spacing: -0.01em;
          margin-bottom: 0.75rem;
        }

        .page-sub {
          font-size: 15px;
          color: var(--muted);
          line-height: 1.65;
          margin-bottom: 2.5rem;
          max-width: 480px;
        }

        .form-card {
          background: var(--surface);
          border: 1px solid var(--border-soft);
          border-radius: var(--radius-lg);
          padding: 8px 0;
          margin-bottom: 1.5rem;
        }

        .form-field {
          padding: 18px 22px;
        }

        .form-divider {
          height: 1px;
          background: var(--border-soft);
        }

        .field-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--ink-soft);
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .opt-tag {
          font-size: 11px;
          font-weight: 400;
          color: var(--faint);
          background: var(--surface-alt);
          padding: 2px 8px;
          border-radius: 100px;
        }

        select, input[type="text"] {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: var(--ink);
          background: var(--surface);
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        select:focus, input[type="text"]:focus {
          outline: none;
          border-color: var(--burg);
          box-shadow: 0 0 0 3px rgba(114,47,55,0.1);
        }

        .toggle-row {
          display: flex;
          gap: 10px;
        }

        .toggle-btn {
          flex: 1;
          padding: 11px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }

        .toggle-btn:hover { border-color: var(--burg-border); color: var(--ink); }
        .toggle-btn.active { background: var(--burg-light); border: 2px solid var(--burg); color: var(--burg); font-weight: 500; }

        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 17px;
          background: var(--burg);
          color: #FAF0F1;
          border: none;
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 17px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 18px rgba(114,47,55,0.22);
        }

        .btn-primary:hover { background: var(--burg-deep); box-shadow: 0 6px 24px rgba(114,47,55,0.32); }
        .btn-primary:disabled { background: var(--border); color: var(--faint); cursor: not-allowed; box-shadow: none; }
        .btn-primary:focus-visible { outline: 3px solid var(--burg); outline-offset: 3px; }

        .btn-ghost {
          display: block;
          width: 100%;
          padding: 15px;
          background: transparent;
          color: var(--muted);
          border: 1px solid var(--border);
          border-radius: 100px;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.15s;
          text-align: center;
        }

        .btn-ghost:hover { background: var(--surface); color: var(--ink); }

        .error-banner {
          background: #FFF0F0;
          border: 1px solid #FFC0C0;
          border-radius: var(--radius-md);
          padding: 14px 16px;
          margin-bottom: 1rem;
          font-size: 14px;
          color: #8B2020;
        }

        /* Loading */
        .loading-screen {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .loading-dots { display: flex; gap: 8px; justify-content: center; margin-bottom: 1.5rem; }
        .loading-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--burg);
          animation: blink 1.4s ease-in-out infinite;
        }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%,80%,100% { opacity:0.2;transform:scale(0.8); } 40% { opacity:1;transform:scale(1); } }
        .loading-heading { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; color: var(--ink); margin-bottom: 6px; }
        .loading-sub { font-size: 14px; color: var(--faint); }

        /* Plan output */
        .plan-section { margin-bottom: 1.75rem; }

        .plan-period {
          font-size: 11px;
          font-weight: 600;
          color: var(--burg);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .plan-period::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--burg-border);
        }

        .plan-items { display: flex; flex-direction: column; gap: 8px; }

        .plan-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px 16px;
          background: var(--surface);
          border: 1px solid var(--border-soft);
          border-radius: var(--radius-sm);
        }

        .plan-item-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--burg);
          flex-shrink: 0;
          margin-top: 7px;
        }

        .plan-item-text {
          font-size: 15px;
          color: var(--ink-soft);
          line-height: 1.6;
        }

        .disclaimer {
          font-size: 13px;
          color: var(--muted);
          line-height: 1.6;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-soft);
        }

        @media (max-width: 480px) {
          .wrap { padding: 2rem 1.25rem 5rem; }
        }

        button:focus-visible { outline: 3px solid var(--burg); outline-offset: 2px; }
      `}</style>

      <div className="wrap">

        {/* Nav */}
        <div className="top-nav">
          <a className="back-link" href="/">← Back</a>
          <div className="wm-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FAF0F1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <span className="wm-name">Hearth</span>
        </div>

        {/* Form */}
        {step === "form" && (
          <>
            <h1 className="page-title">What&apos;s next?</h1>
            <p className="page-sub">Answer five questions and get a personalized 30-day action plan built around your situation.</p>

            {error && <div className="error-banner">{error} <button onClick={generate} style={{background:"none",border:"none",color:"#8B2020",cursor:"pointer",textDecoration:"underline",padding:0,fontFamily:"inherit"}}>Try again</button></div>}

            <div className="form-card">

              <div className="form-field">
                <label className="field-label" htmlFor="careStage">Where are you in the caregiving journey?</label>
                <select id="careStage" value={careStage} onChange={e => setCareStage(e.target.value)}>
                  <option value="">Select one</option>
                  <option value="Early Diagnosis">Early diagnosis</option>
                  <option value="Active Treatment">Active treatment</option>
                  <option value="Recovery or Ongoing Care">Recovery or ongoing care</option>
                  <option value="End of Life">End of life</option>
                </select>
              </div>

              <div className="form-divider" />

              <div className="form-field">
                <label className="field-label" htmlFor="concern">What is your most pressing concern right now?</label>
                <select id="concern" value={concern} onChange={e => setConcern(e.target.value)}>
                  <option value="">Select one</option>
                  <option value="Medical decisions">Medical decisions</option>
                  <option value="Insurance and financial">Insurance and financial</option>
                  <option value="Daily caregiving logistics">Daily caregiving logistics</option>
                  <option value="Emotional support">Emotional support</option>
                  <option value="Coordinating with family">Coordinating with family</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-divider" />

              <div className="form-field">
                <label className="field-label" htmlFor="timeAvailable">How much time do you have per week to manage care?</label>
                <select id="timeAvailable" value={timeAvailable} onChange={e => setTimeAvailable(e.target.value)}>
                  <option value="">Select one</option>
                  <option value="Less than 5 hours">Less than 5 hours</option>
                  <option value="5 to 10 hours">5 to 10 hours</option>
                  <option value="10 or more hours">10 or more hours</option>
                </select>
              </div>

              <div className="form-divider" />

              <div className="form-field">
                <label className="field-label">Are you the primary caregiver?</label>
                <div className="toggle-row">
                  <button className={`toggle-btn${isPrimary === true ? " active" : ""}`} onClick={() => setIsPrimary(true)}>Yes</button>
                  <button className={`toggle-btn${isPrimary === false ? " active" : ""}`} onClick={() => setIsPrimary(false)}>No</button>
                </div>
              </div>

              <div className="form-divider" />

              <div className="form-field">
                <label className="field-label" htmlFor="condition">
                  Primary condition or diagnosis <span className="opt-tag">Optional</span>
                </label>
                <input
                  type="text"
                  id="condition"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  placeholder="e.g. Parkinson's, congestive heart failure, dementia..."
                />
              </div>

            </div>

            <button
              className="btn-primary"
              disabled={!careStage || !concern || !timeAvailable || isPrimary === null}
              onClick={generate}
            >
              Build my 30-day plan →
            </button>
          </>
        )}

        {/* Loading */}
        {step === "loading" && (
          <div className="loading-screen" role="status" aria-live="polite">
            <div className="loading-dots" aria-hidden="true">
              <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
            </div>
            <div className="loading-heading">Building your plan...</div>
            <div className="loading-sub">Usually takes about 10 seconds</div>
          </div>
        )}

        {/* Plan output */}
        {step === "plan" && plan && (
          <>
            <h1 className="page-title">Your 30-day plan</h1>
            <p className="page-sub" style={{marginBottom:"2rem"}}>Built around your situation. Start with Week 1 and go from there.</p>

            <div className="plan-section">
              <div className="plan-period">Week 1 — Immediate priorities</div>
              <div className="plan-items">
                {plan.week1.map((item, i) => (
                  <div className="plan-item" key={i}>
                    <div className="plan-item-dot" />
                    <div className="plan-item-text">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="plan-section">
              <div className="plan-period">Weeks 2 and 3 — Short-term actions</div>
              <div className="plan-items">
                {plan.weeks23.map((item, i) => (
                  <div className="plan-item" key={i}>
                    <div className="plan-item-dot" />
                    <div className="plan-item-text">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="plan-section">
              <div className="plan-period">Week 4 — Looking ahead</div>
              <div className="plan-items">
                {plan.week4.map((item, i) => (
                  <div className="plan-item" key={i}>
                    <div className="plan-item-dot" />
                    <div className="plan-item-text">{item}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="disclaimer">
              This plan is a starting point. Always consult your care team for medical decisions.
            </div>

            <div style={{marginTop:"2rem",display:"flex",flexDirection:"column" as const,gap:10}}>
              <button className="btn-primary" onClick={() => window.print()}>Print or save as PDF</button>
              <button className="btn-ghost" onClick={reset}>Start over</button>
            </div>
          </>
        )}

      </div>
    </>
  );
}
