const interestKeys = [
  "alcohol",
  "anime",
  "artGraphics",
  "baking",
  "charity",
  "clubbing",
  "cooking",
  "danceBallroom",
  "danceContemporary",
  "dramatics",
  "exerciseAndHealth",
  "film",
  "finance",
  "football",
  "hiking",
  "kpop",
  "martialArts",
  "otherSports",
  "performingMusicClassical",
  "performingMusicPopRockJazz",
  "photography",
  "politics",
  "racketSports",
  "rowing",
  "rugby",
  "tabletopGames",
  "videoGames",
] as const;
export type Interests = Record<(typeof interestKeys)[number], 0 | 1 | 2>;

export type UserRole = "parent" | "fresher"
export type AuthRoles = "parent" | "fresher" | "authenticated" | "all" | "unauthenticated";

export type Env = {
  Variables: {
    email: string | null;
    user_is: UserRole | null
  }
}