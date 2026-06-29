"use client";

import { useLang } from "./LanguageProvider";

// The 8 tappable part zones, in draw order. Each key maps 1:1 to an i18n label
// (`part{Key}`) and — upstream in MechanicLog — to a service code. Keeping the
// list here makes the diagram the single source of truth for "what's tappable".
export const CAR_PARTS = [
  "wheels",
  "brakes",
  "engine",
  "body",
  "lights",
  "windshield",
  "suspension",
  "exhaust",
] as const;

export type CarPart = (typeof CAR_PARTS)[number];

type PartLabels = Record<CarPart, string>;

function usedPartLabels(): PartLabels {
  const { t } = useLang();
  return {
    wheels: t.partWheels,
    brakes: t.partBrakes,
    engine: t.partEngine,
    body: t.partBody,
    lights: t.partLights,
    windshield: t.partWindshield,
    suspension: t.partSuspension,
    exhaust: t.partExhaust,
  };
}

type ZoneProps = {
  part: CarPart;
  label: string;
  selected: boolean;
  onToggle: (part: CarPart) => void;
  children: React.ReactNode;
};

// A single tappable hit-area. Whole group is the button: it carries the a11y
// semantics (role/aria-pressed/tabIndex + Enter/Space) and the accent fill flows
// down to its <path>/<circle> children via `fill-current` / text tokens.
function Zone({ part, label, selected, onToggle, children }: ZoneProps) {
  return (
    <g
      role="button"
      aria-pressed={selected}
      aria-label={label}
      tabIndex={0}
      onClick={() => onToggle(part)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(part);
        }
      }}
      className={`cursor-pointer transition-colors [&_*]:transition-colors focus:outline-none focus-visible:[&>*:first-child]:stroke-accent focus-visible:[&>*:first-child]:stroke-[3] ${
        selected ? "text-accent" : "text-surface-2"
      }`}
    >
      {children}
    </g>
  );
}

export function CarDiagram({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (part: string) => void;
}) {
  const labels = usedPartLabels();
  const has = (p: CarPart) => selected.includes(p);

  return (
    <svg
      viewBox="0 0 320 180"
      className="h-auto w-full select-none text-border"
      role="group"
      aria-label="Car diagram"
    >
      {/* ground line */}
      <line
        x1="16"
        y1="150"
        x2="304"
        y2="150"
        className="text-border"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* ───── BODY (lower shell / doors) ───── */}
      <Zone part="body" label={labels.body} selected={has("body")} onToggle={onToggle}>
        <path
          d="M40 120
             L40 96
             Q40 90 46 90
             L104 90
             L132 64
             Q136 60 142 60
             L210 60
             Q218 60 222 66
             L242 90
             L274 96
             Q282 98 282 108
             L282 120
             Q282 126 276 126
             L46 126
             Q40 126 40 120 Z"
          fill="currentColor"
          className={has("body") ? "text-accent" : "text-surface-2"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ stroke: "var(--border)" }}
        />
      </Zone>

      {/* ───── WINDSHIELD + cabin glass ───── */}
      <Zone
        part="windshield"
        label={labels.windshield}
        selected={has("windshield")}
        onToggle={onToggle}
      >
        <path
          d="M138 66
             L156 66
             L156 88
             L120 88 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          style={{ stroke: "var(--muted)" }}
        />
        <path
          d="M164 66
             L204 66
             Q210 66 213 70
             L224 88
             L164 88 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          style={{ stroke: "var(--muted)" }}
        />
      </Zone>

      {/* ───── ENGINE / hood ───── */}
      <Zone part="engine" label={labels.engine} selected={has("engine")} onToggle={onToggle}>
        <path
          d="M226 70
             L240 90
             L272 95
             Q280 96 280 104
             L242 104
             Q234 104 230 96
             L222 72 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          style={{ stroke: "var(--muted)" }}
        />
      </Zone>

      {/* ───── LIGHTS / headlight ───── */}
      <Zone part="lights" label={labels.lights} selected={has("lights")} onToggle={onToggle}>
        <path
          d="M278 100
             Q286 100 286 108
             L286 114
             Q286 118 281 117
             L278 116 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          style={{ stroke: "var(--muted)" }}
        />
      </Zone>

      {/* ───── EXHAUST ───── */}
      <Zone part="exhaust" label={labels.exhaust} selected={has("exhaust")} onToggle={onToggle}>
        <path
          d="M40 122
             L26 122
             Q20 122 20 127
             Q20 132 26 132
             L40 132 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          style={{ stroke: "var(--muted)" }}
        />
      </Zone>

      {/* ───── SUSPENSION (axle bar) ───── */}
      <Zone
        part="suspension"
        label={labels.suspension}
        selected={has("suspension")}
        onToggle={onToggle}
      >
        <rect
          x="84"
          y="124"
          width="156"
          height="8"
          rx="4"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.4"
          style={{ stroke: "var(--muted)" }}
        />
      </Zone>

      {/* ───── WHEELS (tyres) — front + rear ───── */}
      <Zone part="wheels" label={labels.wheels} selected={has("wheels")} onToggle={onToggle}>
        <circle
          cx="98"
          cy="134"
          r="18"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
          style={{ stroke: "var(--muted)" }}
        />
        <circle cx="98" cy="134" r="7" fill="var(--surface)" style={{ stroke: "var(--border)" }} strokeWidth="1.4" stroke="currentColor" />
        <circle
          cx="226"
          cy="134"
          r="18"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
          style={{ stroke: "var(--muted)" }}
        />
        <circle cx="226" cy="134" r="7" fill="var(--surface)" style={{ stroke: "var(--border)" }} strokeWidth="1.4" stroke="currentColor" />
      </Zone>

      {/* ───── BRAKES (caliper discs, sit over wheel hubs) ───── */}
      <Zone part="brakes" label={labels.brakes} selected={has("brakes")} onToggle={onToggle}>
        <path
          d="M98 120 a14 14 0 0 1 13 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className={has("brakes") ? "text-accent" : "text-muted"}
        />
        <path
          d="M226 120 a14 14 0 0 1 13 9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          className={has("brakes") ? "text-accent" : "text-muted"}
        />
      </Zone>
    </svg>
  );
}
