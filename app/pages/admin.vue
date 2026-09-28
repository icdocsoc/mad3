<script setup lang="ts">
import { stateOptions } from '~~/hono/types';

const headers = useRequestHeaders(['cookie']);
const { currentUser } = useAuth();
const { currentState, setState } = useAppState();
// TODO specify the type of data
const {
  data: statsData,
  status: statsStatus,
  error: statsError
} = useFetch<any>('/api/admin/stats', {
  headers
});

const {
  data: familyData,
  status: familyStatus,
  error: errorStatus
} = useFetch<any>('/api/admin/all-families', {
  headers
});

const search = ref('');
// Every family until something is typed; then any whose ID or shortcodes start with it.
const filteredFamilies = computed<IFamily[]>(() => {
  const all: IFamily[] = familyData.value ?? [];
  const query = search.value.trim().toLowerCase();
  if (!query) return all;
  return all.filter(
    family =>
      String(family.id) == query ||
      [...family.parents, ...family.kids].some(student =>
        student.shortcode.startsWith(query)
      )
  );
});

// Changing the state changes the whole site, so it takes a second click.
const pendingState = ref<State | null>(null);
const stateError = ref('');
async function setApiState(state: State) {
  stateError.value = '';
  try {
    await $fetch('/api/admin/state', {
      method: 'PUT',
      headers,
      body: { state }
    });
    setState(state);
  } catch (err) {
    stateError.value =
      (err as { data?: { error?: string } }).data?.error ??
      'Could not change the state.';
  }
  pendingState.value = null;
}

definePageMeta({
  middleware: ['require-auth', 'require-admin']
});
</script>

<template>
  <Card>
    <CardTitle>Stats</CardTitle>
    <div v-if="statsStatus == 'pending'">Loading...</div>
    <div v-else-if="statsStatus == 'error'">
      Oops... {{ statsError?.message }}
    </div>
    <div v-else-if="statsStatus == 'success'">
      <div class="flex flex-col">
        <p>
          <b>Families:</b>
          {{ statsData.families }}
        </p>
        <p>
          <b>Parents who signed in once:</b>
          {{ statsData.all_parents }}
        </p>
        <p>
          <b>Parents who successfully completed survey:</b>
          {{ statsData.registered_parents }}
        </p>
        <p>
          <b>Total freshers this year:</b>
          {{ statsData.all_freshers }}
        </p>
        <p>
          <b>Freshers who successfully completed survey:</b>
          {{ statsData.registered_freshers }}
        </p>
        <p>
          <b>Minimum to reasonably expect (all parents + all kids):</b>
          {{ statsData.families * 2 + statsData.registered_freshers }}
        </p>
        <p>
          <b>Maximum to unreasonably expect (all freshers + all parents)</b>
          {{ statsData.families * 2 + statsData.all_freshers }}
        </p>
      </div>
    </div>
  </Card>

  <Card>
    <CardTitle>State management</CardTitle>
    <div class="flex flex-col">
      <p>
        <b>Current state:</b>
        {{ currentState }}
      </p>
      <p class="my-5 text-center text-2xl">Update state</p>
      <div
        v-if="pendingState"
        class="flex flex-wrap place-content-center items-center gap-3">
        <span>
          Set sign-ups to
          <b>{{ pendingState }}</b>
          for everyone?
        </span>
        <button
          type="button"
          class="rounded-md bg-primary p-2 text-white"
          @click="setApiState(pendingState)">
          Yes, change it
        </button>
        <button
          type="button"
          class="rounded-md p-2 text-primary"
          @click="pendingState = null">
          Cancel
        </button>
      </div>
      <div v-else class="flex place-content-center space-x-5">
        <button
          v-for="state of stateOptions"
          :key="state"
          type="button"
          :disabled="state == currentState"
          class="rounded-md border-4 p-2 transition-all hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50"
          @click="pendingState = state">
          {{ state }}
        </button>
      </div>
      <p v-if="stateError" role="alert" class="mt-2 text-center text-red-600">
        {{ stateError }}
      </p>
    </div>
  </Card>

  <Card>
    <CardTitle>All families</CardTitle>
    <input
      v-model="search"
      class="my-2 rounded"
      aria-label="Search families"
      placeholder="search by shortcode or family ID" />
    <p v-if="!filteredFamilies.length">No families match.</p>
    <div
      v-for="family of filteredFamilies"
      :key="family.id"
      class="m-1 border-4 p-1">
      <Family :family="family" />
    </div>
  </Card>
</template>
