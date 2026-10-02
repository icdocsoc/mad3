<script setup lang="ts">
const route = useRoute();
const { currentUser, setUser } = useAuth();

// Only ever somewhere on this site, so a crafted link can't send anyone away.
const next = computed(() => {
  const to = route.query.next;
  return typeof to == 'string' && to.startsWith('/') && !to.startsWith('//')
    ? to
    : '/portal';
});
const fromOldLink = route.query.from == 'link';

if (currentUser.value) {
  await navigateTo(next.value);
}

const step = ref<'email' | 'code'>('email');
const shortcode = ref('');
// People paste their whole address as often as they type the shortcode, so both work. Any other
// address is sent as typed, for the server to explain what to use instead.
const email = computed(() => {
  const typed = shortcode.value.trim().toLowerCase();
  if (!typed.includes('@')) return `${typed}@ic.ac.uk`;
  return typed;
});
const code = ref('');
const error = ref('');
const busy = ref(false);

const resendIn = ref(0);
let countdown: ReturnType<typeof setInterval> | undefined;
function startCountdown() {
  resendIn.value = 60;
  clearInterval(countdown);
  countdown = setInterval(() => {
    resendIn.value -= 1;
    if (resendIn.value <= 0) clearInterval(countdown);
  }, 1000);
}
onBeforeUnmount(() => clearInterval(countdown));

const messageOf = (err: unknown) =>
  (err as { data?: { error?: string } }).data?.error ??
  'Something went wrong. Please try again.';

async function sendCode() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value }
    });
    step.value = 'code';
    code.value = '';
    startCountdown();
  } catch (err) {
    error.value = messageOf(err);
  } finally {
    busy.value = false;
  }
}

async function logIn() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await $fetch('/api/auth/verify', {
      method: 'POST',
      body: { email: email.value, code: code.value }
    });
    setUser(await $fetch<IStudent>('/api/family/me'));
    await navigateTo(next.value);
  } catch (err) {
    error.value = messageOf(err);
  } finally {
    busy.value = false;
  }
}

function changeEmail() {
  step.value = 'email';
  error.value = '';
}
</script>

<template>
  <Card>
    <CardTitle>Log in</CardTitle>

    <form
      v-if="step == 'email'"
      class="mt-4 flex flex-col gap-3"
      @submit.prevent="sendCode">
      <CardText v-if="fromOldLink" class="rounded bg-blue-50 p-3">
        Sign-in links have been replaced by codes. Enter your shortcode and
        we'll send you one.
      </CardText>
      <label for="shortcode" class="font-bold">Your shortcode</label>
      <div
        class="flex items-center rounded border border-gray-500 focus-within:ring-2 focus-within:ring-primary">
        <input
          id="shortcode"
          v-model="shortcode"
          type="text"
          autocomplete="username"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          required
          placeholder="ab1224"
          class="w-full rounded border-0 focus:ring-0" />
        <span v-if="!shortcode.includes('@')" class="pr-3 text-gray-500">
          @ic.ac.uk
        </span>
      </div>
      <p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
      <button
        type="submit"
        :disabled="busy"
        class="rounded bg-primary px-4 py-2 font-bold text-white disabled:opacity-60">
        {{ busy ? 'Sending…' : 'Email me a code' }}
      </button>
    </form>

    <form v-else class="mt-4 flex flex-col gap-3" @submit.prevent="logIn">
      <CardText>
        Check your inbox for a six-digit code, sent to
        <strong>{{ email }}</strong>
      </CardText>
      <CardText>
        It works for 10 minutes. Enter it here, on this device.
      </CardText>
      <label for="code" class="font-bold">Code</label>
      <input
        id="code"
        v-model="code"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="7"
        required
        placeholder="123456"
        class="rounded text-center text-2xl tracking-widest" />
      <p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
      <button
        type="submit"
        :disabled="busy"
        class="rounded bg-primary px-4 py-2 font-bold text-white disabled:opacity-60">
        {{ busy ? 'Checking…' : 'Log in' }}
      </button>
      <div class="flex flex-wrap justify-between gap-2 text-sm">
        <button
          type="button"
          class="text-link hover:text-linkHover disabled:text-gray-500"
          :disabled="resendIn > 0 || busy"
          @click="sendCode">
          {{
            resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'
          }}
        </button>
        <button
          type="button"
          class="text-link hover:text-linkHover"
          @click="changeEmail">
          Use a different email
        </button>
      </div>
      <p class="text-sm text-gray-600" data-testid="code-help">
        Code hasn't arrived? Check your Junk folder, or email
        <a href="mailto:tech@docsoc.co.uk">tech@docsoc.co.uk</a>
        with your shortcode and we'll help.
      </p>
    </form>
  </Card>
</template>
