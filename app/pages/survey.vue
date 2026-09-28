<script setup lang="ts">
import {
  type Answers,
  type Field,
  LOCKED,
  missingOn,
  survey
} from '~~/hono/survey/survey';

definePageMeta({
  middleware: ['require-auth']
});

const { currentUser, setUser } = useAuth();
const { currentState } = useAppState();
const me = currentUser.value!;

// Start from whatever was saved before, so coming back to edit keeps every answer. The
// shortcode is always the signed-in one.
const answers = reactive<Answers>({
  ...(me.answers ?? {}),
  [LOCKED]: me.shortcode
});

const stages = survey.stages;
const editing = ref(!me.completedSurvey);
const step = ref(0);
const stage = computed(() => stages[step.value]!);
const last = computed(() => step.value == stages.length - 1);
const problem = ref('');
const saving = ref(false);

/** A question's label, unless the card's title already says it. */
const labelFor = (field: Field) =>
  field.label == stage.value.title ? '' : field.label;
/** A question's hint, unless the card's blurb already says it. */
const hintFor = (field: Field) =>
  'hint' in field && field.hint != stage.value.blurb ? field.hint : undefined;
const isOptional = (field: Field) =>
  'optional' in field && field.optional == true;
const textOf = (key: string) => answers[key] as string | undefined;
const setText = (key: string, value: string | undefined) => {
  if (value === undefined || value === '') delete answers[key];
  else answers[key] = value;
};
const chipsOf = (key: string) => (answers[key] as string[] | undefined) ?? [];

/** Why this card can't be left yet, or nothing if it can. */
function problemOnThisCard() {
  const [first] = missingOn(stage.value, answers);
  if (!first) return '';
  const field = stage.value.fields[first]!;
  if (field.kind == 'phone' && textOf(first))
    return "That phone number doesn't look right.";
  if (field.kind == 'chips') return 'Pick at least one to carry on.';
  return `Answer "${field.label}" to carry on.`;
}

function next() {
  problem.value = problemOnThisCard();
  if (!problem.value) step.value += 1;
}

function back() {
  problem.value = '';
  step.value -= 1;
}

async function submit() {
  problem.value = problemOnThisCard();
  if (problem.value || saving.value) return;
  saving.value = true;
  try {
    await $fetch('/api/family/survey', {
      method: 'POST',
      body: { answers: { ...answers } }
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
      <p class="text-sm text-gray-600">{{ step + 1 }} of {{ stages.length }}</p>
      <div class="mt-1 h-2 rounded-full bg-gray-200">
        <div
          class="h-2 rounded-full bg-primary transition-all"
          :style="{ width: `${((step + 1) / stages.length) * 100}%` }" />
      </div>
    </div>

    <form
      class="flex flex-col gap-4"
      @submit.prevent="last ? submit() : next()">
      <h2 class="text-2xl font-medium">{{ stage.title }}</h2>
      <p v-if="stage.blurb" class="text-gray-600">{{ stage.blurb }}</p>

      <div
        v-for="(field, key) in stage.fields"
        :key="key"
        class="flex flex-col gap-1">
        <template v-if="field.kind == 'note'">
          <p v-for="line in field.body.split('\n')" :key="line">{{ line }}</p>
        </template>

        <template v-else>
          <label
            v-if="labelFor(field)"
            :for="`answer-${key}`"
            class="font-bold">
            {{ labelFor(field) }}
            <span v-if="isOptional(field)" class="font-normal text-gray-600">
              (optional)
            </span>
          </label>
          <span
            v-if="
              hintFor(field) && field.kind != 'text' && field.kind != 'prose'
            "
            class="text-sm text-gray-600">
            {{ hintFor(field) }}
          </span>

          <input
            v-if="key == LOCKED"
            :id="`answer-${key}`"
            :value="answers[key]"
            type="text"
            readonly
            class="rounded bg-gray-100 text-gray-700" />

          <div
            v-else-if="field.kind == 'text' && field.prefix"
            class="flex items-center rounded border border-gray-500">
            <span class="pl-3 text-gray-500">{{ field.prefix }}</span>
            <input
              :id="`answer-${key}`"
              :value="textOf(key)"
              type="text"
              autocapitalize="none"
              :placeholder="hintFor(field)"
              class="w-full rounded border-0"
              @input="
                setText(key, ($event.target as HTMLInputElement).value)
              " />
          </div>

          <input
            v-else-if="field.kind == 'text'"
            :id="`answer-${key}`"
            :value="textOf(key)"
            type="text"
            :placeholder="hintFor(field)"
            class="rounded"
            @input="setText(key, ($event.target as HTMLInputElement).value)" />

          <textarea
            v-else-if="field.kind == 'prose'"
            :id="`answer-${key}`"
            :value="textOf(key)"
            rows="4"
            maxlength="1000"
            :placeholder="hintFor(field)"
            class="rounded"
            @input="
              setText(key, ($event.target as HTMLTextAreaElement).value)
            " />

          <SurveyPhoneInput
            v-else-if="field.kind == 'phone'"
            :id="`answer-${key}`"
            :model-value="textOf(key)"
            @update:model-value="setText(key, $event)" />

          <SurveyChoiceList
            v-else-if="field.kind == 'choice'"
            :name="key"
            :options="field.options"
            :model-value="textOf(key)"
            @update:model-value="setText(key, $event)" />

          <SurveyChips
            v-else-if="field.kind == 'chips'"
            :groups="field.groups"
            :model-value="chipsOf(key)"
            @update:model-value="answers[key] = $event" />
        </template>
      </div>

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
            !last
              ? 'Continue'
              : saving
                ? 'Saving…'
                : currentUser!.completedSurvey
                  ? 'Save my answers'
                  : 'Submit'
          }}
        </button>
      </div>
    </form>
  </Card>
</template>
