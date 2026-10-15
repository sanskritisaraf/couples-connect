export type Couple = {
  id: string;
  name: string;
  bio: string | null;
  how_we_met: string | null;
  city: string | null;
  neighbourhood: string | null;
  together_since: string | null;
  photo_url: string | null;
  cuisines: string[];
  music: string[];
  movies: string[];
  activities: string[];
  drinks: "yes" | "sometimes" | "no" | null;
  kids: "none" | "have_kids" | "expecting" | "prefer_not_say" | null;
  status: "pending" | "active";
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  couple_id: string | null;
};

export type DiscoverCouple = Pick<
  Couple,
  | "id" | "name" | "bio" | "city" | "neighbourhood" | "together_since" | "photo_url"
  | "cuisines" | "music" | "movies" | "activities" | "drinks" | "kids"
> & {
  shared_cuisines: string[];
  shared_music: string[];
  shared_movies: string[];
  shared_activities: string[];
  shared_count: number;
  partner_proposed: boolean;
};

export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
