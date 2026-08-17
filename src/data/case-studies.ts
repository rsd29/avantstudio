export type CaseStudy = {
  id: string;
  title: string;
  category: string;
  year: string;
  color: string;
  ink: string;
  lede: string;
  role: string;
  services: string[];
  body: string[];
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "01",
    title: "Northline",
    category: "Branding",
    year: "2025",
    color: "#111111",
    ink: "#f4f4f5",
    lede: "A quieter identity for a label that wanted the clothes to speak first.",
    role: "Brand, Art Direction",
    services: ["Identity", "Packaging", "Guidelines"],
    body: [
      "Northline came to us with a decade of product and almost no language around it. The brief was to build a system that felt as considered as the garments — reduced, tactile, and slow.",
      "We rebuilt the mark from the construction lines of a coat pattern, then extended it into type, hangtags, and a small editorial series. Everything is designed to live on paper before it lives on screen.",
      "The result is a brand that recedes on purpose. It holds space for the work instead of competing with it.",
    ],
  },
  {
    id: "02",
    title: "Pulse",
    category: "Product",
    year: "2025",
    color: "#e11d48",
    ink: "#ffffff",
    lede: "A wellness app that treats ritual as a product, not a notification.",
    role: "Product Design",
    services: ["UX", "UI", "Prototype"],
    body: [
      "Pulse needed onboarding that didn’t feel like a lecture. We mapped the first seven days as a sequence of small, completable gestures rather than a dashboard dump.",
      "Color does the pacing. High-energy states stay rare; most of the interface sits in a calmer register so the moments that matter actually land.",
      "We shipped a clickable prototype, a motion spec, and a component set the internal team could keep moving without us in the room.",
    ],
  },
  {
    id: "03",
    title: "Atlas",
    category: "Web",
    year: "2024",
    color: "#2563eb",
    ink: "#ffffff",
    lede: "A studio site that behaves like a reading room, not a portfolio dump.",
    role: "Web, Design",
    services: ["Art Direction", "Front-end", "CMS"],
    body: [
      "Atlas had the work. They didn’t have a way to walk someone through it. We designed the site as a sequence of rooms — each project a space you enter, not a thumbnail you scan.",
      "Typography carries the navigation. Imagery is allowed to be large and slow. The CMS is structured so they can publish a case without breaking the rhythm.",
      "Built to feel considered on a phone and generous on a desk.",
    ],
  },
  {
    id: "04",
    title: "Summit",
    category: "Campaign",
    year: "2024",
    color: "#ca8a04",
    ink: "#111111",
    lede: "A three-week campaign for a conference that needed to feel inevitable.",
    role: "Campaign",
    services: ["Identity", "Social", "Landing"],
    body: [
      "Summit already had speakers. What it didn’t have was a visual argument for showing up. We treated the campaign like a poster series that happened to live in feeds and on a landing page.",
      "A single typographic lockup, a tight color pair, and motion that only ever moves in one direction — forward.",
      "Registration lifted, but the more useful outcome was a system the team reused for the following year without starting over.",
    ],
  },
  {
    id: "05",
    title: "Vesper",
    category: "Editorial",
    year: "2025",
    color: "#7c3aed",
    ink: "#ffffff",
    lede: "An independent magazine with the pace of print and the reach of a feed.",
    role: "Editorial Design",
    services: ["Art Direction", "Layout", "Digital"],
    body: [
      "Vesper wanted issues that felt collected, not posted. We designed a print grid first, then translated it into a reading surface online that keeps the same margins, the same pause.",
      "Images are cropped like stills from a longer film. Captions are allowed to be long. Nothing autoplays.",
      "Issue 04 was the first to ship in the new system — print, site, and a small set of moving covers.",
    ],
  },
  {
    id: "06",
    title: "Holloway",
    category: "Commerce",
    year: "2024",
    color: "#16a34a",
    ink: "#ffffff",
    lede: "A shop that feels like a storefront, even when it’s just a tab.",
    role: "Commerce, Brand",
    services: ["Identity", "UX", "Storefront"],
    body: [
      "Holloway sells objects with weight. The previous site treated them like SKUs. We rebuilt the catalogue as a sequence of encounters — material, scale, and a little air around each piece.",
      "Checkout stayed quiet. The work was in the browsing: filters that don’t look like filters, photography that doesn’t flatten the object.",
      "Conversion held. Time on product pages did not — in a good way.",
    ],
  },
  {
    id: "07",
    title: "Drift",
    category: "Product",
    year: "2024",
    color: "#ea580c",
    ink: "#ffffff",
    lede: "A navigation product for people who would rather look up than down.",
    role: "Product, Motion",
    services: ["UX", "Motion", "Prototype"],
    body: [
      "Drift’s hardware was ahead of its interface. We spent the first weeks walking with the device, then designed for glance, not for dwell.",
      "The UI is almost absent until you need it. Haptics and a narrow type system do most of the talking.",
      "We delivered a motion language the firmware team could implement in pieces, not a single unshippable vision.",
    ],
  },
  {
    id: "08",
    title: "Nimbus",
    category: "App",
    year: "2025",
    color: "#0891b2",
    ink: "#ffffff",
    lede: "Weather, stripped of the panic and the widgets.",
    role: "App Design",
    services: ["UI", "Brand", "Prototype"],
    body: [
      "Most weather apps shout. Nimbus was asked to be the opposite — a surface you check, not a surface that checks you.",
      "We used a single temperature color field and let type handle the rest. No radar theater. No ten-day anxiety.",
      "The prototype became the north star for a small native team. Shipping followed the same reduction.",
    ],
  },
  {
    id: "09",
    title: "Harbor",
    category: "Digital",
    year: "2023",
    color: "#3f3f46",
    ink: "#f4f4f5",
    lede: "A civic platform that had to feel trustworthy without feeling institutional.",
    role: "Digital, Content",
    services: ["UX", "Content", "Design System"],
    body: [
      "Harbor sits between a city and its residents. The previous site was a PDF graveyard. We rebuilt information architecture around tasks, not departments.",
      "The system is deliberately plain. Hierarchy comes from type size and space, not from decoration.",
      "Staff can publish without a designer in the loop — which was the actual brief, even if it wasn’t written down.",
    ],
  },
  {
    id: "10",
    title: "Lumen",
    category: "Exhibition",
    year: "2025",
    color: "#e4e4e7",
    ink: "#111111",
    lede: "A light installation that needed a graphic language as quiet as the work.",
    role: "Exhibition, Identity",
    services: ["Identity", "Spatial", "Print"],
    body: [
      "Lumen is almost nothing in a room except light. The identity had to behave the same way — present, then gone.",
      "We used a hairline mark, uncoated stock, and wayfinding that only appears when the lights do. The catalogue is the only object that stays.",
      "Visitors left with a single folded sheet. That was the whole campaign.",
    ],
  },
];

export const GRID_COLS = 5;
export const GRID_ROWS = 2;
