"use client";

import { useState } from "react";

type Stage = "Active care" | "Palliative care" | "Hospice care" | "Bereavement";
type Step = "hero" | "stage" | "q1" | "q2" | "q3" | "loading" | "brief";

interface Brief {
  atAGlance: string;
  careStage: string;
  conditions: string | null;
  medications: string | null;
  allergies: string | null;
  importantNotes: string | null;
  forYou: string | null;
}

const STAGES: { id: Stage; desc: string }[] = [
  { id: "Active care",     desc: "Managing an ongoing condition or recovery" },
  { id: "Palliative care", desc: "Focus has shifted to comfort and quality of life" },
  { id: "Hospice care",    desc: "End of life support and presence" },
  { id: "Bereavement",     desc: "Navigating life after a recent loss" },
];

const WELLBEING_OPTIONS = [
  { value: "exhausted", label: "I'm exhausted but keeping it together" },
  { value: "grief",     label: "Grief that has already started, even though they're still here" },
  { value: "guilt",     label: "Guilt about not doing enough" },
  { value: "lonely",    label: "Loneliness — feeling like nobody really understands" },
  { value: "fear",      label: "Fear about what comes next" },
  { value: "anger",     label: "Anger — at the situation, at how unfair this is" },
  { value: "relief",    label: "Relief mixed with guilt about feeling relieved" },
  { value: "ok",        label: "I'm managing okay most of the time" },
];

const TIMELINE: Record<Stage, { period: string; items: string[] }[]> = {
  "Active care": [
    { period: "Today", items: ["Write down your loved one's current medications and conditions", "Identify one family member or friend who can share the load", "Locate their insurance card and primary doctor's number"] },
    { period: "Days 1–3", items: ["Schedule a conversation with their primary care provider", "Set up a simple medication tracking system", "Tell your employer you may need flexibility — you don't have to share details"] },
    { period: "Days 4–7", items: ["Research whether a home health aide is needed", "Ask their doctor about what to expect in coming weeks", "Find one hour this week that is just for you"] },
    { period: "Week 2+", items: ["Connect with a caregiver support group — online counts", "Review insurance coverage for home care or specialist visits", "Revisit this brief and update anything that has changed"] },
  ],
  "Palliative care": [
    { period: "Today", items: ["Ask the palliative care team what comfort means for your loved one right now", "Write down what a good day looks like for them", "Tell someone close to you what you are going through"] },
    { period: "Days 1–3", items: ["Ask about a hospice or palliative social worker — their job is to help families like yours", "Clarify what medications are for comfort vs. treatment", "Give yourself permission to not have all the answers"] },
    { period: "Days 4–7", items: ["Have one honest conversation with your loved one about what they want, if they are able", "Identify who in the family needs to be kept informed and how", "Find a grief counselor or therapist — anticipatory grief is real and you deserve support"] },
    { period: "Week 2+", items: ["Ask about advance directives if not already in place — caringinfo.org has free resources", "Plan for respite — even a few hours matters", "Connect with others who have been through this"] },
  ],
  "Hospice care": [
    { period: "Today", items: ["Ask the hospice team what to expect in the coming days and weeks", "Make sure everyone who needs to be there knows how to get there", "Tell the people who love you that you need support too"] },
    { period: "Days 1–3", items: ["Ask the hospice social worker about grief resources for family members", "Clarify what the hospice team handles vs. what falls to you", "Write down anything your loved one has expressed about their wishes"] },
    { period: "Days 4–7", items: ["Designate one family member as the primary contact for updates", "Allow yourself to grieve — you don't have to wait", "Ask about bereavement support — most hospice organizations offer it"] },
    { period: "Week 2+", items: ["Take care of practical documents if not already done", "Stay connected to the hospice social worker", "Remember that being present is enough — you don't have to fix this"] },
  ],
  "Bereavement": [
    { period: "Today", items: ["You don't have to do anything today except be", "Call one person who can sit with you, even quietly", "Know that what you are feeling is real and it is allowed"] },
    { period: "Days 1–3", items: ["Handle only what is truly urgent — most things can wait", "Eat something. Sleep if you can. Ask for help with both.", "Let people help you in concrete ways — meals, errands, presence"] },
    { period: "Days 4–7", items: ["Look into bereavement support — GriefShare, hospice bereavement programs, or a therapist", "Begin notifying institutions only as you have energy", "Know that grief is not linear and there is no timeline you have to follow"] },
    { period: "Week 2+", items: ["Consider a grief group — being with others who understand is powerful", "Be patient with yourself as your identity shifts outside the caregiving role", "The Family Caregiver Alliance (caregiver.org) has bereavement resources specifically for former caregivers"] },
  ],
};

