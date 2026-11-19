// Home screen layout and card art from the Brisic prototype (Home.dc.html), in the order
// the team asked for. Sample content until the Global Tune API provides real shelves.

import type { CoverArt, HomeSection } from "./types";

type Card = { title: string; sub: string; art: CoverArt; href?: string };

/** Standard poster card: gradient, BEBAS label top-left. */
const mk = (title: string, sub: string, from: string, to: string, label: string, ink?: string): Card =>
  ({ title, sub, art: { from, to, label, ink } });
/** Song-named card (label from the title). */
const sg = (title: string, sub: string, from: string, to: string): Card =>
  mk(title, sub, from, to, title.toUpperCase().replace(" ", "\n"));
/** Large "Playlist made for you" card: soft label, starry sky and a figure. */
const big = (title: string, from: string, to: string, angle: number, ink: string, pfill: string, px: number): Card =>
  ({ title, sub: "Made for you", art: { from, to, angle, label: title.replace(" ", "\n"), ink, soft: true, figure: "stars", pfill, px } });

const PAL: [string, string][] = [
  ["#1c6be0", "#0a2a7a"], ["#e8562a", "#7d1f0a"], ["#2f7a34", "#10381a"], ["#c0309a", "#4a0f55"], ["#f2a62a", "#b36a0a"],
  ["#2a8a8a", "#0c2a30"], ["#7a2a8a", "#d63a5a"], ["#e02a2a", "#6a0a0a"], ["#142a5a", "#070d24"], ["#8a6a2a", "#2a1a08"],
];
const fill = (cards: Card[], names: string[], to: number) => {
  for (let i = 0; cards.length < to; i++) {
    const [a, b] = PAL[(cards.length + 3) % PAL.length];
    const name = names[i % names.length];
    cards.push(mk(name, "Brisic", a, b, name.toUpperCase().replace(" ", "\n")));
  }
  return cards;
};

export type HomeShelf = { title: string; kind: NonNullable<HomeSection["kind"]>; cards: Card[] };

