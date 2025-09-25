<template>
  <div>
    <div @click="focus = !focus">
      <slot />
    </div>
    <div v-if="focus" class="absolute -ml-52 mt-2 flex items-center justify-center">
      <div class="rounded-lg bg-white p-6 shadow-lg">
        <h2 class="mb-4 text-lg font-bold">Enter your shortcode email</h2>
        <input @keyup.enter="sendLoginEmail" :pattern="shortcodeEmailRegex.source" v-model="email" type="email"
          placeholder="xx0000@ic.ac.uk" class="mb-4 w-full rounded border p-2 invalid:border-red-500" />
        <div class="flex justify-end gap-2">
          <button @click="focus = false" class="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400">Cancel</button>
          <button @click="sendLoginEmail"
            class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">{{ loading ? 'Loading...' : 'Submit' }}</button>

        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { shortcodeEmailRegex } from '~~/hono/types';

const focus = ref(false);
const loading = ref(false);
const email = ref('');

const sendLoginEmail = async () => {
  if (loading.value) return;
  if (!shortcodeEmailRegex.test(email.value)) {
    return alert("Please use your Imperial shortcode email.");
  }

  loading.value = true;
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.value }),
    headers: { 'Content-Type': 'application/json' }
  });
  loading.value = false;

  if (res.ok) {
    alert('Login email sent! Please check your inbox.');
    focus.value = false;
    email.value = "";
  } else {
    alert('Failed to send login email. Please try again.');
  }
}

</script>