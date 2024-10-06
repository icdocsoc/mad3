<script setup lang="ts">
import { stateOptions } from '~~/hono/types';

const headers = useRequestHeaders();
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
const filteredFamilies = ref<IFamily[]>(familyData.value);

async function setApiState(state: State) {
  try {
    if (!confirm('This will update the state of the website. Are you sure you want to do this?')) return;
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

function filterFamilies() {
  if (search.value == '') filteredFamilies.value = familyData.value;
  else {
    filteredFamilies.value = familyData.value.filter(
      (family: IFamily) =>
        family.parents.some(student =>
          student.shortcode.startsWith(search.value)
        ) ||
        family.kids.some(student => student.shortcode.startsWith(search.value))
    );
  }
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
    <CardTitle>All families</CardTitle>
    <input
      class="my-2"
      placeholder="search by shortcode"
      v-model="search"
      @input="filterFamilies" />
    <div v-for="family of filteredFamilies" class="m-1 border-4 p-1">
      <Family :family="family" />
    </div>
  </Card>
</template>
