import { type Interests, interestKeys } from './types';

/**
 * The Mums and Dads survey, as asked: every card, question and answer, with the values stored.
 * Both the survey page and the server's validation read it, so they cannot disagree. Freshers
 * and parents answer the same questions, so the allocator can compare them.
 *
 * The allocator (allocations/) is untouched mad2 Python. It reads `interests` as 27 scores in
 * `interestKeys` order, so this survey still produces exactly that: the chips cover 25 of the
 * keys, and `alcohol` and `clubbing` are worked out from the pub and late-night answers.
 */

export const courseOptions = [
  { value: 'computing', label: 'Computing' },
  { value: 'jmc', label: 'Joint Maths and Computing' }
] as const;

export const commuteOptions = [
  { value: 'halls', label: 'Minutes from campus' },
  { value: 'nearby', label: 'Half an hour commute' },
  { value: 'commute', label: 'Maybe an hour away' },
  { value: 'far', label: 'Very far!' }
] as const;

// Stored in the existing gender enum; "I am..." is `other` with the words kept alongside.
export const genderSurveyOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'I am...', free: true },
  { value: 'n/a', label: 'Rather not say' }
] as const;

export const drinkingOptions = [
  { value: 'round-buyer', label: "Yippee! I'll get the first round." },
  { value: 'soft-drink', label: "I'll come, but no alcohol." },
  { value: 'couple', label: "I'll come for a few rounds - it depends." },
  { value: 'rather-not', label: "I'd rather not." }
] as const;

export const lateNightsOptions = [
  { value: 'out-till-late', label: "Let's party 'til morning!" },
  { value: 'one-club-night', label: "I'll tag along to some afterparties~" },
  { value: 'home-by-midnight', label: "Aight I'm going home!" },
  { value: 'quiet', label: "I'd rather something else." }
] as const;

export const societiesOptions = [
  { value: 'everything', label: 'Sign me up to everything!' },
  { value: 'few', label: 'A few I care about' },
  { value: 'unsure', label: 'No clue yet' },
  { value: 'little', label: 'Not really my thing' }
] as const;

export const meetingPeopleOptions = [
  { value: 'energising', label: "It's the best part!" },
  { value: 'fine', label: "I'm fine once I'm there" },
  { value: 'depends', label: 'It depends' },
  { value: 'draining', label: 'I find it draining' }
] as const;

type Values<T extends readonly { value: string }[]> = T[number]['value'];
export type Commute = Values<typeof commuteOptions>;
export type Drinking = Values<typeof drinkingOptions>;
export type LateNights = Values<typeof lateNightsOptions>;
export type Societies = Values<typeof societiesOptions>;
export type MeetingPeople = Values<typeof meetingPeopleOptions>;

export const valuesOf = <T extends readonly { value: string }[]>(options: T) =>
  options.map(option => option.value) as [Values<T>, ...Values<T>[]];

/** The interests asked as chips, grouped the way the survey shows them. */
export const interestGroups = [
  {
    label: 'Sport',
    options: [
      { key: 'football', label: 'Football' },
      { key: 'rugby', label: 'Rugby' },
      { key: 'rowing', label: 'Rowing' },
      { key: 'racketSports', label: 'Tennis, Badminton, Squash' },
      { key: 'martialArts', label: 'Martial Arts' },
      { key: 'exerciseAndHealth', label: 'Gym and Fitness' },
      { key: 'otherSports', label: 'Something Else' }
    ]
  },
  {
    label: 'Screens and Games',
    options: [
      { key: 'videoGames', label: 'Video Games' },
      { key: 'tabletopGames', label: 'Board Games' },
      { key: 'film', label: 'Films' },
      { key: 'anime', label: 'Anime' },
      { key: 'kpop', label: 'K-Pop' }
    ]
  },
  {
    label: 'Making Things',
    options: [
      { key: 'artGraphics', label: 'Arts and Crafts' },
      { key: 'photography', label: 'Photography' },
      { key: 'baking', label: 'Baking' },
      { key: 'cooking', label: 'Cooking' }
    ]
  },
  {
    label: 'Out and About',
    options: [{ key: 'hiking', label: 'Hiking' }]
  },
  {
    label: 'Performing',
    options: [
      { key: 'dramatics', label: 'Drama and Musical Theatre' },
      { key: 'danceBallroom', label: 'Salsa, Ballroom and partner dance' },
      { key: 'danceContemporary', label: 'Hip-hop and Contemporary Dance' },
      { key: 'performingMusicPopRockJazz', label: 'Playing in a Band' },
      { key: 'performingMusicClassical', label: 'Orchestra and Chamber Music' }
    ]
  },
  {
    label: 'People and Ideas',
    options: [
      { key: 'politics', label: 'Politics' },
      { key: 'charity', label: 'Charity and Volunteering' },
      { key: 'finance', label: 'Finance and Startups' }
    ]
  }
] as const;

export type ChipKey = (typeof interestGroups)[number]['options'][number]['key'];
export const chipKeys = interestGroups.flatMap(group =>
  group.options.map(option => option.key)
) as ChipKey[];

/** Labels for every interest, including the two worked out from other answers. */
export const interestLabels: Record<(typeof interestKeys)[number], string> = {
  ...(Object.fromEntries(
    interestGroups.flatMap(group =>
      group.options.map(option => [option.key, option.label])
    )
  ) as Record<ChipKey, string>),
  alcohol: 'Pubs and Bars',
  clubbing: 'Clubbing'
};

const alcoholFrom: Record<Drinking, 0 | 1 | 2> = {
  'round-buyer': 2,
  couple: 1,
  'soft-drink': 0,
  'rather-not': 0
};

const clubbingFrom: Record<LateNights, 0 | 1 | 2> = {
  'out-till-late': 2,
  'one-club-night': 1,
  'home-by-midnight': 0,
  quiet: 0
};

/** The 27 scores the allocator reads, in its order, from what the survey asked. */
export function allocatorInterests(
  chips: Record<ChipKey, 0 | 1 | 2>,
  drinking: Drinking,
  lateNights: LateNights
): Interests {
  const scores: Record<string, 0 | 1 | 2> = {
    ...chips,
    alcohol: alcoholFrom[drinking],
    clubbing: clubbingFrom[lateNights]
  };
  return Object.fromEntries(
    interestKeys.map(key => [key, scores[key] ?? 0])
  ) as Interests;
}

/** What each card of the survey says. The questions on them are laid out in the page. */
export const surveyCards = {
  you: {
    title: 'Hello my name is...',
    blurb:
      'We use this to introduce you to your family. Nothing here is shared with others.'
  },
  why: {
    title: 'How this works',
    body: [
      "Your answers go into a deterministic matchmaking algorithm, which puts you in a family with two older students as your parents and a few other freshers as siblings. That's all your answers are used for.",
      "Once you're matched, your profile is shared with your parents."
    ]
  },
  commute: {
    title: 'During term I live...',
    blurb: 'So we understand how easy it is for you to get to campus.'
  },
  gender: { title: 'I identify as a...' },
  drinking: { title: 'Your family is going pubbing.' },
  lateNights: { title: 'And afterwards...' },
  interests: {
    title: "I'm into...",
    blurb: 'Mash them buttons; pick anything that sounds fun!'
  },
  societies: {
    title: 'As for societies...',
    blurb: "Go to the Freshers' Fair!"
  },
  meetingPeople: { title: 'When I meet strangers…' },
  intro: {
    title: 'Hello there...',
    blurb: 'Shared with your family once you are matched, and nobody else.'
  }
} as const;
