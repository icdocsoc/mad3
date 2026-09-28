<script setup lang="ts">
import {
  type Answers,
  type Field,
  formatProblem,
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

// A copy of the answers in this browser, so nothing typed is lost to a closed tab, a dropped
// connection or an expired sign-in. Cleared once the survey is submitted.
const DEVICE_KEY = `mads-survey:${me.shortcode}`;
function fromDevice(): Answers | null {
  try {
    const kept = localStorage.getItem(DEVICE_KEY);
    return kept ? (JSON.parse(kept) as Answers) : null;
  } catch {
    return null;
  }
}
function toDevice(value: Answers | null) {
  try {
    if (value) localStorage.setItem(DEVICE_KEY, JSON.stringify(value));
    else localStorage.removeItem(DEVICE_KEY);
  } catch {
    // Private browsing or full storage: the server's copy is still there.
  }
}

// Start from the newest copy of what was typed: this browser's, the server's draft, then the
// last submission. The shortcode is always the signed-in one.
const answers = reactive<Answers>({
  ...(me.draft ?? me.answers ?? {}),
  [LOCKED]: me.shortcode
});
onMounted(() => {
  const kept = fromDevice();
  if (kept) Object.assign(answers, kept, { [LOCKED]: me.shortcode });
});

const stages = survey.stages;
const editing = ref(!me.completedSurvey);
const step = ref(0);
const stage = computed(() => stages[step.value]!);
const last = computed(() => step.value == stages.length - 1);
const problem = ref('');
const saving = ref(false);

/**
 * Where the answers on screen have got to: saved to the server, on their way, or kept only in
 * this browser because the server can't take them right now.
 */
type SaveState = 'saved' | 'saving' | 'offline' | 'signed-out' | 'closed';
const saveState = ref<SaveState>('saved');

const statusOf = (err: unknown) =>
  (err as { statusCode?: number; status?: number }).statusCode ??
  (err as { status?: number }).status;

let timer: ReturnType<typeof setTimeout> | undefined;
let retry: ReturnType<typeof setTimeout> | undefined;

async function saveDraft() {
  clearTimeout(timer);
  clearTimeout(retry);
  saveState.value = 'saving';
  try {
    await $fetch('/api/family/draft', {
      method: 'POST',
      body: { answers: { ...answers } }
    });
    saveState.value = 'saved';
  } catch (err) {
    const status = statusOf(err);
    if (status == 401) saveState.value = 'signed-out';
    else if (status == 403) saveState.value = 'closed';
    else {
      saveState.value = 'offline';
      retry = setTimeout(saveDraft, 5000);
    }
  }
}

// Every change is kept in this browser at once, and sent to the server once typing pauses.
watch(
  answers,
  () => {
    if (!editing.value) return;
    toDevice({ ...answers });
    saveState.value = 'saving';
    clearTimeout(timer);
    timer = setTimeout(saveDraft, 800);
  },
  { deep: true }
);
onBeforeUnmount(() => {
  clearTimeout(timer);
  clearTimeout(retry);
});

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
  for (const key of Object.keys(stage.value.fields)) {
    const wrong = formatProblem(key, answers[key]);
    if (wrong) return wrong;
  }
  const [first] = missingOn(stage.value, answers);
  if (!first) return '';
  const field = stage.value.fields[first]!;
  if (field.kind == 'chips') return 'Pick at least one to carry on.';
  return `Answer "${field.label}" to carry on.`;
}

function next() {
  problem.value = problemOnThisCard();
  if (problem.value) return;
  step.value += 1;
  void saveDraft();
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
    toDevice(null);
    clearTimeout(timer);
    saveState.value = 'saved';
    setUser(await $fetch<IStudent>('/api/family/me'));
    editing.value = false;
    step.value = 0;
  } catch (err) {
    const status = statusOf(err);
    if (status == 401) saveState.value = 'signed-out';
    problem.value =
      status == 401
        ? ''
        : ((err as { data?: { error?: string } }).data?.error ??
          "We couldn't save your answers. Please try again.");
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

    <p
      v-if="saveState == 'signed-out'"
      role="alert"
      class="mb-4 rounded bg-amber-50 p-3">
      You've been logged out, but your answers are kept on this device.
      <NuxtLink to="/login?next=/survey">Log in again</NuxtLink>
      to carry on where you left off.
    </p>
    <p
      v-else-if="saveState == 'closed'"
      role="alert"
      class="mb-4 rounded bg-amber-50 p-3">
      Sign-ups have just closed, so these answers can't be saved.
    </p>
    <p
      v-else
      class="mb-4 text-sm"
      :class="saveState == 'offline' ? 'text-amber-700' : 'text-gray-600'"
      data-testid="save-state">
      {{
        saveState == 'saved'
          ? '✓ Your answers are saved'
          : saveState == 'saving'
            ? 'Saving…'
            : "Can't reach the server: kept on this device, retrying"
      }}
    </p>

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