const RESOURCES = [
  { name: "Family Caregiver Alliance", desc: "Free helpline, resources, and support groups for caregivers at every stage.", url: "https://caregiver.org", phone: "800-445-8106" },
  { name: "The Conversation Project", desc: "Tools to help families talk about end of life wishes before a crisis.", url: "https://theconversationproject.org" },
  { name: "CaringInfo", desc: "Free advance directive forms and hospice information from the National Hospice Foundation.", url: "https://caringinfo.org" },
  { name: "GriefShare", desc: "Support groups for people grieving a death — includes anticipatory grief resources.", url: "https://griefshare.org" },
  { name: "AARP Caregiver Support", desc: "Local and virtual caregiver support groups, articles, and a helpline.", url: "https://aarp.org/caregiving" },
];

export default function Home() {
  const [step, setStep]                   = useState<Step>("hero");
  const [stage, setStage]                 = useState<Stage | null>(null);
  const [situation, setSituation]         = useState("");
  const [situationMore, setSituationMore] = useState("");
  const [medical, setMedical]             = useState("");
  const [medications, setMedications]     = useState("");
  const [allergies, setAllergies]         = useState("");
  const [recentChanges, setRecentChanges] = useState("");
  const [wellbeing, setWellbeing]         = useState<string[]>([]);
  const [brief, setBrief]                 = useState<Brief | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [q1Open, setQ1Open]               = useState(false);
  const [q2Open, setQ2Open]               = useState(false);

  function goTo(s: Step) {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleWellbeing(val: string) {
    setWellbeing(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  }

  async function generate() {
    goTo("loading");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage, situation, situationMore,
          medical, medications, allergies, recentChanges,
          caregiverWellbeing: wellbeing.join(", "),
        }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();
      setBrief(data);
      goTo("brief");
    } catch {
      setError("Something went wrong. Please try again.");
      goTo("q3");
    }
  }

  function reset() {
    setStep("hero"); setStage(null); setSituation(""); setSituationMore("");
    setMedical(""); setMedications(""); setAllergies(""); setRecentChanges("");
    setWellbeing([]); setBrief(null); setError(null);
    setQ1Open(false); setQ2Open(false);
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #F0EBE3;
          --surface:      #FAF7F3;
          --surface-alt:  #F4EFE8;
          --burg:         #722F37;
          --burg-deep:    #591E26;
          --burg-light:   #F5EAEB;
          --burg-border:  #D4A8AC;
          --ink:          #1C1C1C;
          --ink-soft:     #3A3530;
          --muted:        #6E6560;
          --faint:        #A09890;
          --border:       #DDD7CF;
          --border-soft:  #E8E3DC;
          --radius-sm:    10px;
          --radius-md:    16px;
          --radius-lg:    24px;
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          font-size: 17px;
          line-height: 1.65;
        }

        /* ── Animations ── */
        @keyframes rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .f1 { animation: rise 0.6s ease both 0.05s; }
        .f2 { animation: rise 0.6s ease both 0.2s; }
        .f3 { animation: rise 0.6s ease both 0.35s; }
        .f4 { animation: rise 0.6s ease both 0.5s; }
        .f5 { animation: rise 0.6s ease both 0.65s; }

        /* ── Hero ── */
        .hero-bg {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .hero-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          z-index: 0;
        }
        .hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(240,235,227,0.7) 0%, rgba(240,235,227,0.88) 100%);
          z-index: 1;
        }
        .hero {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
          padding: 5rem 2rem 4rem;
          max-width: 720px; width: 100%;
        }

        /* ── Wordmark ── */
        .wordmark { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 3rem; }
        .wm-icon {
          width: 48px; height: 48px;
          background: var(--burg); border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 6px;
          box-shadow: 0 4px 18px rgba(114,47,55,0.28);
        }
        .wm-name { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 500; color: var(--ink); letter-spacing: 0.06em; line-height: 1; }
        .wm-tag  { font-size: 11px; font-weight: 400; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }

        /* ── Trust pill ── */
        .trust-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 100px; padding: 7px 16px;
          margin-bottom: 2.5rem; flex-wrap: wrap; justify-content: center;
        }
        .tp-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); white-space: nowrap; }
        .tp-dot  { width: 4px; height: 4px; border-radius: 50%; background: var(--border); }
        .tp-tick { width: 14px; height: 14px; border-radius: 50%; background: var(--burg-light); border: 1px solid var(--burg-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* ── Hero headline / sub ── */
        .hero-headline {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 4.5vw, 42px);
          font-weight: 500; color: var(--ink);
          line-height: 1.22; letter-spacing: -0.01em;
          margin-bottom: 2rem; max-width: 560px;
        }
        .hero-headline em { font-style: italic; color: var(--burg); }
        .hero-sub { font-size: 14px; font-weight: 300; color: var(--muted); line-height: 1.75; margin-bottom: 1.75rem; max-width: 440px; }

        /* ── CTA ── */
        .btn-cta {
          display: inline-flex; align-items: center; gap: 12px;
          padding: 17px 36px; background: var(--burg); color: #FAF0F1;
          font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 500;
          border: none; border-radius: 100px; cursor: pointer;
          box-shadow: 0 6px 24px rgba(114,47,55,0.3);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          margin-bottom: 1rem;
        }
        .btn-cta:hover { background: var(--burg-deep); transform: translateY(-2px); box-shadow: 0 10px 32px rgba(114,47,55,0.38); }
        .btn-cta:active { transform: translateY(0); }
        .btn-cta:focus-visible { outline: 3px solid var(--burg); outline-offset: 3px; }
        .cta-note { font-size: 13px; font-weight: 400; color: var(--ink-soft); margin-bottom: 3.5rem; }

        /* ── What section ── */
        .what-divider { display: flex; align-items: center; gap: 14px; width: 100%; max-width: 660px; margin-bottom: 1.75rem; }
        .wd-line { flex: 1; height: 1px; background: var(--border); }
        .wd-label { font-size: 11px; font-weight: 500; color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.14em; white-space: nowrap; }
        .what-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; width: 100%; max-width: 660px; text-align: left; }
        .what-card { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 20px 18px; display: flex; flex-direction: column; gap: 10px; transition: border-color 0.2s, transform 0.2s; }
        .what-card:hover { border-color: var(--burg-border); transform: translateY(-2px); }
        .wc-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .ic-brief { background: var(--burg-light); }
        .ic-you   { background: #EEE8F0; }
        .ic-print { background: var(--surface-alt); border: 1px solid var(--border-soft); }
        .wc-title { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 500; color: var(--ink-soft); line-height: 1.25; }
        .wc-body  { font-size: 15px; font-weight: 400; color: var(--muted); line-height: 1.65; }

        /* ── Questionnaire ── */
        .q-wrap { max-width: 660px; margin: 0 auto; padding: 2.5rem 2rem 6rem; }
        .q-wm   { display: flex; align-items: center; gap: 8px; margin-bottom: 2rem; }
        .q-wm-icon { width: 26px; height: 26px; background: var(--burg); border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .q-wm-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 500; color: var(--ink); letter-spacing: 0.04em; }
        .progress-track { height: 3px; background: var(--border-soft); border-radius: 100px; overflow: hidden; margin-bottom: 7px; }
        .progress-fill  { height: 100%; background: var(--burg); border-radius: 100px; transition: width 0.4s ease; }
        .progress-label { font-size: 12px; color: var(--faint); margin-bottom: 2.5rem; }
        .big-q { font-family: 'Cormorant Garamond', serif; font-size: clamp(22px,4vw,30px); font-weight: 500; color: var(--ink); line-height: 1.35; margin-bottom: 0.75rem; letter-spacing: -0.01em; }
        .q-sub { font-size: 15px; color: var(--muted); line-height: 1.6; margin-bottom: 1.75rem; }

        /* Banner */
        .banner { display: flex; gap: 12px; align-items: flex-start; background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 1.75rem; }
        .banner-text { font-size: 14px; color: var(--muted); line-height: 1.55; }
        .banner.warm { background: #F8F2F3; border-color: var(--burg-border); }
        .banner.warm .banner-text { color: #6B3A40; }

        /* Stage buttons */
        .stage-grid { display: flex; flex-direction: column; gap: 10px; }
        .stage-btn { width: 100%; text-align: left; padding: 17px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 14px; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .stage-btn:hover { border-color: var(--burg-border); background: var(--burg-light); }
        .stage-btn.sel { border: 2px solid var(--burg); background: var(--burg-light); }
        .s-name { font-size: 16px; font-weight: 500; color: var(--ink); margin-bottom: 3px; }
        .s-desc { font-size: 13px; color: var(--muted); }
        .s-check { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .stage-btn.sel .s-check { background: var(--burg); border-color: var(--burg); }

        /* Fields */
        .field { margin-bottom: 1.25rem; }
        .field-label { font-size: 14px; font-weight: 500; color: var(--ink-soft); margin-bottom: 7px; display: flex; align-items: center; gap: 8px; }
        .opt-tag { font-size: 11px; font-weight: 400; color: var(--faint); background: var(--surface-alt); padding: 2px 8px; border-radius: 100px; }
        textarea { width: 100%; padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius-md); font-family: 'DM Sans', sans-serif; font-size: 16px; color: var(--ink); background: var(--surface); resize: vertical; min-height: 108px; line-height: 1.65; transition: border-color 0.15s, box-shadow 0.15s; }
        textarea::placeholder { color: var(--faint); font-size: 15px; }
        textarea:focus { outline: none; border-color: var(--burg); box-shadow: 0 0 0 3px rgba(114,47,55,0.1); }
        .expand-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: var(--burg); background: none; border: none; cursor: pointer; padding: 7px 0; margin-top: 4px; font-family: 'DM Sans', sans-serif; }
        .expand-btn:hover { opacity: 0.7; }
        .expand-chevron { font-size: 11px; display: inline-block; transition: transform 0.2s; }
        .expand-chevron.open { transform: rotate(90deg); }
        .expand-body { display: none; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid var(--border-soft); }
        .expand-body.open { display: block; }

        /* Checkboxes */
        .check-list { display: flex; flex-direction: column; gap: 8px; }
        .check-item { display: flex; align-items: flex-start; gap: 14px; padding: 15px 17px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; user-select: none; transition: all 0.15s; }
        .check-item:hover { border-color: var(--burg-border); background: var(--burg-light); }
        .check-item input[type="checkbox"] { width: 19px; height: 19px; margin-top: 2px; accent-color: var(--burg); flex-shrink: 0; cursor: pointer; }
        .check-item span { font-size: 16px; color: var(--ink-soft); line-height: 1.5; }

        /* Buttons */
        .btn-primary { display: flex; align-items: center; justify-content: center; width: 100%; padding: 17px; background: var(--burg); color: #FAF0F1; border: none; border-radius: 100px; font-family: 'DM Sans', sans-serif; font-size: 17px; font-weight: 500; cursor: pointer; margin-top: 2rem; transition: background 0.2s, box-shadow 0.2s, transform 0.1s; box-shadow: 0 4px 18px rgba(114,47,55,0.22); }
        .btn-primary:hover { background: var(--burg-deep); box-shadow: 0 6px 24px rgba(114,47,55,0.32); }
        .btn-primary:active { transform: scale(0.99); }
        .btn-primary:disabled { background: var(--border); color: var(--faint); cursor: not-allowed; box-shadow: none; }
        .btn-primary:focus-visible { outline: 3px solid var(--burg); outline-offset: 3px; }
        .btn-ghost { display: block; width: 100%; padding: 15px; background: transparent; color: var(--muted); border: 1px solid var(--border); border-radius: 100px; font-family: 'DM Sans', sans-serif; font-size: 16px; cursor: pointer; margin-top: 10px; transition: all 0.15s; text-align: center; }
        .btn-ghost:hover { background: var(--surface); border-color: #bbb; color: var(--ink); }

        /* Error */
        .error-banner { background: #FFF0F0; border: 1px solid #FFC0C0; border-radius: var(--radius-md); padding: 14px 16px; margin-top: 1rem; font-size: 14px; color: #8B2020; }

        /* Loading */
        .loading-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem; background: var(--bg); }
        .loading-logo { font-family: 'Cormorant Garamond', serif; font-size: 14px; color: var(--burg); text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; margin-bottom: 2.5rem; }
        .loading-dots { display: flex; gap: 8px; justify-content: center; margin-bottom: 1.5rem; }
        .loading-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--burg); animation: blink 1.4s ease-in-out infinite; }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%,80%,100% { opacity:0.2;transform:scale(0.8); } 40% { opacity:1;transform:scale(1); } }
        .loading-heading { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 400; color: var(--ink); margin-bottom: 8px; }
        .loading-sub { font-size: 15px; color: var(--faint); }

        /* Brief */
        .brief-wrap { max-width: 660px; margin: 0 auto; padding: 2.5rem 2rem 6rem; }
        .brief-top { padding-bottom: 2rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
        .brief-wm  { display: flex; align-items: center; gap: 8px; margin-bottom: 1.5rem; }
        .brief-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em; margin-bottom: 4px; }
        .brief-meta  { font-size: 14px; color: var(--faint); }
        .brief-glance { background: var(--burg-light); border: 1px solid var(--burg-border); border-radius: var(--radius-md); padding: 22px 24px; margin-bottom: 10px; }
        .brief-glance-label { font-size: 11px; font-weight: 500; color: var(--burg); text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 10px; }
        .brief-glance-body  { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--burg-deep); line-height: 1.75; }
        .brief-card { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 20px 22px; margin-bottom: 10px; }
        .brief-card-label { font-size: 11px; font-weight: 500; color: var(--faint); text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 10px; }
        .brief-card-body  { font-size: 16px; color: var(--ink-soft); line-height: 1.75; }
        .disclosure { font-size: 12px; color: var(--faint); line-height: 1.65; margin-top: 2rem; padding-top: 1.75rem; border-top: 1px solid var(--border-soft); }

        /* For the caregiver */
        .ftc-section { margin-top: 2.5rem; padding-top: 2.5rem; border-top: 1px solid var(--border); }
        .ftc-eyebrow { font-size: 12px; font-weight: 500; color: var(--burg); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem; }
        .ftc-ack { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 400; color: var(--ink-soft); line-height: 1.7; margin-bottom: 2rem; font-style: italic; }
        .timeline-period { margin-bottom: 1.5rem; }
        .tl-label { font-size: 12px; font-weight: 500; color: var(--burg); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 8px; }
        .tl-label::after { content: ''; flex: 1; height: 1px; background: var(--burg-border); }
        .tl-items { display: flex; flex-direction: column; gap: 8px; }
        .tl-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius-sm); }
        .tl-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--burg); flex-shrink: 0; margin-top: 7px; }
        .tl-text { font-size: 15px; color: var(--ink-soft); line-height: 1.55; }
        .resources-section { margin-top: 2rem; }
        .res-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 500; color: var(--ink); margin-bottom: 1rem; }
        .res-card { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 16px 18px; margin-bottom: 10px; }
        .res-name { font-size: 15px; font-weight: 500; color: var(--ink); margin-bottom: 3px; }
        .res-desc { font-size: 14px; color: var(--muted); line-height: 1.55; margin-bottom: 8px; }
        .res-links { display: flex; gap: 12px; flex-wrap: wrap; }
        .res-link { font-size: 13px; color: var(--burg); text-decoration: none; font-weight: 500; }
        .res-link:hover { text-decoration: underline; }

        /* Print */
        @media print {
          .hero-bg, .q-wrap .btn-primary, .q-wrap .btn-ghost, .no-print { display: none !important; }
          .brief-wrap { padding: 1rem; max-width: 100%; }
          .ftc-section { page-break-before: always; }
        }

        /* Responsive */
        @media (max-width: 580px) {
          .what-cards { grid-template-columns: 1fr; }
          .hero { padding: 3rem 1.25rem 3rem; }
          .q-wrap { padding: 2rem 1.25rem 5rem; }
        }

        button:focus-visible, textarea:focus-visible, input:focus-visible {
          outline: 3px solid var(--burg); outline-offset: 2px;
        }
      `}</style>

      {/* ═══ HERO ═══ */}
      {step === "hero" && (
        <>
        <div className="hero-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-img" src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1920&q=80" alt="" aria-hidden="true" />
          <div className="hero-overlay" />
          <div className="hero">
            <div className="wordmark f1">
              <div className="wm-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FAF0F1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>
                </svg>
              </div>
              <span className="wm-name">Hearth</span>
              <span className="wm-tag">Caregiver briefing tool</span>
            </div>

            <h1 className="hero-headline f2">
              For everyone navigating caregiving<br />before they <em>feel ready.</em>
            </h1>

            <p className="hero-sub f3">
              Answer a few questions about what you already know. Walk away with something organized, clear, and ready to use.
            </p>

            <button className="btn-cta f3" onClick={() => goTo("stage")}>
              Get started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>

            <div className="trust-pill f1">
              {["No account","Nothing saved","Completely free","No names needed"].map((t, i, arr) => (
                <span key={t} style={{display:"inline-flex",alignItems:"center",gap:6}}>
                  <span className="tp-item">
                    <span className="tp-tick">
                      <svg width="8" height="6" viewBox="0 0 10 8" fill="none" stroke="#722F37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4L3.5 7 9 1"/></svg>
                    </span>
                    {t}
                  </span>
                  {i < arr.length - 1 && <span className="tp-dot" />}
                </span>
              ))}
            </div>

            <p className="cta-note f3">Takes about 10 minutes</p>
          </div>
        </div>

        <div style={{maxWidth:720,margin:"0 auto",padding:"3rem 2rem 5rem",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div className="what-divider f4">
            <div className="wd-line" /><span className="wd-label">What you&apos;ll walk away with</span><div className="wd-line" />
          </div>

          <div className="what-cards f5">
            {[
              { icon: "🌿", cls: "ic-brief", title: "A Caregiver Brief",       body: "A plain-English summary that any family member, home aide, or new provider can read and immediately understand." },
              { icon: "🤍", cls: "ic-you",   title: "For the caregiver",       body: "A private page with a day-by-day timeline, emotional resources, and acknowledgment of what you're carrying." },
              { icon: "📋", cls: "ic-print", title: "Something for today",     body: "Print it, share it, or just read it yourself. Organized and ready the moment you're done." },
            ].map(c => (
              <div className="what-card" key={c.title}>
                <div className={`wc-icon ${c.cls}`}>{c.icon}</div>
                <div className="wc-title">{c.title}</div>
                <div className="wc-body">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
        </>
      )}

      {/* ═══ STAGE ═══ */}
      {step === "stage" && (
        <div className="q-wrap">
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"18%"}} /></div>
          <div className="progress-label">Getting started</div>
          <h2 className="big-q">Where are you right now?</h2>
          <p className="q-sub">This shapes your brief and the questions we ask. There are no wrong answers.</p>
          <div className="stage-grid">
            {STAGES.map(s => (
              <button key={s.id} className={`stage-btn${stage === s.id ? " sel" : ""}`} onClick={() => setStage(s.id)}>
                <div><div className="s-name">{s.id}</div><div className="s-desc">{s.desc}</div></div>
                <div className="s-check">
                  {stage === s.id && <svg width="10" height="8" viewBox="0 0 12 9" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4.5L4.5 8 11 1"/></svg>}
                </div>
              </button>
            ))}
          </div>
          <button className="btn-primary" disabled={!stage} onClick={() => goTo("q1")}>Continue →</button>
        </div>
      )}

      {/* ═══ Q1 ═══ */}
      {step === "q1" && (
        <div className="q-wrap">
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"44%"}} /></div>
          <div className="progress-label">Step 1 of 3 — The situation</div>
          <h2 className="big-q">What&apos;s the main reason your loved one needs support right now?</h2>
          <div className="banner">
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>💡</span>
            <span className="banner-text">The more you share, the more useful your brief will be — but anything is a good start. Skip anything you&apos;re not ready for.</span>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="situation">The situation</label>
            <textarea id="situation" value={situation} onChange={e => setSituation(e.target.value)} placeholder="e.g. recovering from a stroke, managing late-stage Parkinson's, adjusting after a recent fall..." rows={3} />
            <p style={{fontSize:13,color:"var(--faint)",marginTop:7}}>No names of people, providers, or facilities needed.</p>
          </div>
          <button className="expand-btn" onClick={() => setQ1Open(o => !o)}>
            <span className={`expand-chevron${q1Open ? " open" : ""}`}>▶</span> Add more context
          </button>
          <div className={`expand-body${q1Open ? " open" : ""}`}>
            <div className="field">
              <label className="field-label" htmlFor="situationMore">More detail <span className="opt-tag">Optional</span></label>
              <textarea id="situationMore" value={situationMore} onChange={e => setSituationMore(e.target.value)} placeholder="How long has this been going on? What recently changed? What should a new helper know right away?" rows={3} />
            </div>
          </div>
          <button className="btn-primary" onClick={() => goTo("q2")}>Continue →</button>
          <button className="btn-ghost" onClick={() => goTo("q2")}>Skip for now</button>
        </div>
      )}

      {/* ═══ Q2 ═══ */}
      {step === "q2" && (
        <div className="q-wrap">
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"68%"}} /></div>
          <div className="progress-label">Step 2 of 3 — Medical overview</div>
          <h2 className="big-q">What conditions or diagnoses have they been given?</h2>
          <p className="q-sub">Condition names only — no record numbers, insurance IDs, or personal identifiers needed.</p>
          <div className="field">
            <label className="field-label" htmlFor="medical">Conditions</label>
            <textarea id="medical" value={medical} onChange={e => setMedical(e.target.value)} placeholder="e.g. diabetes, congestive heart failure, dementia, Parkinson's..." rows={3} />
          </div>
          <button className="expand-btn" onClick={() => setQ2Open(o => !o)}>
            <span className={`expand-chevron${q2Open ? " open" : ""}`}>▶</span> Add medications, allergies, or recent changes
          </button>
          <div className={`expand-body${q2Open ? " open" : ""}`}>
            <div className="field">
              <label className="field-label" htmlFor="medications">Medications <span className="opt-tag">Optional</span></label>
              <textarea id="medications" value={medications} onChange={e => setMedications(e.target.value)} placeholder="Drug name + how often — e.g. Lisinopril once daily, Metformin twice with meals..." rows={3} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="allergies">Known allergies <span className="opt-tag">Optional</span></label>
              <textarea id="allergies" value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Substance names only..." rows={2} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="recentChanges">Anything changed recently? <span className="opt-tag">Optional</span></label>
              <textarea id="recentChanges" value={recentChanges} onChange={e => setRecentChanges(e.target.value)} placeholder="New diagnosis, recent hospitalization, change in care plan..." rows={2} />
            </div>
          </div>
          <button className="btn-primary" onClick={() => goTo("q3")}>Continue →</button>
          <button className="btn-ghost" onClick={() => goTo("q3")}>Skip for now</button>
        </div>
      )}

      {/* ═══ Q3 ═══ */}
      {step === "q3" && (
        <div className="q-wrap">
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"90%"}} /></div>
          <div className="progress-label">Step 3 of 3 — Just for you</div>
          <h2 className="big-q">How are you doing in all of this?</h2>
          <div className="banner warm">
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>🌿</span>
            <span className="banner-text">This section is just for you. Your answers won&apos;t appear in the brief you share — they go on a private page that&apos;s only yours.</span>
          </div>
          {error && <div className="error-banner">{error}</div>}
          <div className="check-list">
            {WELLBEING_OPTIONS.map(o => (
              <label className="check-item" key={o.value}>
                <input type="checkbox" checked={wellbeing.includes(o.value)} onChange={() => toggleWellbeing(o.value)} />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
          <button className="btn-primary" onClick={generate}>Generate my brief →</button>
          <button className="btn-ghost" onClick={generate}>Skip and generate</button>
        </div>
      )}

      {/* ═══ LOADING ═══ */}
      {step === "loading" && (
        <div className="loading-screen" role="status" aria-live="polite">
          <div className="loading-logo">Hearth</div>
          <div className="loading-dots" aria-hidden="true">
            <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
          </div>
          <div className="loading-heading">Putting it together...</div>
          <div className="loading-sub">Usually takes about 10 seconds</div>
        </div>
      )}

      {/* ═══ BRIEF ═══ */}
      {step === "brief" && brief && (
        <div className="brief-wrap">
          <div className="brief-top">
            <div className="brief-wm">
              <div className="q-wm-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FAF0F1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>
                </svg>
              </div>
              <span style={{fontFamily:"Cormorant Garamond,serif",fontSize:16,color:"var(--burg)",letterSpacing:"0.06em",textTransform:"uppercase" as const}}>Hearth</span>
            </div>
            <div className="brief-title">Caregiver Brief</div>
            <div className="brief-meta">{dateStr}</div>
          </div>

          <div className="brief-glance">
            <div className="brief-glance-label">At a glance</div>
            <div className="brief-glance-body">{brief.atAGlance}</div>
          </div>

          {brief.careStage && <BriefCard label="Care stage" body={brief.careStage} />}
          {brief.conditions && <BriefCard label="Conditions" body={brief.conditions} />}
          {brief.medications && <BriefCard label="Medications" body={brief.medications} />}
          {brief.allergies && <BriefCard label="Known allergies" body={brief.allergies} />}
          {brief.importantNotes && <BriefCard label="Recent changes and notes" body={brief.importantNotes} />}

          {/* For the caregiver */}
          {stage && (
            <div className="ftc-section">
              <div className="ftc-eyebrow">For the caregiver</div>
              {brief.forYou && <p className="ftc-ack">{brief.forYou}</p>}

              <div style={{marginBottom:"1.5rem"}}>
                {TIMELINE[stage].map(block => (
                  <div className="timeline-period" key={block.period}>
                    <div className="tl-label">{block.period}</div>
                    <div className="tl-items">
                      {block.items.map(item => (
                        <div className="tl-item" key={item}>
                          <div className="tl-dot" />
                          <div className="tl-text">{item}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="resources-section">
                <div className="res-title">Where to find support</div>
                {RESOURCES.map(r => (
                  <div className="res-card" key={r.name}>
                    <div className="res-name">{r.name}</div>
                    <div className="res-desc">{r.desc}</div>
                    <div className="res-links">
                      <a className="res-link" href={r.url} target="_blank" rel="noopener noreferrer">{r.url.replace("https://","")}</a>
                      {r.phone && <span className="res-link">{r.phone}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="disclosure">
            Generated with AI assistance on {dateStr}. For organizational purposes only. Not a medical record. Not a substitute for professional medical or legal advice. AI can make mistakes — always review before sharing.
          </div>

          <div className="no-print" style={{marginTop:"2rem",display:"flex",flexDirection:"column" as const,gap:10}}>
            <button className="btn-primary" onClick={() => window.print()}>Print or save as PDF</button>
            <button className="btn-ghost" onClick={reset}>Start over</button>
          </div>
        </div>
      )}
    </>
  );
}

function QWordmark() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"2rem"}}>
      <div className="q-wm-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FAF0F1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>
        </svg>
      </div>
      <span style={{fontFamily:"Cormorant Garamond,serif",fontSize:18,fontWeight:500,color:"var(--ink)",letterSpacing:"0.04em"}}>Hearth</span>
    </div>
  );
}

function BriefCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="brief-card">
      <div className="brief-card-label">{label}</div>
      <div className="brief-card-body">{body}</div>
    </div>
  );
}
