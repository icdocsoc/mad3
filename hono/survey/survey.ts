import { parsePhoneNumber } from 'awesome-phonenumber';
import mads from './mads.json';

/**
 * The Mums and Dads survey, read from `mads.json`: a copy of the survey in DoCSoc's new web
 * monorepo (icdocsoc/experimental, packages/domain/src/survey/schemas/mads.json), which MaDs
 * is moving onto. Change the wording there and copy the file here, so the two never drift.
 *
 * Answers are stored the way that monorepo stores them, so moving them across is a copy: one
 * object keyed by field, where a choice is its option's value (or, for a free option like
 * "I am...", the words typed), chips are a list of values, and a phone is E.164. Freshers and
 * parents answer the same questions.
 */

export type Option = { value: string; label: string; free?: true };

export type Field =
  | { kind: 'note'; label: string; body: string }
  | {
      kind: 'text' | 'prose' | 'phone';
      label: string;
      hint?: string;
      optional?: true;
      prefix?: string;
    }
  | {
      kind: 'choice';
      label: string;
      hint?: string;
      optional?: true;
      options: Option[];
    }
  | {
      kind: 'chips';
      label: string;
      hint?: string;
      optional?: true;
      groups: { label: string; options: Option[] }[];
    };

export type Stage = {
  id: string;
  title: string;
  blurb?: string;
  fields: Record<string, Field>;
};

export type Answers = Record<string, string | string[]>;

export const survey = mads as unknown as {
  title: string;
  version: number;
  closed?: { title: string; body: string };
  stages: Stage[];
};

/** Every question by the key its answer is stored under. */
export const fields: Record<string, Field> = Object.fromEntries(
  survey.stages.flatMap(stage => Object.entries(stage.fields))
);

/** Which version of the survey answers were given to, stored with them on submission. */
export const SURVEY_VERSION = survey.version;

/** The shortcode is known from sign-in, so it is filled in for everyone and can't be changed. */
export const LOCKED = 'shortcode';

const E164 = /^\+[1-9]\d{6,14}$/;

/** Whether a question has an answer, by the same rules as the monorepo's survey engine. */
export function answered(field: Field, value: unknown) {
  if (field.kind == 'note') return true;
  if (field.kind == 'chips') return Array.isArray(value) && value.length > 0;
  if (field.kind == 'phone')
    return typeof value == 'string' && E164.test(value);
  return typeof value == 'string' && value.trim() != '';
}

/** The required questions on a stage that still have no answer. */
export const missingOn = (stage: Stage, answers: Answers) =>
  Object.entries(stage.fields)
    .filter(([_key, field]) => !('optional' in field && field.optional))
    .filter(([key, field]) => !answered(field, answers[key]))
    .map(([key]) => key);

/** A typed phone number in E.164, or null if it isn't a real number. */
export function toE164(typed: string, region = 'GB'): string | null {
  const parsed = parsePhoneNumber(typed.trim(), { regionCode: region });
  return parsed.valid ? parsed.number.e164 : null;
}

const MAX_LENGTH = { text: 200, prose: 1000, choice: 100 } as const;

/** One answer as sent, made safe to store, or undefined if it isn't a valid answer. */
function clean(field: Field, value: unknown): string | string[] | undefined {
  switch (field.kind) {
    case 'note':
      return undefined;
    case 'text':
    case 'prose': {
      if (typeof value != 'string') return undefined;
      const text = value.trim().slice(0, MAX_LENGTH[field.kind]);
      // The box already shows the prefix (the @ on a handle), so people often type it too.
      return field.prefix && text.startsWith(field.prefix)
        ? text.slice(field.prefix.length)
        : text;
    }
    case 'phone':
      return typeof value == 'string'
        ? (toE164(value) ?? undefined)
        : undefined;
    case 'choice': {
      if (typeof value != 'string') return undefined;
      if (field.options.some(option => option.value == value && !option.free))
        return value;
      // A free option keeps the question to one value: the words typed.
      const typed = value.trim().slice(0, MAX_LENGTH.choice);
      return field.options.some(option => option.free) && typed
        ? typed
        : undefined;
    }
    case 'chips': {
      if (!Array.isArray(value)) return undefined;
      const known = new Set(
        field.groups.flatMap(group => group.options.map(option => option.value))
      );
      return [...new Set(value)].filter(
        (chip): chip is string => typeof chip == 'string' && known.has(chip)
      );
    }
  }
}

