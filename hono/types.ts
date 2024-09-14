export const interestKeys = [
  'alcohol',
  'anime',
  'artGraphics',
  'baking',
  'charity',
  'clubbing',
  'cooking',
  'danceBallroom',
  'danceContemporary',
  'dramatics',
  'exerciseAndHealth',
  'film',
  'finance',
  'football',
  'hiking',
  'kpop',
  'martialArts',
  'otherSports',
  'performingMusicClassical',
  'performingMusicPopRockJazz',
  'photography',
  'politics',
  'racketSports',
  'rowing',
  'rugby',
  'tabletopGames',
  'videoGames'
] as const;
export type Interests = Record<(typeof interestKeys)[number], 0 | 1 | 2>;

export const genderOptions = ["male", "female", "other", "n/a"] as const;
export type Gender = typeof genderOptions[number]; 

export type UserRole = 'parent' | 'fresher';
export type AuthRoles =
  | 'parent'
  | 'fresher'
  | 'authenticated'
  | 'all'
  | 'unauthenticated';

export type Env = {
  Variables: {
    shortcode: string | null;
    user_is: UserRole | null;
  };
};
