export const INTERESTS = {
  cuisines: {
    label: "Food we love",
    options: [
      "North Indian", "South Indian", "Bengali", "Street food", "Biryani", "Chinese", "Pan-Asian",
      "Japanese", "Korean", "Thai", "Italian", "Mexican", "Middle Eastern", "Continental",
      "Vegan", "Cafés & brunch", "Desserts", "Home cooking", "Fine dining",
    ],
  },
  music: {
    label: "Music",
    options: [
      "Bollywood", "Indie", "Indian classical", "Sufi", "Punjabi", "Pop", "Rock", "Hip-hop",
      "Electronic", "Jazz", "K-pop", "Retro", "Metal", "Live gigs",
    ],
  },
  movies: {
    label: "Movies & shows",
    options: [
      "Bollywood", "Regional cinema", "Hollywood", "Comedy", "Thriller", "Horror", "Rom-com",
      "Documentaries", "Anime", "K-dramas", "Sci-fi", "Sitcoms", "Indie films", "Sports",
    ],
  },
  activities: {
    label: "Things we do",
    options: [
      "Board games", "Quiz nights", "Treks & hikes", "Road trips", "Travel", "Gym & fitness",
      "Running", "Cycling", "Yoga", "Cricket", "Football", "Badminton", "Pottery & art",
      "Book club", "Stand-up comedy", "Theatre", "Gaming", "Cooking together", "Pets", "Volunteering",
    ],
  },
} as const;

export type InterestKey = keyof typeof INTERESTS;
export const INTEREST_KEYS = Object.keys(INTERESTS) as InterestKey[];

export const CITIES = [
  "Delhi", "Gurugram", "Noida", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Kolkata",
  "Pune", "Ahmedabad", "Jaipur", "Chandigarh", "Lucknow", "Kochi", "Goa", "Indore",
];

export const DRINKS_LABEL: Record<string, string> = {
  yes: "We drink",
  sometimes: "Drink sometimes",
  no: "Non-drinkers",
};

export const KIDS_LABEL: Record<string, string> = {
  none: "No kids",
  have_kids: "Parents",
  expecting: "Expecting",
  prefer_not_say: "",
};

export function ageFrom(birthYear: number | null | undefined) {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
}

/** "Arjun, 29 & Kabir, 31" */
export function memberLine(members: { display_name: string | null; birth_year: number | null }[]) {
  return members
    .map((m) => {
      const age = ageFrom(m.birth_year);
      return `${m.display_name ?? "Someone"}${age ? `, ${age}` : ""}`;
    })
    .join(" & ");
}

export function yearsTogether(since: string | null) {
  if (!since) return null;
  const ms = Date.now() - new Date(since).getTime();
  const years = Math.floor(ms / (365.25 * 24 * 3600 * 1000));
  if (years < 1) return "Together < 1 year";
  return `Together ${years} year${years === 1 ? "" : "s"}`;
}