/** Answers that must look a certain way, beyond being given at all. */
const FORMATS: Record<string, { pattern: RegExp; problem: string }> = {
  instagram: {
    pattern: /^[A-Za-z0-9._]{1,30}$/,
    problem:
      "That Instagram handle doesn't look right: it's letters, numbers, dots and underscores."
  }
};

/** What's wrong with how an answer was typed, if anything. Checked on the page and the server. */
export function formatProblem(key: string, value: unknown): string | undefined {
  if (typeof value != 'string' || !value.trim()) return undefined;
  const format = FORMATS[key];
  if (format && !format.pattern.test(value.trim().replace(/^@/, '')))
    return format.problem;
  if (fields[key]?.kind == 'phone' && !toE164(value))
    return "That phone number doesn't look right.";
  return undefined;
}

/**
 * Answers as sent by the survey page, checked against the survey: unknown questions and
 * invalid answers are dropped, the shortcode is the signed-in one, and every required
 * question must be answered. Returns the stage that needs attention if one isn't.
 */
export function readAnswers(
  sent: Record<string, unknown>,
  shortcode: string
): { ok: true; answers: Answers } | { ok: false; error: string } {
  for (const key of Object.keys(fields)) {
    const problem = formatProblem(key, sent[key]);
    if (problem) return { ok: false, error: problem };
  }

  const answers: Answers = {};
  for (const [key, field] of Object.entries(fields)) {
    const value = clean(field, key == LOCKED ? shortcode : sent[key]);
    if (
      value !== undefined &&
      value !== '' &&
      !(Array.isArray(value) && !value.length)
    )
      answers[key] = value;
  }

  const unanswered = survey.stages.find(
    stage => missingOn(stage, answers).length
  );
  if (unanswered) {
    return {
      ok: false,
      error: `Some answers are missing, starting with "${unanswered.title}".`
    };
  }
  return { ok: true, answers };
}

/**
 * A survey part-way through, kept so nothing typed is lost. Only its shape is checked (known
 * questions, strings and lists of strings, of sensible length); whether it is complete and
 * valid is checked when it is submitted, which is the only way into `answers`.
 */
export function readDraft(
  sent: Record<string, unknown>,
  shortcode: string
): Answers {
  const draft: Answers = { [LOCKED]: shortcode };
  for (const key of Object.keys(fields)) {
    const value = sent[key];
    if (key == LOCKED) continue;
    if (typeof value == 'string') draft[key] = value.slice(0, 1000);
    else if (Array.isArray(value))
      draft[key] = value
        .filter((item): item is string => typeof item == 'string')
        .slice(0, 100)
        .map(item => item.slice(0, 100));
  }
  return draft;
}

/**
 * The columns the rest of mad3 still reads (names on family pages and in the CSV, course and
 * gender for the admin page), filled from the answers.
 */
export function studentColumns(answers: Answers): {
  name: string | null;
  jmc: boolean;
  gender: 'male' | 'female' | 'other' | 'n/a' | null;
  aboutMe: string | null;
} {
  const gender = answers.gender;
  return {
    name: (answers.name as string | undefined) ?? null,
    jmc: answers.course == 'jmc',
    gender:
      gender == 'male' || gender == 'female'
        ? gender
        : gender == 'unsaid'
          ? ('n/a' as const)
          : gender
            ? ('other' as const)
            : null,
    aboutMe: (answers.bio as string | undefined) ?? null
  };
}

/** The label for a chip or choice value, for showing answers back. */
export function labelOf(key: string, value: string) {
  const field = fields[key];
  if (field?.kind == 'choice')
    return field.options.find(option => option.value == value)?.label ?? value;
  if (field?.kind == 'chips')
    return (
      field.groups
        .flatMap(group => group.options)
        .find(option => option.value == value)?.label ?? value
    );
  return value;
}
