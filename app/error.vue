<script setup lang="ts">
const error = useError();
const status = computed(() => error.value?.statusCode ?? 500);

const goHome = () => clearError({ redirect: '/' });
const logIn = () => clearError({ redirect: '/login' });
</script>

<template>
  <NuxtLayout>
    <Card>
      <CardTitle>Ooopss...</CardTitle>
      <CardDetails>
        <template v-if="status == 404">
          <p>
            We couldn't find the page you're looking for. Maybe it wasn't
            <i>the one?</i>
          </p>
          <p>No worries, you can always take a step back and begin again.</p>
        </template>
        <template v-else-if="status == 401 || status == 403">
          <p>
            This page isn't for you, or you're not logged in. If you think it
            should be, log in with your shortcode email.
          </p>
        </template>
        <template v-else>
          <p>
            Love may be complicated, and this error is too. It's not you, it's
            us. Please let us know how you ended up here at docsoc@ic.ac.uk.
          </p>
        </template>
        <div class="flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded bg-primary px-4 py-2 font-bold text-white"
            @click="goHome">
            Back to the home page
          </button>
          <button
            v-if="status == 401 || status == 403"
            type="button"
            class="rounded border-2 border-primary px-4 py-2 font-bold text-primary"
            @click="logIn">
            Log in
          </button>
        </div>
      </CardDetails>
    </Card>
  </NuxtLayout>
</template>
