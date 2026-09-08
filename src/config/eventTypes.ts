// Calendar event types. Add a new one here and it shows up in the add/edit
// form, paints its icon on the day square, and gets a jump link — no other
// code changes needed.

export interface EventField {
  key: string;
  label: string;
  placeholder?: string;
}

export interface EventTypeDef {
  key: string;
  label: string;
  icon: string; // emoji for now
  accent: string; // hex, used for the badge tint
  fields?: EventField[]; // extra inputs beyond title/date/time/description/location
  /** resolve the "jump" target from a stored event; null = no jump, just open detail */
  link?: (e: Record<string, any>) => string | null;
  linkLabel?: string;
}

const mapsUrl = (q?: string) =>
  q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;

export const EVENT_TYPES: EventTypeDef[] = [
  {
    key: "interview",
    label: "Interview",
    icon: "💼",
    accent: "#f5a623",
    fields: [{ key: "prepUrl", label: "Notion prep doc", placeholder: "https://www.notion.so/…" }],
    link: (e) => e.prepUrl || null,
    linkLabel: "Prep doc",
  },
  {
    key: "date",
    label: "Date",
    icon: "🍸",
    accent: "#f0426a",
    link: (e) => mapsUrl(e.location),
    linkLabel: "Location",
  },
];

// keys that any event type might attach, so the calendar API/cache round-trips them
export const EVENT_EXTRA_KEYS: string[] = Array.from(
  new Set(EVENT_TYPES.flatMap((t) => (t.fields || []).map((f) => f.key)))
);

export const getEventType = (key?: string | null): EventTypeDef | undefined =>
  key ? EVENT_TYPES.find((t) => t.key === key) : undefined;
