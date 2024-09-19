<script setup lang="ts">
const error = useError();

const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <NuxtLayout>
    <Card>
      <CardTitle>Ooopss...</CardTitle>
      <CardDetails>
        <div v-if="error.statusCode == 404">
          <div>
            We couldn't find the page you're looking for. Maybe it wasn't
            <i>the one</i>
            ?
          </div>
          <div>
            No worries, you can always take a step back and begin
            <span
              @click="handleError"
              class="cursor-pointer text-link no-underline hover:text-linkHover hover:underline">
              where you started
            </span>
            .
          </div>
        </div>
        <div v-else-if="error.statusCode == 500">
          Love may be complicated, and this error is too. It's not you, it's us.
          Please let us know how you ended up here! In the meantime, you can
          explore our wonderful
          <span
            @click="handleError"
            class="cursor-pointer text-link no-underline hover:text-linkHover hover:underline">
            Home page
          </span>
          .
        </div>
      </CardDetails>
    </Card>
  </NuxtLayout>
</template>
