"use client";

import { useState } from "react";
import { fetchPatientMedications, fetchPatientConditions } from "@/lib/fhir";

type Stage = "Active care" | "Palliative care" | "Hospice care" | "Bereavement";
type Step = "hero" | "stage" | "q1" | "q2" | "q2b" | "q2c" | "q3" | "q4" | "loading" | "brief";

interface Brief {
  atAGlance: string;
  careStage: string;
  conditions: string | null;
  medications: string | null;
  allergies: string | null;
  careTeam: string | null;
  livingSituation: string | null;
  comfortGoals: string | null;
  importantNotes: string | null;
  forYou: string | null;
}

interface WnPlan {
  week1: string[];
  weeks23: string[];
  week4: string[];
}

const STAGES: { id: Stage; desc: string }[] = [
  { id: "Active care",     desc: "Managing an ongoing condition or recovery" },
  { id: "Palliative care", desc: "Focus has shifted to comfort and quality of life" },
  { id: "Hospice care",    desc: "End of life support and presence" },
  { id: "Bereavement",     desc: "Navigating life after a recent loss" },
];

const SITUATION_OPTIONS = [
  "Recently diagnosed with a serious condition",
  "Recovering from surgery or a hospital stay",
  "Managing a chronic or worsening condition",
  "Preparing for end of life",
  "We recently lost them and I'm navigating what comes next",
  "Something else",
];

const CONDITION_CHIPS = [
  "Cancer",
  "Dementia / Alzheimer's",
  "Heart failure",
  "Parkinson's",
  "Stroke recovery",
  "COPD",
  "Diabetes complications",
  "Other",
];

const CAREGIVER_ROLES = [
  "I'm the only one doing this",
  "I have some help but I'm mostly managing alone",
  "There are a few of us sharing the responsibility",
  "I'm coordinating care from a distance",
];

const WELLBEING_OPTIONS = [
  { value: "exhausted", label: "I'm exhausted but keeping it together" },
  { value: "grief",     label: "Grief that has already started, even though they're still here" },
  { value: "guilt",     label: "Guilt about not doing enough" },
  { value: "lonely",    label: "Loneliness, feeling like nobody really understands" },
  { value: "fear",      label: "Fear about what comes next" },
  { value: "anger",     label: "Anger, at the situation, at how unfair this is" },
  { value: "relief",    label: "Relief mixed with guilt about feeling relieved" },
  { value: "ok",        label: "I'm managing okay most of the time" },
];

const WN_CONCERNS = [
  "Medical decisions and next steps",
  "Insurance and financial concerns",
  "Daily caregiving logistics",
  "Emotional support",
  "Coordinating with family",
];

const TIMELINE: Record<Stage, { period: string; subtitle: string; items: string[] }[]> = {
  "Active care": [
    {
      period: "Today",
      subtitle: "The only things that matter right now",
      items: [
        "Write down your loved one's current medications and conditions",
        "Identify one family member or friend who can share the load",
        "Locate their insurance card and primary doctor's number",
      ],
    },
    {
      period: "Days 1–3",
      subtitle: "Small steps that create a foundation",
      items: [
        "Schedule a conversation with their primary care provider",
        "Set up a simple medication tracking system",
        "Tell your employer you may need flexibility. You don't have to share details.",
      ],
    },
    {
      period: "Days 4–7",
      subtitle: "Starting to build a rhythm",
      items: [
        "Research whether a home health aide is needed",
        "Ask their doctor about what to expect in coming weeks",
        "Find one hour this week that is just for you",
      ],
    },
    {
      period: "Week 2+",
      subtitle: "Looking a little further ahead",
      items: [
        "Connect with a caregiver support group. Online counts.",
        "Review insurance coverage for home care or specialist visits",
        "Revisit this brief and update anything that has changed",
      ],
    },
  ],
  "Palliative care": [
    {
      period: "Today",
      subtitle: "The only things that matter right now",
      items: [
        "Ask the palliative care team what comfort means for your loved one right now",
        "Write down what a good day looks like for them",
        "Tell someone close to you what you are going through",
      ],
    },
    {
      period: "Days 1–3",
      subtitle: "Small steps that create a foundation",
      items: [
        "Ask about a hospice or palliative social worker. Their job is to help families like yours.",
        "Clarify what medications are for comfort vs. treatment",
        "Give yourself permission to not have all the answers",
      ],
    },
    {
      period: "Days 4–7",
      subtitle: "Starting to build a rhythm",
      items: [
        "Have one honest conversation with your loved one about what they want, if they are able",
        "Identify who in the family needs to be kept informed and how",
        "Find a grief counselor or therapist. Anticipatory grief is real and you deserve support.",
      ],
    },
    {
      period: "Week 2+",
      subtitle: "Looking a little further ahead",
      items: [
        "Ask about advance directives if not already in place. caringinfo.org has free resources.",
        "Plan for respite. Even a few hours matters.",
        "Connect with others who have been through this",
      ],
    },
  ],
  "Hospice care": [
    {
      period: "Today",
      subtitle: "The only things that matter right now",
      items: [
        "Ask the hospice team what to expect in the coming days and weeks",
        "Make sure everyone who needs to be there knows how to get there",
        "Tell the people who love you that you need support too",
      ],
    },
    {
      period: "Days 1–3",
      subtitle: "Small steps that create a foundation",
      items: [
        "Ask the hospice social worker about grief resources for family members",
        "Clarify what the hospice team handles vs. what falls to you",
        "Write down anything your loved one has expressed about their wishes",
      ],
    },
    {
      period: "Days 4–7",
      subtitle: "Starting to build a rhythm",
      items: [
        "Designate one family member as the primary contact for updates",
        "Allow yourself to grieve. You don't have to wait.",
        "Ask about bereavement support. Most hospice organizations offer it.",
      ],
    },
    {
      period: "Week 2+",
      subtitle: "Looking a little further ahead",
      items: [
        "Take care of practical documents if not already done",
        "Stay connected to the hospice social worker",
        "Remember that being present is enough. You don't have to fix this.",
      ],
    },
  ],
  "Bereavement": [
    {
      period: "Today",
      subtitle: "There is nothing you have to do today except be here",
      items: [
        "You don't have to do anything today except be",
        "Call one person who can sit with you, even quietly",
        "Know that what you are feeling is real and it is allowed",
      ],
    },
    {
      period: "Days 1–3",
      subtitle: "Small steps. That's all.",
      items: [
        "Handle only what is truly urgent. Most things can wait.",
        "Eat something. Sleep if you can. Ask for help with both.",
        "Let people help you in concrete ways: meals, errands, presence",
      ],
    },
    {
      period: "Days 4–7",
      subtitle: "Grief doesn't follow a timeline. Neither should you.",
      items: [
        "Look into bereavement support: GriefShare, hospice bereavement programs, or a therapist",
        "Begin notifying institutions only as you have energy",
        "Know that grief is not linear and there is no timeline you have to follow",
      ],
    },
    {
      period: "Week 2+",
      subtitle: "Finding support that can hold you through this",
      items: [
        "Consider a grief group. Being with others who understand is powerful.",
        "Be patient with yourself as your identity shifts outside the caregiving role",
        "The Family Caregiver Alliance (caregiver.org) has bereavement resources specifically for former caregivers",
      ],
    },
  ],
};

