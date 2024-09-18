declare interface IStudent {
  shortcode: string;
  name: string | null;
  jmc: boolean;
  role: 'fresher' | 'parent';
  completedSurvey: boolean;
  gender: 'male' | 'female' | 'other' | 'n/a' | null;
  interests: Map<string, 0 | 1 | 2>[] | null;
  socials: string[] | null;
  aboutMe: string | null;
}

// Is it worth making a sharedTypes for this one singular type?
// Unsure if IStudent would be able to go under that as it's a z.infer
export const stateOptions = [
  'parents_open',
  'parents_close',
  'freshers_open',
  'closed'
] as const;
export type State = (typeof stateOptions)[number];
