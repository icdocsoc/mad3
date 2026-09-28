<script setup lang="ts">
import {
  type ChipKey,
  chipKeys,
  commuteOptions,
  courseOptions,
  drinkingOptions,
  genderSurveyOptions,
  lateNightsOptions,
  meetingPeopleOptions,
  societiesOptions,
  surveyCards
} from '~~/hono/survey';

definePageMeta({
  middleware: ['require-auth']
});

const { currentUser, setUser } = useAuth();
const { currentState } = useAppState();
const me = currentUser.value!;

const CARDS = [
  'you',
  'why',
  'commute',
  'gender',
  'drinking',
  'lateNights',
  'interests',
  'societies',
  'meetingPeople',
  'intro'
] as const;
type CardId = (typeof CARDS)[number];

// Start from whatever was saved before, so coming back to edit keeps every answer.
const answers = reactive({
  name: me.name ?? '',
  preferredName: me.preferredName ?? '',
  course: me.completedSurvey ? (me.jmc ? 'jmc' : 'computing') : null,
  commute: me.commute,
  gender: me.gender,
  genderDescription: me.genderDescription ?? '',
  drinking: me.drinking,
  lateNights: me.lateNights,
  interests: Object.fromEntries(
    chipKeys.map(key => [key, me.interests?.[key] ?? 0])
  ) as Record<ChipKey, 0 | 1 | 2>,
  societies: me.societies,
  meetingPeople: me.meetingPeople,
  aboutMe: me.aboutMe ?? '',
  instagram: me.instagram ?? '',
  discord: me.discord ?? '',
  phone: me.phone ?? ''
});

const editing = ref(!me.completedSurvey);
const step = ref(0);
const card = computed<CardId>(() => CARDS[step.value]!);
const blurb = computed(
  () => (surveyCards[card.value] as { blurb?: string }).blurb
);
const problem = ref('');
const saving = ref(false);

/** Why a card can't be left yet, or nothing if it can. */
function missingOn(id: CardId): string {
  const need = 'Choose an answer to carry on.';
  switch (id) {
    case 'you':
      if (!answers.name.trim()) return 'Tell us your full name.';
      return answers.course ? '' : 'Choose your course.';
    case 'commute':
      return answers.commute ? '' : need;
    case 'drinking':
      return answers.drinking ? '' : need;
    case 'lateNights':
      return answers.lateNights ? '' : need;
    case 'interests':
      return Object.values(answers.interests).some(score => score > 0)
        ? ''
        : 'Pick at least one interest.';
    case 'societies':
      return answers.societies ? '' : need;
    case 'meetingPeople':
      return answers.meetingPeople ? '' : need;
    default:
      return '';
  }
}

function next() {
  problem.value = missingOn(card.value);
  if (!problem.value) step.value += 1;
}

function back() {
  problem.value = '';
  step.value -= 1;
}