export const HOME_SHELVES: HomeShelf[] = [
  {
    title: "Afro-pop", kind: "playlists", cards: fill([
      { title: "Afro Hits", sub: "The biggest songs", art: { from: "#2c7a3a", to: "#0e3318", label: "AFRO\nHITS", ink: "#eef2dc", size: 32, figure: "person", px: 92, pfill: "#0b1c10" } },
      { title: "Afro Pop 2024", sub: "This year's best", art: { from: "#f2a62a", to: "#b36a0a", label: "AFRO\nPOP\n2024", ink: "#1b1204", size: 26, figure: "person", px: 94, pfill: "#1b1204" } },
      { title: "Chill Afro", sub: "Easy Afro grooves", art: { from: "#1e6f86", to: "#0f4a60", bg: "linear-gradient(180deg,#1e6f86 0%,#0f4a60 55%,#d9742a 100%)", label: "CHILL\nAFRO", ink: "#69d8c8", size: 32, figure: "palm" } },
    ], ["Afro Gold", "Lagos Nights", "Accra Vibes", "Naija Wave", "Afro Fusion", "Island Beat"], 9),
  },
  {
    title: "Playlist Made for you", kind: "large", cards: [
      big("Late Nights", "#142a5a", "#070d24", 170, "#f1f5ff", "#0a1020", 92),
      big("Good Vibes", "#7a2a8a", "#d63a5a", 150, "#fff4f4", "#2a0c2a", 88),
      big("Morning Rise", "#e8a23a", "#7d3a0a", 160, "#fff6e6", "#2a1204", 90),
      big("Gym Fire", "#c0302a", "#3a0a0a", 150, "#fff0ee", "#1a0505", 86),
      big("Slow Dance", "#c0309a", "#3a0f45", 160, "#fff0fb", "#1f0a22", 92),
      big("Road Trip", "#1e6f86", "#0a2a3a", 150, "#e8fbff", "#071a22", 88),
      big("Focus Mode", "#2f7a34", "#0a2a10", 160, "#effff0", "#07140a", 90),
      big("Weekend Party", "#e0782a", "#6a1a5a", 150, "#fff3ea", "#240a1a", 86),
      big("Sunday Soul", "#8a6a2a", "#2a1a08", 160, "#fff8e6", "#1a1204", 92),
    ],
  },
  {
    title: "Street Anthem", kind: "playlists", cards: [
      mk("Street Anthem", "Made for you", "#e08a3a", "#5a2a10", "STREET\nANTHEM"),
      mk("100 Street Anthem", "Made for you", "#2a8a8a", "#0c2a30", "100\nSTREET\nANTHEM"),
      mk("Top 100 Anthem", "Made for you", "#e8562a", "#7d1f0a", "TOP\n100\nANTHEM"),
      sg("Last Last", "Kelechi Ade", "#e08a3a", "#5a2a10"), sg("Calm Down", "Tobi Rae", "#2a8a8a", "#0c2a30"),
      sg("Sungba", "Dayo Mane", "#f07a2a", "#8a2a0a"), sg("Essence", "Nuela", "#9a5ab8", "#2a0f45"),
      sg("Joy", "Sade Vox", "#2a5ac8", "#0c1a5a"), sg("Tornado", "Zuri Kaya", "#3ae0a0", "#0a3a2a"),
    ],
  },
  {
    title: "New Releases", kind: "playlists", cards: [
      mk("Midnight Prayer", "Unknown Artist", "#1c6be0", "#0a2a7a", "NEW\nDROP"), mk("Joy Ride", "Dayo Mane", "#f07a2a", "#8a2a0a", "JOY\nRIDE"),
      mk("Lagos Lights", "Tobi Rae", "#2a8a8a", "#0c2a30", "LAGOS\nLIGHTS"), mk("Fresh Start", "Nuela", "#9a5ab8", "#2a0f45", "FRESH\nSTART"),
      mk("Golden Hour", "Kelechi Ade", "#e08a3a", "#5a2a10", "GOLDEN\nHOUR"), mk("No Sleep", "Sade Vox", "#2a5ac8", "#0c1a5a", "NO\nSLEEP"),
    ],
  },
  {
    title: "Top Charts Nigeria", kind: "playlists", cards: [
      mk("Top 50 Nigeria", "Updated daily", "#2f7a34", "#10381a", "TOP\n50", "#f2c94c"), mk("Naija Top 10", "This week", "#e8562a", "#7d1f0a", "NAIJA\nTOP 10", "#f6e0a2"),
      mk("Afro Viral", "Trending now", "#c0309a", "#4a0f55", "AFRO\nVIRAL"), mk("Rising Stars", "Emerging artists", "#d6841a", "#5a2a08", "RISING\nSTARS"),
      mk("Top 50 Africa", "Across the continent", "#1c6be0", "#0a2a7a", "TOP 50\nAFRICA"), mk("Weekend Hits", "Friday to Sunday", "#e8562a", "#7d1f0a", "WEEKEND\nHITS"),
    ],
  },
  {
    title: "Hip-Hop & Rap", kind: "playlists", cards: [
      mk("Street Heat", "Hip-hop hits", "#4a4d4b", "#0d0f0e", "STREET\nHEAT", "#f2c94c"), mk("Cypher Nights", "Freestyle vibes", "#2f7f6a", "#0f3a2c", "CYPHER\nNIGHTS"),
      mk("Bars & Beats", "Lyrical picks", "#7a2a8a", "#2a0f45", "BARS &\nBEATS"), mk("Rap Naija", "Home grown", "#e02a2a", "#6a0a0a", "RAP\nNAIJA"),
      mk("Trap Lagos", "Heavy 808s", "#2a2a2a", "#050505", "TRAP\nLAGOS", "#7ee08a"), mk("Old School Rap", "Classics", "#c9a42a", "#5a4410", "OLD\nSCHOOL", "#1b1204"),
    ],
  },
  {
    title: "Chill & R&B", kind: "playlists", cards: [
      mk("Slow Jams", "Smooth R&B", "#9a5ab8", "#2a0f45", "SLOW\nJAMS"), mk("Soft Life", "Easy listening", "#d63a5a", "#5a1a3a", "SOFT\nLIFE"),
      mk("Sunday Calm", "Wind down", "#1e6f86", "#0f4a60", "SUNDAY\nCALM", "#69d8c8"), mk("Late Vibes", "After dark", "#142a5a", "#070d24", "LATE\nVIBES"),
      mk("Rainy Day", "Cosy tunes", "#1e6f86", "#0a2a3a", "RAINY\nDAY"), mk("Love Notes", "Soft and sweet", "#d63a5a", "#5a1a3a", "LOVE\nNOTES"),
    ],
  },
  {
    title: "Gospel & Worship", kind: "playlists", cards: [
      mk("Morning Worship", "Start the day", "#f2a62a", "#b36a0a", "MORNING\nWORSHIP", "#2a1a05"), mk("Grace Notes", "Gospel favourites", "#6a8ae0", "#1a2a6a", "GRACE\nNOTES"),
      mk("Praise Break", "Upbeat praise", "#e8562a", "#7d1f0a", "PRAISE\nBREAK"), mk("Peace Within", "Calm and prayer", "#2f8a3a", "#0c3a1a", "PEACE\nWITHIN"),
      mk("Sunday Service", "Choir favourites", "#c9a42a", "#5a4410", "SUNDAY\nSERVICE", "#1b1204"), mk("Night Prayer", "Quiet worship", "#142a5a", "#070d24", "NIGHT\nPRAYER"),
    ],
  },
  {
    title: "Podcasts for You", kind: "podcasts", cards: [
      mk("Behind the Music", "Ama Quaye", "#7a2a8a", "#2a0f45", "BEHIND\nTHE MUSIC"), mk("The Come Up", "Emerging artist stories", "#d6841a", "#5a2a08", "THE\nCOME UP"),
      mk("Afro Talks", "Music and culture", "#1c6be0", "#0a2a7a", "AFRO\nTALKS"), mk("Faith & Frequency", "Faith in music", "#2f8a3a", "#0c3a1a", "FAITH &\nFREQUENCY"),
      mk("Studio Stories", "Behind the scenes", "#2f7a34", "#10381a", "STUDIO\nSTORIES"), mk("Laugh Lounge", "Comedy", "#f2a62a", "#b36a0a", "LAUGH\nLOUNGE", "#2a1a05"),
    ],
  },
  {
    title: "Throwback Classics", kind: "playlists", cards: [
      mk("2000s Naija", "Nostalgia hits", "#e08a3a", "#5a2a10", "2000s\nNAIJA"), mk("90s Gold", "Golden era", "#c9a42a", "#5a4410", "90s\nGOLD", "#1b1204"),
      mk("Highlife Roots", "Where it began", "#2f7a34", "#10381a", "HIGHLIFE\nROOTS"), mk("Old School Jams", "Classic party", "#c0309a", "#3a0f55", "OLD\nSCHOOL"),
      mk("Fuji & Juju", "Legends", "#7a2a8a", "#2a0f45", "FUJI &\nJUJU"), mk("Disco Days", "Retro party", "#d63a5a", "#5a1a3a", "DISCO\nDAYS"),
    ],
  },
  {
    title: "Join a Party", kind: "parties", cards: [
      mk("Friday Night Vibes", "Live now", "#2f8a3a", "#0c3a1a", "FRIDAY\nNIGHT", "#f2c94c"), mk("Throwback Party", "Vote the songs", "#c0309a", "#4a0f55", "THROW\nBACK"),
      mk("Sunday Chill Room", "Chill together", "#2a8a8a", "#0c2a30", "CHILL\nROOM"), mk("Study Beats Room", "Focus together", "#1c6be0", "#0a2a7a", "STUDY\nBEATS"),
      mk("Gym Motivation", "Pump it up", "#e02a2a", "#6a0a0a", "GYM\nBEATS"), mk("Road Trip Room", "Sing along", "#d6841a", "#5a2a08", "ROAD\nTRIP"),
    ],
  },
  {
    title: "Amapiano", kind: "playlists", cards: [
      mk("Piano People", "Log drum vibes", "#c0309a", "#4a0f55", "PIANO\nPEOPLE"), mk("Amapiano Hits", "Top picks", "#2f7a34", "#10381a", "AMAPIANO\nHITS"),
      mk("Private School", "Smooth piano", "#1c6be0", "#0a2a7a", "PRIVATE\nSCHOOL"), mk("Sunset Piano", "Golden hour", "#e08a3a", "#5a2a10", "SUNSET\nPIANO"),
      mk("Dance Floor", "Non-stop", "#d63a5a", "#5a1a3a", "DANCE\nFLOOR"), mk("Piano Chill", "Easy flow", "#2a8a8a", "#0c2a30", "PIANO\nCHILL"),
    ],
  },
  {
    title: "Reggae & Dancehall", kind: "playlists", cards: [
      mk("Island Vibes", "Reggae roots", "#7ab82a", "#2a5a1a", "ISLAND\nVIBES", "#1b1204"), mk("Dancehall Fire", "Hot picks", "#e02a2a", "#6a0a0a", "DANCE\nHALL"),
      mk("Roots & Culture", "Classic reggae", "#c9a42a", "#5a4410", "ROOTS &\nCULTURE", "#1b1204"), mk("Ragga Mix", "High energy", "#2f7a34", "#10381a", "RAGGA\nMIX"),
      mk("One Love", "Feel good", "#e8562a", "#7d1f0a", "ONE\nLOVE"), mk("Sunny Skank", "Sunshine", "#f2a62a", "#b36a0a", "SUNNY\nSKANK", "#2a1a05"),
    ],
  },
  {
    title: "Pop Hits", kind: "playlists", cards: [
      mk("Pop Rising", "New pop", "#c0309a", "#4a0f55", "POP\nRISING"), mk("Today Hits", "Right now", "#1c6be0", "#0a2a7a", "TODAY\nHITS"),
      mk("Pop Princess", "Big voices", "#d63a5a", "#5a1a3a", "POP\nPRINCESS"), mk("Sing Along", "Everyone knows", "#f2a62a", "#b36a0a", "SING\nALONG", "#2a1a05"),
      mk("Pop Remix", "Fresh takes", "#2a8a8a", "#0c2a30", "POP\nREMIX"), mk("Feel Good Pop", "Good mood", "#7ab82a", "#2a5a1a", "FEEL\nGOOD", "#1b1204"),
    ],
  },
  {
    title: "Workout & Energy", kind: "playlists", cards: [
      mk("Gym Beast", "Heavy lifts", "#e02a2a", "#6a0a0a", "GYM\nBEAST"), mk("Run Fast", "Cardio tempo", "#e8562a", "#7d1f0a", "RUN\nFAST"),
      mk("Pump Up", "Get hyped", "#f2a62a", "#b36a0a", "PUMP\nUP", "#2a1a05"), mk("Power Hour", "Push harder", "#2a2a2a", "#050505", "POWER\nHOUR", "#7ee08a"),
      mk("Morning Run", "Fresh start", "#2f7a34", "#10381a", "MORNING\nRUN"), mk("Cool Down", "Stretch out", "#1e6f86", "#0a2a3a", "COOL\nDOWN"),
    ],
  },
  {
    title: "Focus & Study", kind: "playlists", cards: [
      mk("Deep Focus", "Stay in the zone", "#142a5a", "#070d24", "DEEP\nFOCUS"), mk("Study Beats", "Lo-fi and calm", "#2a8a8a", "#0c2a30", "STUDY\nBEATS"),
      mk("Work Flow", "Get it done", "#2f7a34", "#10381a", "WORK\nFLOW"), mk("Quiet Mind", "Soft piano", "#9a5ab8", "#2a0f45", "QUIET\nMIND"),
      mk("Library Hum", "Background sound", "#c9a42a", "#5a4410", "LIBRARY\nHUM", "#1b1204"), mk("Exam Season", "Concentrate", "#1c6be0", "#0a2a7a", "EXAM\nSEASON"),
    ],
  },
  {
    title: "Love Songs", kind: "playlists", cards: [
      mk("Love Notes", "Romantic picks", "#d63a5a", "#5a1a3a", "LOVE\nNOTES"), mk("Date Night", "Dinner for two", "#7a2a8a", "#2a0f45", "DATE\nNIGHT"),
      mk("Wedding Day", "Celebrate love", "#c9a42a", "#5a4410", "WEDDING\nDAY", "#1b1204"), mk("Heart Eyes", "Crush mode", "#e8562a", "#7d1f0a", "HEART\nEYES"),
      mk("Slow Dance Love", "Hold me close", "#142a5a", "#070d24", "SLOW\nDANCE"), mk("Forever Yours", "Always", "#c0309a", "#4a0f55", "FOREVER\nYOURS"),
    ],
  },
  { title: "Artist Spotlight", kind: "spotlight", cards: [] },
  {
    title: "Mood Boosters", kind: "playlists", cards: [
      mk("Happy Days", "Smile more", "#f2a62a", "#b36a0a", "HAPPY\nDAYS", "#2a1a05"), mk("Feel Strong", "Confidence", "#e02a2a", "#6a0a0a", "FEEL\nSTRONG"),
      mk("Good Morning", "Wake up right", "#e08a3a", "#5a2a10", "GOOD\nMORNING"), mk("Sunshine", "Bright and warm", "#c9a42a", "#5a4410", "SUN\nSHINE", "#1b1204"),
      mk("Dance Out", "Move your body", "#c0309a", "#4a0f55", "DANCE\nOUT"), mk("Chin Up", "Better days", "#2f7a34", "#10381a", "CHIN\nUP"),
    ],
  },
];

/** Art for the Artist Spotlight shelf, in order (from the prototype's spotlight cards). */
export const SPOTLIGHT_ART: [string, string][] = [
  ["#3f9a2a", "#07120a"], ["#9a5ab8", "#2a0f45"], ["#e08a3a", "#5a2a10"], ["#2a5ac8", "#0c1a5a"], ["#2f7a34", "#10381a"], ["#d63a5a", "#5a1a3a"],
];
