<script setup lang="ts">
import { z } from 'zod';

// Page setup stuff
const headers = useRequestHeaders(); // since it is SSR, we need to retrieve the headers in the server
const responseSchema = z.object({
  shortcode: z.string().regex(/^[a-z]{2,3}\d{2,4}$/),
  user_is: z.enum(['parent', 'fresher']),
  doneSurvey: z.boolean()
});
definePageMeta({
  middleware: []
});
const { data, status, error } = useAsyncData('get-details', async () => {
  // check if the user exists and completed the survey
  const response = await $fetch('/api/auth/details', { headers });
  const validated = await responseSchema.parseAsync(response);
  if (validated.doneSurvey) {
    throw new Error('You have already completed the survey');
  }

  return validated;
});

async function handleSubmit(surveyResult: Record<string, any>) {
  // TODO add the survey result type
  // submit the survey
  try {
    const response = await $fetch('/api/survey', {
      method: 'POST',
      headers,
      body: { surveyResult }
    });
    // show the result
  } catch (err) {
    // @ts-ignore error type to be checked later
    alert(err.message);
  }
}
</script>

<template>
  <Card>
    <Survey :questions="surveyQuestions" />
  </Card>
</template>
