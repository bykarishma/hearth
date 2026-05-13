export default function Privacy() {
  return (
    <>
      <style>{`
        body { font-family: 'DM Sans', sans-serif; background: #F0EBE3; color: #1C1C1C; }
        .wrap { max-width: 660px; margin: 0 auto; padding: 4rem 2rem 6rem; }
        .back { font-size: 14px; color: #722F37; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; margin-bottom: 3rem; }
        .back:hover { opacity: 0.7; }
        h1 { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 500; color: #1C1C1C; margin-bottom: 0.5rem; letter-spacing: -0.01em; }
        .meta { font-size: 14px; color: #A09890; margin-bottom: 3rem; }
        .section { margin-bottom: 2.5rem; }
        .section-label { font-size: 11px; font-weight: 600; color: #722F37; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
        p { font-size: 16px; color: #3A3530; line-height: 1.75; }
        .divider { height: 1px; background: #E8E3DC; margin: 2.5rem 0; }
      `}</style>
      <div className="wrap">
        <a className="back" href="/">← Back to Hearth</a>
        <h1>Privacy & Compliance</h1>
        <div className="meta">Last updated March 2026</div>

        <div className="section">
          <div className="section-label">HIPAA</div>
          <p>Hearth is not a HIPAA covered entity. It does not collect, store, or transmit Protected Health Information. The tool is specifically designed to avoid all 18 HIPAA Safe Harbor identifiers. Users are instructed not to enter names, dates of birth, addresses, record numbers, or insurance IDs. No data is retained after the session ends.</p>
        </div>

        <div className="divider" />

        <div className="section">
          <div className="section-label">FHIR Integration</div>
          <p>The optional FHIR R4 integration connects to a FHIR-compatible endpoint to pre-fill medical fields in the current session. Data fetched via FHIR is never stored, logged, or transmitted beyond the browser session. The integration uses the HAPI FHIR R4 sandbox for demonstration purposes.</p>
        </div>

        <div className="divider" />

        <div className="section">
          <div className="section-label">FDA</div>
          <p>Hearth falls within the FDA&apos;s published enforcement discretion category for software that helps patients and caregivers organize and record health information. It does not diagnose, treat, or interpret medical information. The AI organizes and formats only what the caregiver provides.</p>
        </div>

        <div className="divider" />

        <div className="section">
          <div className="section-label">FTC</div>
          <p>Hearth does not operate as a vendor of personal health records under the FTC Health Breach Notification Rule. Nothing is stored, so there is nothing to breach. This tool complies with the FTC Act&apos;s prohibition on deceptive practices.</p>
        </div>

        <div className="divider" />

        <div className="section">
          <div className="section-label">AI Disclosure</div>
          <p>Hearth uses the Anthropic Claude API to organize and summarize what caregivers share. The AI does not add information, give medical advice, or make clinical judgments. Input is not used to train any model. AI output should always be reviewed before sharing.</p>
        </div>

        <div className="divider" />

        <div className="section">
          <div className="section-label">Data</div>
          <p>No names. No personal identifiers. No stored sessions. No analytics that capture form content. No advertising. No data sharing. When your session ends, everything is gone. We cannot retrieve it because we never saved it.</p>
        </div>
      </div>
    </>
  );
}