const RESOURCES = [
  { name: "Family Caregiver Alliance", desc: "Free helpline, resources, and support groups for caregivers at every stage.", url: "https://caregiver.org", phone: "800-445-8106" },
  { name: "The Conversation Project", desc: "Tools to help families talk about end of life wishes before a crisis.", url: "https://theconversationproject.org" },
  { name: "CaringInfo", desc: "Free advance directive forms and hospice information from the National Hospice Foundation.", url: "https://caringinfo.org" },
  { name: "GriefShare", desc: "Support groups for people grieving a death, including anticipatory grief resources.", url: "https://griefshare.org" },
  { name: "AARP Caregiver Support", desc: "Local and virtual caregiver support groups, articles, and a helpline.", url: "https://aarp.org/caregiving" },
];

function planTitle(concern: string | null): string {
  if (!concern) return "Your 30-Day Action Plan";
  const map: Record<string, string> = {
    "Medical decisions and next steps":  "Your 30-Day Medical Navigation Plan",
    "Insurance and financial concerns":  "Your 30-Day Financial Navigation Plan",
    "Daily caregiving logistics":        "Your 30-Day Care Logistics Plan",
    "Emotional support":                 "Your 30-Day Emotional Support Plan",
    "Coordinating with family":          "Your 30-Day Family Coordination Plan",
  };
  return map[concern] ?? "Your 30-Day Action Plan";
}

