// Mirrors 0.Agents/Hermes/context/web_watchlist.md's section headers -- that
// file drives what news_roundup actually scans; this is a hand-kept summary
// so the webapp (which can't read Hermes' local filesystem in production)
// can group the roundup digest by section/source instead of just a flat
// per-site list. Keep in sync by hand when the watchlist's sections change,
// same pattern as roadmapStatus.js mirroring roadmap.md.
//
// Politico is a Traditional/legacy outlet, not its own category -- the
// watchlist just splits it into 6 narrow RSS feeds (Politics/Congress/
// Health Care/Defense/Economy/Energy) instead of one general feed. Those 6
// still arrive as separate headers in the digest; POLITICO_SUBFEEDS lists
// them so the page can merge them into one "Politico" source under
// Traditional (RSS), same as every other outlet there.
export const POLITICO_SUBFEEDS = [
  "Politico Politics",
  "Politico Congress",
  "Politico Health Care",
  "Politico Defense",
  "Politico Economy",
  "Politico Energy",
];

// YouTube channels (transcript-based, not article-published) -- excluded
// from the "0 headlines N days in a row" staleness flag, since a channel
// genuinely not posting for a few days isn't a fetch failure the way a
// news site returning nothing is.
export const YOUTUBE_SITES = ["Hassan Piker", "EuroDollar University", "Felix and Friends"];

export const NEWS_SECTIONS = [
  { section: "Traditional (RSS)", sites: ["NYT", "CNN", "Fox", "The Hill", "Reuters", "AP", "Politico"] },
  { section: "Traditional International", sites: ["Al Jazeera", "BBC", "CFR", "Le Monde", "Semafor"] },
  { section: "New Media", sites: ["Jacobin", "The Bulwark", "Ground News", "Hassan Piker", "Stratechery"] },
  {
    section: "Business",
    sites: ["Bloomberg", "WSJ", "The Economist", "ZeroHedge", "EuroDollar University", "Felix and Friends"],
  },
];
