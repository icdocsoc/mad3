import { string, type z } from 'zod';
import type { selectStudentSchema } from './family/schema';

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

export const studentRoles = ['fresher', 'parent'] as const;
export const genderOptions = ['male', 'female', 'other', 'n/a'] as const;
export type Gender = (typeof genderOptions)[number];

export type UserRole = 'parent' | 'fresher';
export type AuthRoles =
  | 'parent'
  | 'fresher'
  | 'authenticated'
  | 'all'
  | 'unauthenticated'
  | 'admin';

export type Env = {
  Variables: {
    shortcode: string | null;
    user_is: UserRole | null;
  };
};

export type Student = z.infer<typeof selectStudentSchema>;

export const stateOptions = [
  'parents_open',
  'parents_close',
  'freshers_open',
  'closed'
] as const;
export type State = (typeof stateOptions)[number];

export type AllocatorGender = 'Female' | 'Male' | 'other' | 'na'

export type AllocatorStudent = {
  firstName: string,
  lastName: string,
  preferredName: string,
  gender: AllocatorGender,
  shortcode: string,
  course: string,
  socialMedia: string[]
}

export type AllocatorFresher = {
  _id: string,
  student: AllocatorStudent
  interests: Interests
  family: number | undefined
}

export type AllocatorParent = {
  _id: string,
  student: AllocatorStudent,
  interests: Interests,
  family: number
}

export type AllocatorFamily = {
  _id: number,
  parents: {
    proposerId: AllocatorParent
    proposeeId: AllocatorParent
  }
  kids: AllocatorFresher[]
  hasFemale: boolean,
  hasJmc: boolean
}