export default function Home() {
  const [step, setStep]                         = useState<Step>("hero");
  const [stage, setStage]                       = useState<Stage | null>(null);
  const [situationChoice, setSituationChoice]   = useState("");
  const [situationOther, setSituationOther]     = useState("");
  const [medical, setMedical]                   = useState("");
  const [medications, setMedications]           = useState("");
  const [allergies, setAllergies]               = useState("");
  const [recentChanges, setRecentChanges]       = useState("");
  const [hadRecentChanges, setHadRecentChanges] = useState<boolean | null>(null);
  const [medsOpen, setMedsOpen]                 = useState(false);
  const [allergiesOpen, setAllergiesOpen]       = useState(false);
  const [fhirOpen, setFhirOpen]                 = useState(false);
  const [caregiverRole, setCaregiverRole]       = useState("");
  const [wellbeing, setWellbeing]               = useState<string[]>([]);
  const [brief, setBrief]                       = useState<Brief | null>(null);
  const [error, setError]                       = useState<string | null>(null);
  const [fhirId, setFhirId]                     = useState("");
  const [fhirLoading, setFhirLoading]           = useState(false);
  const [fhirError, setFhirError]               = useState<string | null>(null);
  const [fhirLoaded, setFhirLoaded]             = useState(false);
  const [wnConcern, setWnConcern]               = useState<string | null>(null);
  const [wnPlan, setWnPlan]                     = useState<WnPlan | null>(null);

  function goTo(s: Step) {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleWellbeing(val: string) {
    setWellbeing(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  }

  function addConditionChip(chip: string) {
    setMedical(prev => {
      const t = prev.trim();
      return t ? `${t}, ${chip}` : chip;
    });
  }

  async function loadFhir() {
    if (!fhirId.trim()) return;
    setFhirLoading(true);
    setFhirError(null);
    try {
      const [meds, conditions] = await Promise.all([
        fetchPatientMedications(fhirId.trim()),
        fetchPatientConditions(fhirId.trim()),
      ]);
      if (meds.length > 0) {
        setMedications(meds.map((m: { name: string; instructions: string }) => `${m.name}${m.instructions ? ', ' + m.instructions : ''}`).join('\n'));
      }
      if (conditions.length > 0) {
        setMedical(conditions.map((c: { name: string }) => c.name).join(', '));
      }
      setFhirLoaded(true);
    } catch {
      setFhirError("Could not load patient data. Check the ID and try again.");
    } finally {
      setFhirLoading(false);
    }
  }

  async function generate() {
    goTo("loading");
    setError(null);
    try {
      const [briefRes, planRes] = await Promise.all([
        fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage,
            situation: situationChoice === "Something else" ? situationOther : situationChoice,
            situationMore: "",
            medical, medications, allergies, recentChanges,
            caregiverWellbeing: wellbeing.join(", "),
            caregiverRole,
            concern: wnConcern,
          }),
        }),
        fetch("/api/whats-next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            careStage: stage,
            concern: wnConcern,
            condition: medical,
            caregiverRole,
          }),
        }),
      ]);
      if (!briefRes.ok) throw new Error("Generation failed");
      const briefData = await briefRes.json();
      setBrief(briefData);
      if (planRes.ok) {
        const planData = await planRes.json();
        setWnPlan(planData);
      }
      goTo("brief");
    } catch {
      setError("Something went wrong. Please try again.");
      goTo("q4");
    }
  }

  function reset() {
    setStep("hero"); setStage(null);
    setSituationChoice(""); setSituationOther("");
    setMedical(""); setMedications(""); setAllergies(""); setRecentChanges("");
    setHadRecentChanges(null); setMedsOpen(false); setAllergiesOpen(false);
    setFhirOpen(false); setCaregiverRole("");
    setWellbeing([]); setBrief(null); setError(null);
    setFhirId(""); setFhirLoading(false); setFhirError(null); setFhirLoaded(false);
    setWnConcern(null); setWnPlan(null);
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
          --sage-light:   #EDF4EC;
          --sage-border:  #7DAA74;
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
        .what-cards { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; width: 100%; max-width: 660px; text-align: left; }
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
        .q-wm-icon { width: 26px; height: 26px; background: var(--burg); border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .progress-track { height: 3px; background: var(--border-soft); border-radius: 100px; overflow: hidden; margin-bottom: 7px; }
        .progress-fill  { height: 100%; background: var(--burg); border-radius: 100px; transition: width 0.4s ease; }
        .progress-label { font-size: 12px; color: var(--faint); margin-bottom: 2.5rem; }
        .big-q { font-family: 'Cormorant Garamond', serif; font-size: clamp(22px,4vw,30px); font-weight: 500; color: var(--ink); line-height: 1.35; margin-bottom: 0.75rem; letter-spacing: -0.01em; }
        .q-sub { font-size: 15px; color: var(--muted); line-height: 1.6; margin-bottom: 1.75rem; }

        /* Banner */
        .banner { display: flex; gap: 12px; align-items: flex-start; background: #FAF7F4; border-radius: var(--radius-md); padding: 14px 16px; margin-bottom: 1.75rem; }
        .banner-text { font-size: 14px; color: var(--ink-soft); line-height: 1.6; }

        /* Stage / situation buttons */
        .stage-grid { display: flex; flex-direction: column; gap: 10px; }
        .stage-btn { width: 100%; text-align: left; padding: 17px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 14px; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .stage-btn:hover { border-color: var(--burg-border); background: var(--burg-light); }
        .stage-btn.sel { border: 2px solid var(--burg); background: var(--burg-light); }
        .s-name { font-size: 16px; font-weight: 500; color: var(--ink); margin-bottom: 3px; }
        .s-desc { font-size: 13px; color: var(--muted); }
        .s-check { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .stage-btn.sel .s-check { background: var(--burg); border-color: var(--burg); }

        /* Situation pills */
        .sit-grid { display: flex; flex-direction: column; gap: 10px; }
        .sit-btn { width: 100%; text-align: left; padding: 15px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 14px; transition: all 0.15s; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; color: var(--ink-soft); }
        .sit-btn:hover { border-color: var(--burg-border); background: var(--burg-light); color: var(--burg); }
        .sit-btn.sel { border: 2px solid var(--burg); background: var(--burg-light); color: var(--burg); }

        /* Condition chips */
        .chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .chip { padding: 5px 13px; background: var(--surface-alt); border: 1px solid var(--border-soft); border-radius: 100px; font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--ink-soft); cursor: pointer; transition: all 0.15s; }
        .chip:hover { border-color: var(--burg-border); background: var(--burg-light); color: var(--burg); }

        /* Expandable sections */
        .expand-trigger { display: inline-flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 500; color: var(--muted); background: none; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 9px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; margin-top: 4px; }
        .expand-trigger:hover { border-color: var(--burg-border); color: var(--ink); }

        /* Fields */
        .field { margin-bottom: 1.25rem; }
        .field-label { font-size: 14px; font-weight: 500; color: var(--ink-soft); margin-bottom: 7px; display: flex; align-items: center; gap: 8px; }
        .opt-tag { font-size: 11px; font-weight: 400; color: var(--faint); background: var(--surface-alt); padding: 2px 8px; border-radius: 100px; }
        textarea { width: 100%; padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius-md); font-family: 'DM Sans', sans-serif; font-size: 16px; color: var(--ink); background: var(--surface); resize: vertical; min-height: 100px; line-height: 1.65; transition: border-color 0.15s, box-shadow 0.15s; }
        textarea::placeholder { color: var(--faint); font-size: 15px; }
        textarea:focus { outline: none; border-color: var(--burg); box-shadow: 0 0 0 3px rgba(114,47,55,0.1); }
        input[type="text"] { width: 100%; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--ink); background: var(--surface); transition: border-color 0.15s; }
        input[type="text"]:focus { outline: none; border-color: var(--burg); box-shadow: 0 0 0 3px rgba(114,47,55,0.1); }

        /* Wellbeing checkboxes */
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
        .btn-back { background: none; border: none; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: var(--muted); cursor: pointer; padding: 0; margin-bottom: 1.5rem; display: inline-flex; align-items: center; gap: 4px; transition: color 0.15s; }
        .btn-back:hover { color: var(--ink); }

        /* FHIR — hidden by default, exposed via toggle */
        .fhir-toggle { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: var(--muted); background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 0; margin-top: 0.5rem; }
        .fhir-toggle:hover { color: var(--ink-soft); }
        .fhir-expanded { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 16px 18px; margin-top: 10px; }
        .fhir-prefill-label { font-size: 12px; font-weight: 500; color: var(--faint); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .fhir-prefill-row { display: flex; gap: 8px; }
        .fhir-input { flex: 1; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--ink); background: var(--surface); }
        .fhir-input:focus { outline: none; border-color: var(--burg); }
        .fhir-btn { padding: 10px 18px; background: var(--burg); color: white; border: none; border-radius: var(--radius-sm); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; }
        .fhir-btn:disabled { background: var(--border); color: var(--faint); cursor: not-allowed; }
        .fhir-error   { font-size: 13px; color: #8B2020; margin-top: 8px; }
        .fhir-success { font-size: 13px; color: #2A6B22; margin-top: 8px; font-weight: 500; }
        .fhir-note { font-size: 12px; color: var(--faint); margin-top: 8px; line-height: 1.5; }

        /* Error */
        .error-banner { background: #FFF0F0; border: 1px solid #FFC0C0; border-radius: var(--radius-md); padding: 14px 16px; margin-top: 1rem; font-size: 14px; color: #8B2020; }

        /* Q2b yes/no */
        .yn-row { display: flex; gap: 10px; }
        .yn-btn { flex: 1; padding: 15px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 500; color: var(--ink-soft); cursor: pointer; transition: all 0.15s; text-align: center; }
        .yn-btn:hover { border-color: var(--burg-border); background: var(--burg-light); }
        .yn-btn.sel { border: 2px solid var(--burg); background: var(--burg-light); color: var(--burg); }

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

        /* ── Brief ── */
        .brief-wrap { max-width: 660px; margin: 0 auto; padding: 2.5rem 2rem 6rem; }
        .brief-top { padding-bottom: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .brief-wm  { display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
        .brief-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em; }
        .brief-meta  { font-size: 14px; color: var(--faint); margin-top: 3px; }

        /* AT A GLANCE — sage green */
        .brief-glance { background: var(--sage-light); border-radius: var(--radius-md); padding: 18px 20px; margin-bottom: 12px; }
        .brief-glance-label { font-size: 11px; font-weight: 600; color: var(--sage-border); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
        .brief-glance-body { font-family: 'Cormorant Garamond', serif; font-size: 17px; color: var(--ink); line-height: 1.7; }

        /* Field cards — sage left border */
        .brief-card { background: var(--surface); border: 1px solid var(--border-soft); border-left: 3px solid var(--sage-border); border-radius: 0 var(--radius-md) var(--radius-md) 0; padding: 18px 22px; margin-bottom: 10px; }
        .brief-card-label { font-size: 10px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
        .brief-card-body  { font-size: 16px; color: var(--ink); line-height: 1.75; }

        .disclosure { font-size: 13px; font-style: italic; color: var(--faint); line-height: 1.6; margin-top: 2rem; }

        /* Section divider */
        .section-divider { display: flex; align-items: center; gap: 14px; margin: 2.5rem 0 1.75rem; }
        .section-divider-line { flex: 1; height: 1px; background: var(--border); }
        .section-divider-label { font-size: 11px; font-weight: 500; color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; white-space: nowrap; display: flex; align-items: center; gap: 5px; }

        /* A note for you — sage card with burgundy left border */
        .note-card { background: var(--sage-light); border-left: 4px solid var(--burg); border-radius: 0 var(--radius-md) var(--radius-md) 0; padding: 22px 24px; margin-bottom: 2.25rem; display: flex; gap: 16px; align-items: flex-start; }
        .note-card-icon { font-size: 20px; flex-shrink: 0; line-height: 1.5; }
        .note-card-body { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--ink-soft); line-height: 1.75; font-style: italic; }

        /* Timeline — guide style */
        .timeline-period { margin-bottom: 0.5rem; }
        .tl-section-divider { height: 1px; background: var(--border); margin: 2.25rem 0 1.75rem; }
        .tl-label { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 500; color: var(--burg); line-height: 1.2; margin-bottom: 5px; }
        .tl-subtitle { font-size: 13px; color: var(--muted); margin-bottom: 14px; }
        .tl-items { display: flex; flex-direction: column; gap: 8px; }
        .tl-item { display: flex; gap: 16px; align-items: flex-start; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius-md); }
        .action-cb { width: 18px; height: 18px; accent-color: var(--burg); cursor: pointer; flex-shrink: 0; margin-top: 2px; border-radius: 4px; }
        .tl-text { font-size: 16px; color: var(--ink-soft); line-height: 1.6; }

        /* Resources */
        .resources-section { margin-top: 2.25rem; }
        .res-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 500; color: var(--ink); margin-bottom: 1rem; }
        .res-card { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 16px 18px; margin-bottom: 10px; }
        .res-name { font-size: 15px; font-weight: 500; color: var(--ink); margin-bottom: 3px; }
        .res-desc { font-size: 14px; color: var(--muted); line-height: 1.55; margin-bottom: 8px; }
        .res-links { display: flex; gap: 12px; flex-wrap: wrap; }
        .res-link { font-size: 13px; color: var(--burg); text-decoration: none; font-weight: 500; }
        .res-link:hover { text-decoration: underline; }

        /* 30-Day plan section */
        .plan-section { margin-top: 2rem; }
        .plan-concern-tag { font-size: 14px; color: var(--muted); display: block; margin-bottom: 1.25rem; }
        .wn-card { background: var(--surface); border: 1px solid var(--border-soft); border-left: 3px solid var(--sage-border); border-radius: var(--radius-md); margin-bottom: 14px; overflow: hidden; }
        .wn-card-header { padding: 16px 20px 12px; border-bottom: 1px solid var(--border-soft); }
        .wn-card-week { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 500; color: var(--ink); display: block; line-height: 1.2; }
        .wn-card-sub { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-top: 2px; }
        .wn-check-row { display: flex; gap: 16px; align-items: flex-start; padding: 14px 20px; border-bottom: 1px solid var(--border-soft); }
        .wn-check-row:last-child { border-bottom: none; }
        .wn-check-text { font-size: 16px; color: var(--ink-soft); line-height: 1.6; }
        .wn-disclaimer { font-size: 13px; font-style: italic; color: var(--faint); line-height: 1.6; margin-top: 1.5rem; }

        /* Print button */
        .print-btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 18px; background: var(--burg); border: none; border-radius: 100px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; color: #FAF0F1; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: background 0.15s, box-shadow 0.15s; box-shadow: 0 4px 14px rgba(114,47,55,0.22); margin-top: 0.5rem; }
        .print-btn:hover { background: var(--burg-deep); box-shadow: 0 6px 18px rgba(114,47,55,0.3); }

        /* Print */
        @media print {
          .hero-bg, .no-print { display: none !important; }
          .brief-wrap { padding: 1rem; max-width: 100%; }
          .ftc-section { page-break-before: always; }
          .plan-section { page-break-before: always; }
          .brief-top { flex-direction: column; }
        }

        /* Responsive */
        @media (max-width: 580px) {
          .what-cards { grid-template-columns: 1fr; }
          .hero { padding: 3rem 1.25rem 3rem; }
          .q-wrap { padding: 2rem 1.25rem 5rem; }
          .brief-top { flex-direction: column; gap: 12px; }
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
          <img className="hero-img" src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1920&q=80" alt="" aria-hidden="true" />
          <div className="hero-overlay" />
          <div className="hero">
            <div className="wordmark f1">
              <div className="wm-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FAF0F1" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>
                </svg>
              </div>
              <span className="wm-name">Hearth</span>
              <span className="wm-tag">Free caregiver tool</span>
            </div>

            <h1 className="hero-headline f2">
              For everyone navigating caregiving<br />before they <em>feel ready.</em>
            </h1>

            <p className="hero-sub f3">
              Answer a few questions about what you already know. Walk away with something organized, clear, and ready to use.
            </p>

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

            <button className="btn-cta f3" onClick={() => goTo("stage")}>
              Get started
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>

            <p className="cta-note f3"><em>Only takes 10 minutes.</em></p>
          </div>
        </div>

        <div style={{maxWidth:720,margin:"0 auto",padding:"2rem 2rem 5rem",display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div className="what-divider f4">
            <div className="wd-line" /><span className="wd-label">What you&apos;ll walk away with</span><div className="wd-line" />
          </div>

          <div className="what-cards f5">
            {[
              { icon: "🌿", cls: "ic-brief", title: "A Caregiver Brief",   body: "A plain-English summary that any family member, home aide, or new provider can read and immediately understand." },
              { icon: "🤍", cls: "ic-you",   title: "A note for you",       body: "A private section with a day-by-day timeline, emotional resources, and acknowledgment of what you're carrying." },
              { icon: "📋", cls: "ic-print", title: "A 30-day plan",        body: "Built around your most pressing concern. Print it, share it, or keep it as a personal roadmap." },
            ].map(c => (
              <div className="what-card" key={c.title}>
                <div className={`wc-icon ${c.cls}`}>{c.icon}</div>
                <div className="wc-title">{c.title}</div>
                <div className="wc-body">{c.body}</div>
              </div>
            ))}
            <div className="what-card">
              <div className="wc-icon" style={{background:"#EEF2F8"}}>⚡</div>
              <div className="wc-title">FHIR R4 integration</div>
              <div className="wc-body">Optionally pre-fill medical details from an existing patient record using a FHIR-compatible patient ID. No data is stored.</div>
            </div>
          </div>
          <p style={{fontSize:13,color:"var(--muted)",marginTop:"2rem",textAlign:"center" as const}}>
            <a href="/privacy" style={{color:"var(--muted)",textDecoration:"underline"}}>Privacy, HIPAA &amp; compliance information</a>
          </p>
          <p style={{fontSize:13,color:"var(--muted)",marginTop:"0.5rem",textAlign:"center" as const}}>
            <a href="/whats-next" style={{color:"var(--burg)",textDecoration:"none",fontWeight:500}}>Try the 30-day action plan generator →</a>
          </p>
        </div>
        </>
      )}

      {/* ═══ STAGE ═══ */}
      {step === "stage" && (
        <div className="q-wrap">
          <button className="btn-back" onClick={() => goTo("hero")}>← Back</button>
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"13%"}} /></div>
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

      {/* ═══ Q1 — Situation ═══ */}
      {step === "q1" && (
        <div className="q-wrap">
          <button className="btn-back" onClick={() => goTo("stage")}>← Back</button>
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"26%"}} /></div>
          <div className="progress-label">Step 1 of 6: The situation</div>
          <h2 className="big-q">What best describes the situation right now?</h2>
          <p className="q-sub">Pick the one that fits closest. You can add details on the next screen.</p>
          <div className="sit-grid">
            {SITUATION_OPTIONS.map(opt => (
              <button key={opt} className={`sit-btn${situationChoice === opt ? " sel" : ""}`} onClick={() => setSituationChoice(opt)}>
                {opt}
                {situationChoice === opt
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#722F37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.3}}><circle cx="12" cy="12" r="10"/></svg>
                }
              </button>
            ))}
          </div>
          {situationChoice === "Something else" && (
            <div className="field" style={{marginTop:"1rem"}}>
              <label className="field-label" htmlFor="situationOther">Describe the situation briefly</label>
              <textarea
                id="situationOther"
                value={situationOther}
                onChange={e => setSituationOther(e.target.value)}
                placeholder="What's going on? No names or details needed."
                rows={3}
              />
            </div>
          )}
          <button
            className="btn-primary"
            disabled={!situationChoice || (situationChoice === "Something else" && !situationOther.trim())}
            onClick={() => goTo("q2")}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ═══ Q2 — Medical ═══ */}
      {step === "q2" && (
        <div className="q-wrap">
          <button className="btn-back" onClick={() => goTo("q1")}>← Back</button>
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"39%"}} /></div>
          <div className="progress-label">Step 2 of 6: Medical overview</div>
          <h2 className="big-q">What do we need to know medically?</h2>
          <p className="q-sub">Condition names only. No record numbers or personal identifiers needed.</p>

          <div className="field">
            <label className="field-label" htmlFor="medical">What condition or diagnosis are you managing?</label>
            <textarea
              id="medical"
              value={medical}
              onChange={e => setMedical(e.target.value)}
              placeholder="e.g. stage 3 breast cancer, early Alzheimer's, heart failure after a recent hospitalization"
              rows={3}
            />
            <div className="chip-row">
              {CONDITION_CHIPS.map(chip => (
                <button key={chip} className="chip" onClick={() => addConditionChip(chip)}>{chip}</button>
              ))}
            </div>
          </div>

          <div className="field">
            {!medsOpen
              ? <button className="expand-trigger" onClick={() => setMedsOpen(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Add medications <span className="opt-tag">Optional</span>
                </button>
              : <>
                  <label className="field-label" htmlFor="medications">Are there medications involved? If so, which ones?</label>
                  <textarea
                    id="medications"
                    value={medications}
                    onChange={e => setMedications(e.target.value)}
                    placeholder="e.g. Lisinopril once daily for blood pressure, Aricept for memory. Just names and how often is enough."
                    rows={3}
                  />
                </>
            }
          </div>

          <div className="field">
            {!allergiesOpen
              ? <button className="expand-trigger" onClick={() => setAllergiesOpen(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Add known allergies <span className="opt-tag">Optional</span>
                </button>
              : <>
                  <label className="field-label" htmlFor="allergies">Any allergies we should know about?</label>
                  <textarea
                    id="allergies"
                    value={allergies}
                    onChange={e => setAllergies(e.target.value)}
                    placeholder="e.g. penicillin, sulfa drugs, latex. Only include if relevant to care decisions."
                    rows={2}
                  />
                </>
            }
          </div>

          {/* FHIR toggle — hidden from standard flow, visible for providers */}
          <div style={{marginBottom:"1.25rem"}}>
            <button
              className="fhir-toggle"
              onClick={() => setFhirOpen(o => !o)}
              type="button"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {fhirOpen
                  ? <path d="M18 15l-6-6-6 6"/>
                  : <path d="M6 9l6 6 6-6"/>
                }
              </svg>
              Are you a care coordinator or healthcare provider? Pre-fill from a patient record.
            </button>
            {fhirOpen && (
              <div className="fhir-expanded">
                <div className="fhir-prefill-label">Patient ID (FHIR sandbox)</div>
                <div className="fhir-prefill-row">
                  <input type="text" className="fhir-input" placeholder="Patient ID" value={fhirId} onChange={e => setFhirId(e.target.value)} />
                  <button className="fhir-btn" onClick={loadFhir} disabled={fhirLoading}>
                    {fhirLoading ? "Loading..." : "Pre-fill"}
                  </button>
                </div>
                {fhirError && <p className="fhir-error">{fhirError}</p>}
                {fhirLoaded && <p className="fhir-success">Fields pre-filled. Review and edit below.</p>}
                <p className="fhir-note">This connects to a FHIR R4 sandbox environment. No data is stored.</p>
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={() => goTo("q2b")}>Continue →</button>
          <button className="btn-ghost" onClick={() => goTo("q2b")}>Skip for now</button>
        </div>
      )}

      {/* ═══ Q2b — Recent changes ═══ */}
      {step === "q2b" && (
        <div className="q-wrap">
          <button className="btn-back" onClick={() => goTo("q2")}>← Back</button>
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"52%"}} /></div>
          <div className="progress-label">Step 3 of 6: Recent changes</div>
          <h2 className="big-q">Has anything changed recently that we should know about?</h2>
          <p className="q-sub">A new diagnosis, a recent hospitalization, a shift in their condition. Anything that feels significant.</p>
          <div className="yn-row">
            <button
              className={`yn-btn${hadRecentChanges === true ? " sel" : ""}`}
              onClick={() => setHadRecentChanges(true)}
            >
              Yes
            </button>
            <button
              className={`yn-btn${hadRecentChanges === false ? " sel" : ""}`}
              onClick={() => { setHadRecentChanges(false); goTo("q2c"); }}
            >
              No
            </button>
          </div>
          {hadRecentChanges === true && (
            <>
              <div className="field" style={{marginTop:"1.25rem"}}>
                <label className="field-label" htmlFor="recentChanges">What changed?</label>
                <textarea
                  id="recentChanges"
                  value={recentChanges}
                  onChange={e => setRecentChanges(e.target.value)}
                  placeholder="New diagnosis, recent hospitalization, change in care plan, new provider..."
                  rows={3}
                />
              </div>
              <button className="btn-primary" onClick={() => goTo("q2c")}>Continue →</button>
            </>
          )}
        </div>
      )}

      {/* ═══ Q2c — Caregiving role ═══ */}
      {step === "q2c" && (
        <div className="q-wrap">
          <button className="btn-back" onClick={() => goTo("q2b")}>← Back</button>
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"65%"}} /></div>
          <div className="progress-label">Step 4 of 6: Your situation</div>
          <h2 className="big-q">What&apos;s your caregiving situation like right now?</h2>
          <p className="q-sub">This helps us give you more realistic guidance.</p>
          <div className="stage-grid">
            {CAREGIVER_ROLES.map(r => (
              <button key={r} className={`stage-btn${caregiverRole === r ? " sel" : ""}`} onClick={() => setCaregiverRole(r)}>
                <div><div className="s-name">{r}</div></div>
                <div className="s-check">
                  {caregiverRole === r && <svg width="10" height="8" viewBox="0 0 12 9" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4.5L4.5 8 11 1"/></svg>}
                </div>
              </button>
            ))}
          </div>
          <button className="btn-primary" disabled={!caregiverRole} onClick={() => goTo("q3")}>Continue →</button>
          <button className="btn-ghost" onClick={() => goTo("q3")}>Skip for now</button>
        </div>
      )}

      {/* ═══ Q3 — Wellbeing ═══ */}
      {step === "q3" && (
        <div className="q-wrap">
          <button className="btn-back" onClick={() => goTo("q2c")}>← Back</button>
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"78%"}} /></div>
          <div className="progress-label">Step 5 of 6: Just for you</div>
          <h2 className="big-q">How are you doing in all of this?</h2>
          <div className="banner">
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>🌿</span>
            <span className="banner-text">This part is just for you. Nothing you share here shows up in the brief.</span>
          </div>
          <div className="check-list">
            {WELLBEING_OPTIONS.map(o => (
              <label className="check-item" key={o.value}>
                <input type="checkbox" checked={wellbeing.includes(o.value)} onChange={() => toggleWellbeing(o.value)} />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
          <button className="btn-primary" onClick={() => goTo("q4")}>Continue →</button>
          <button className="btn-ghost" onClick={() => goTo("q4")}>Skip and continue</button>
        </div>
      )}

      {/* ═══ Q4 — What would help most ═══ */}
      {step === "q4" && (
        <div className="q-wrap">
          <button className="btn-back" onClick={() => goTo("q3")}>← Back</button>
          <QWordmark />
          <div className="progress-track"><div className="progress-fill" style={{width:"91%"}} /></div>
          <div className="progress-label">Step 6 of 6: Your priority</div>
          <h2 className="big-q">What would help most right now?</h2>
          <p className="q-sub">We&apos;ll build your 30-day action plan around your answer.</p>
          {error && <div className="error-banner" style={{marginBottom:"1.5rem"}}>{error}</div>}
          <div className="stage-grid">
            {WN_CONCERNS.map(c => (
              <button key={c} className={`stage-btn${wnConcern === c ? " sel" : ""}`} onClick={() => setWnConcern(c)}>
                <div><div className="s-name">{c}</div></div>
                <div className="s-check">
                  {wnConcern === c && <svg width="10" height="8" viewBox="0 0 12 9" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4.5L4.5 8 11 1"/></svg>}
                </div>
              </button>
            ))}
          </div>
          <button className="btn-primary" disabled={!wnConcern} onClick={generate}>
            Generate my brief →
          </button>
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

          {/* Header */}
          <div className="brief-top">
            <div>
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
            <button className="print-btn no-print" onClick={() => window.print()}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
          </div>

          {/* AT A GLANCE */}
          <div className="brief-glance">
            <div className="brief-glance-label">At a glance</div>
            <div className="brief-glance-body">{brief.atAGlance}</div>
          </div>

          {/* Field cards */}
          {brief.careStage && <BriefCard label="Care stage" body={brief.careStage} />}
          {brief.conditions && <BriefCard label="Conditions" body={brief.conditions} />}
          {brief.medications && <BriefCard label="Medications" body={brief.medications} />}
          {brief.allergies && <BriefCard label="Known allergies" body={brief.allergies} />}
          {brief.careTeam && <BriefCard label="Care team" body={brief.careTeam} />}
          {brief.livingSituation && <BriefCard label="Living situation" body={brief.livingSituation} />}
          {brief.comfortGoals && <BriefCard label="Comfort and care goals" body={brief.comfortGoals} />}
          {brief.importantNotes && <BriefCard label="Recent changes and notes" body={brief.importantNotes} />}

          {/* A note for you */}
          {stage && (
            <div className="ftc-section">
              <div className="section-divider">
                <div className="section-divider-line" />
                <span className="section-divider-label">
                  <span>🌿</span>
                  A note for you
                </span>
                <div className="section-divider-line" />
              </div>

              {brief.forYou && (
                <div className="note-card">
                  <span className="note-card-icon">🌿</span>
                  <div className="note-card-body">{brief.forYou}</div>
                </div>
              )}

              {/* Timeline — guide style */}
              <div style={{marginBottom:"1.5rem"}}>
                {TIMELINE[stage].map((block, idx) => (
                  <div key={block.period}>
                    {idx > 0 && <div className="tl-section-divider" />}
                    <div className="timeline-period">
                      <div className="tl-label">{block.period}</div>
                      <div className="tl-subtitle">{block.subtitle}</div>
                      <div className="tl-items">
                        {block.items.map(item => (
                          <div className="tl-item" key={item}>
                            <input type="checkbox" className="action-cb" aria-label={item} />
                            <div className="tl-text">{item}</div>
                          </div>
                        ))}
                      </div>
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

          <p className="disclosure">
            Generated with AI assistance on {dateStr}. For organizational purposes only. Not a medical record. Not a substitute for professional medical or legal advice.
          </p>

          {/* 30-Day Plan */}
          {wnPlan && (
            <div className="plan-section">
              <div className="section-divider">
                <div className="section-divider-line" />
                <span className="section-divider-label">{planTitle(wnConcern)}</span>
                <div className="section-divider-line" />
              </div>

              {wnConcern && <span className="plan-concern-tag">{wnConcern}</span>}

              <div className="wn-card">
                <div className="wn-card-header">
                  <span className="wn-card-week">Week 1</span>
                  <span className="wn-card-sub">Right Now</span>
                </div>
                {wnPlan.week1.map((item, i) => (
                  <div className="wn-check-row" key={i}>
                    <input type="checkbox" className="action-cb" aria-label={item} />
                    <div className="wn-check-text">{item}</div>
                  </div>
                ))}
              </div>

              <div className="wn-card">
                <div className="wn-card-header">
                  <span className="wn-card-week">Weeks 2–3</span>
                  <span className="wn-card-sub">This Month</span>
                </div>
                {wnPlan.weeks23.map((item, i) => (
                  <div className="wn-check-row" key={i}>
                    <input type="checkbox" className="action-cb" aria-label={item} />
                    <div className="wn-check-text">{item}</div>
                  </div>
                ))}
              </div>

              <div className="wn-card">
                <div className="wn-card-header">
                  <span className="wn-card-week">Week 4</span>
                  <span className="wn-card-sub">Looking Ahead</span>
                </div>
                {wnPlan.week4.map((item, i) => (
                  <div className="wn-check-row" key={i}>
                    <input type="checkbox" className="action-cb" aria-label={item} />
                    <div className="wn-check-text">{item}</div>
                  </div>
                ))}
              </div>

              <p className="wn-disclaimer">
                This plan is a starting point. Always consult your care team for medical decisions.
              </p>
            </div>
          )}

          <div className="no-print" style={{marginTop:"2.5rem",display:"flex",flexDirection:"column" as const,gap:8}}>
            <p style={{fontSize:13,color:"var(--muted)",marginBottom:4}}>Review everything before sharing. AI can make mistakes.</p>
            <button className="btn-ghost" style={{fontSize:14,padding:"11px"}} onClick={reset}>Start over</button>
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
      <div className="brief-card-body" style={{whiteSpace: "pre-line"}}>{body}</div>
    </div>
  );
}