async function submit() {
  problem.value = missingOn(card.value);
  if (problem.value || saving.value) return;
  saving.value = true;
  try {
    await $fetch('/api/family/survey', {
      method: 'POST',
      body: {
        ...answers,
        course: undefined,
        jmc: answers.course == 'jmc',
        gender: answers.gender ?? null
      }
    });
    setUser(await $fetch<IStudent>('/api/family/me'));
    editing.value = false;
    step.value = 0;
  } catch (err) {
    problem.value =
      (err as { data?: { error?: string } }).data?.error ??
      "We couldn't save your answers. Please try again.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Card v-if="currentState != 'open'">
    <CardTitle>Sign-ups are closed</CardTitle>
    <CardText class="mt-4 text-center">
      The survey isn't taking answers right now.
      <NuxtLink to="/portal">Back to the portal</NuxtLink>
    </CardText>
  </Card>

  <Card v-else-if="!editing">
    <CardTitle>
      {{ currentUser!.role == 'fresher' ? "You're in!" : 'Survey done' }}
    </CardTitle>
    <CardText class="mt-4">
      {{
        currentUser!.role == 'fresher'
          ? "We'll email you once families are allocated."
          : 'Next, find your partner: you become parents together.'
      }}
      You can change your answers until sign-ups close.
    </CardText>
    <div class="flex flex-wrap gap-3">
      <NuxtLink
        v-if="currentUser!.role == 'parent'"
        to="/proposals"
        class="rounded bg-primary px-4 py-2 font-bold text-white hover:text-white hover:no-underline">
        Find your partner
      </NuxtLink>
      <button
        type="button"
        class="rounded border-2 border-primary px-4 py-2 font-bold text-primary"
        @click="editing = true">
        Change my answers
      </button>
    </div>
  </Card>

  <Card v-else>
    <div class="mb-4">
      <p class="text-sm text-gray-600">{{ step + 1 }} of {{ CARDS.length }}</p>
      <div class="mt-1 h-2 rounded-full bg-gray-200">
        <div
          class="h-2 rounded-full bg-primary transition-all"
          :style="{ width: `${((step + 1) / CARDS.length) * 100}%` }" />
      </div>
    </div>

    <form
      class="flex flex-col gap-4"
      @submit.prevent="step == CARDS.length - 1 ? submit() : next()">
      <h2 class="text-2xl font-medium">{{ surveyCards[card].title }}</h2>
      <p v-if="blurb" class="text-gray-600">{{ blurb }}</p>

      <template v-if="card == 'you'">
        <label class="flex flex-col gap-1">
          <span class="font-bold">Full name</span>
          <input
            v-model="answers.name"
            type="text"
            autocomplete="name"
            placeholder="Nicolas Wu"
            class="rounded" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-bold">Preferred name (optional)</span>
          <input
            v-model="answers.preferredName"
            type="text"
            placeholder="Nick"
            class="rounded" />
        </label>
        <div class="flex flex-col gap-1">
          <span class="font-bold">Course</span>
          <span class="text-sm text-gray-600">
            Computing and JMC timetables clash.
          </span>
          <SurveyChoiceList
            v-model="answers.course"
            name="course"
            :options="courseOptions" />
        </div>
      </template>

      <template v-else-if="card == 'why'">
        <p v-for="line in surveyCards.why.body" :key="line">{{ line }}</p>
      </template>

      <SurveyChoiceList
        v-else-if="card == 'commute'"
        v-model="answers.commute"
        name="commute"
        :options="commuteOptions" />

      <template v-else-if="card == 'gender'">
        <p class="text-sm text-gray-600">Optional.</p>
        <SurveyChoiceList
          v-model="answers.gender"
          v-model:free="answers.genderDescription"
          name="gender"
          :options="genderSurveyOptions" />
      </template>

      <SurveyChoiceList
        v-else-if="card == 'drinking'"
        v-model="answers.drinking"
        name="drinking"
        :options="drinkingOptions" />

      <SurveyChoiceList
        v-else-if="card == 'lateNights'"
        v-model="answers.lateNights"
        name="lateNights"
        :options="lateNightsOptions" />

      <SurveyInterestChips
        v-else-if="card == 'interests'"
        v-model="answers.interests" />

      <SurveyChoiceList
        v-else-if="card == 'societies'"
        v-model="answers.societies"
        name="societies"
        :options="societiesOptions" />

      <SurveyChoiceList
        v-else-if="card == 'meetingPeople'"
        v-model="answers.meetingPeople"
        name="meetingPeople"
        :options="meetingPeopleOptions" />

      <template v-else-if="card == 'intro'">
        <p class="text-sm text-gray-600">All optional.</p>
        <label class="flex flex-col gap-1">
          <span class="font-bold">A bit about me</span>
          <textarea
            v-model="answers.aboutMe"
            rows="4"
            maxlength="1000"
            placeholder="A couple of lines. What you are into, where you are from, anything you want them to know."
            class="rounded" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-bold">Instagram</span>
          <div class="flex items-center rounded border border-gray-500">
            <span class="pl-3 text-gray-500">@</span>
            <input
              v-model="answers.instagram"
              type="text"
              autocapitalize="none"
              placeholder="handle"
              class="w-full rounded border-0" />
          </div>
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-bold">Discord</span>
          <input
            v-model="answers.discord"
            type="text"
            autocapitalize="none"
            placeholder="username"
            class="rounded" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-bold">Phone</span>
          <span class="text-sm text-gray-600">
            A WhatsApp number is ideal, since that is where most families end up
            talking. Any number is fine.
          </span>
          <input
            v-model="answers.phone"
            type="tel"
            autocomplete="tel"
            class="rounded" />
        </label>
      </template>

      <p v-if="problem" role="alert" class="text-red-600">{{ problem }}</p>

      <div class="flex justify-between gap-3">
        <button
          type="button"
          class="rounded px-4 py-2 font-bold text-primary disabled:invisible"
          :disabled="step == 0"
          @click="back">
          Back
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="rounded bg-primary px-6 py-2 font-bold text-white disabled:opacity-60">
          {{
            step < CARDS.length - 1
              ? 'Continue'
              : saving
                ? 'Saving…'
                : me.completedSurvey
                  ? 'Save my answers'
                  : 'Submit'
          }}
        </button>
      </div>
    </form>
  </Card>
</template>
