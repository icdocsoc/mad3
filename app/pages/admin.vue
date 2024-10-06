<script setup lang="ts">
import { stateOptions } from '~~/hono/types';

const headers = useRequestHeaders();
const { currentUser } = useAuth();
const { currentState, setState } = useAppState();
// TODO specify the type of data
const { data, status, error } = useFetch<any>('/api/admin/stats', {
  headers
});

async function setApiState(state: State) {
  try {
    await $fetch('/api/admin/state', {
      method: 'PUT',
      headers,
      body: {
        state: state
      }
    });

    setState(state);
  } catch (err) {
    // @ts-ignore error type to be checked later
    alert(err.message);
  }
}

definePageMeta({
  middleware: ['require-auth', 'require-admin']
});
</script>

<template>
  <Card>
    <CardTitle>Stats</CardTitle>
    <div v-if="status == 'pending'">Loading...</div>
    <div v-else-if="status == 'error'">Oops... {{ error?.message }}</div>
    <div v-else-if="status == 'success'">
      <div class="flex flex-col">
        <p>
          <b>Families:</b>
          {{ data.families }}
        </p>
        <p>
          <b>Parents who signed in once:</b>
          {{ data.all_parents }}
        </p>
        <p>
          <b>Parents who successfully completed survey:</b>
          {{ data.registered_parents }}
        </p>
        <p>
          <b>Total freshers this year:</b>
          {{ data.all_freshers }}
        </p>
        <p>
          <b>Freshers who successfully completed survey:</b>
          {{ data.registered_freshers }}
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
      <div class="flex place-content-center space-x-5">
        <button
          v-for="state of stateOptions"
          v-on:click="setApiState(state)"
          class="rounded-md border-4 p-2 transition-all hover:bg-gray-100 active:bg-gray-200">
          {{ state }}
        </button>
      </div>
    </div>
  </Card>

  <Card>
    <CardTitle>Family search</CardTitle>
    // tbd
  </Card>
</template>
