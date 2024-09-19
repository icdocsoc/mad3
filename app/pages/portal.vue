<script setup lang="ts">
import { z } from 'zod';

// Required composables
const { currentUser } = useAuth();
const { currentState } = useAppState();

// Page setup stuff
const headers = useRequestHeaders(); // since it is SSR, we need to retrieve the headers in the server
const responseSchema = z.object({
  shortcode: z.string().regex(/^[a-z]{2,3}\d{2,4}$/),
  user_is: z.enum(['parent', 'fresher']),
  doneSurvey: z.boolean()
});
definePageMeta({
  middleware: ['require-auth']
});
const { data, status, error } = useAsyncData('get-details', async () => {
  // check if the user exists and completed the survey
  const response = await $fetch('/api/auth/details', { headers });
  const validated = await responseSchema.parseAsync(response);
  return validated;
});
</script>

<template>
  <Card>
    <CardTitle>Welcome to the portal, {{ currentUser!.name }}</CardTitle>

    <CardDetails v-if="!data?.doneSurvey">
      <strong>
        You have not completed the survey yet! Please complete the
        <NuxtLink to="/survey">survey</NuxtLink>
        to
        {{
          currentUser?.role == 'parent'
            ? 'assign your kids'
            : 'get assigned to a parent'
        }}.
      </strong>
    </CardDetails>
  </Card>
</template>
