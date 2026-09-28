declare interface IStudent {
  shortcode: string;
  name: string | null;
  jmc: boolean;
  role: 'fresher' | 'parent';
  completedSurvey: boolean;
  gender: 'male' | 'female' | 'other' | 'n/a' | null;
  interests: Record<string, 0 | 1 | 2> | null;
  socials: string[] | null;
  aboutMe: string | null;
  // Every survey answer, keyed as in hono/survey/mads.json.
  answers: Record<string, string | string[]> | null;
}

// Is it worth making a sharedTypes for this one singular type?
// Unsure if IStudent would be able to go under that as it's a z.infer
declare const stateOptions = ['open', 'closed'] as const;
declare type State = (typeof stateOptions)[number];

declare type IFamily = {
  id: number;
  parents: IStudent[];
  kids: IStudent[];
};
