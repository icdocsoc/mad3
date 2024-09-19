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
    <CardTitle>Welcome to the portal, {{ currentUser!.shortcode }}</CardTitle>

    <CardDetails v-if="status == 'pending'">
      <strong>Loading...</strong>
    </CardDetails>
    <CardDetails v-else-if="status == 'error'">
      <strong>Error</strong>
      <CardText>{{ error }}</CardText>
    </CardDetails>
    <div v-else-if="status == 'success'">
      <div v-if="currentState == 'parents_open'">
        <CardDetails v-if="data?.user_is == 'fresher'">
          <strong>Whoops...</strong>
          <CardText>
            You are about 2 weeks too early. You have nothing to do here just
            yet. Please return to this page after we notify you by email. You
            can read all
            <NuxtLink to="/">About MaDs</NuxtLink>
            in the meantime.
          </CardText>
        </CardDetails>
        <CardDetails v-else>
          <strong>Parent's survey & proposals. [OPEN]</strong>
          <CardText>
            If you have not completed our survey yet, please complete the
            <NuxtLink to="/survey">survey</NuxtLink>
            to start sending proposals.
          </CardText>
          <CardText>
            Visit the
            <NuxtLink to="/proposals">proposals page</NuxtLink>
            to see your proposal status.
          </CardText>
        </CardDetails>
      </div>
      <div v-else-if="currentState == 'parents_close'">
        <CardDetails v-if="data?.user_is == 'fresher'">
          <strong>Whoops...</strong>
          <CardText>
            You are about a week too early. You have nothing to do here just
            yet. Please return to this page after we notify you by email. You
            can read all
            <NuxtLink to="/">About MaDs</NuxtLink>
            in the meantime.
          </CardText>
        </CardDetails>
        <CardDetails v-else>
          <strong>Parent's survey & proposals. [CLOSED]</strong>
          <CardText>
            Visit your
            <NuxtLink to="/family">family page</NuxtLink>
            to see your family details.
          </CardText>
        </CardDetails>
      </div>
      <div v-else-if="currentState == 'freshers_open'">
        <CardDetails v-if="data?.user_is == 'fresher'">
          <strong>Fresher's survey. [OPEN]</strong>
          <CardText>
            If you have not completed our survey yet, please complete the
            <NuxtLink to="/survey">survey</NuxtLink>
            so we can assign a family to you.
          </CardText>
        </CardDetails>
        <CardDetails v-else>
          <strong>Parent's survey & proposals. [CLOSED]</strong>
          <CardText>
            Visit your
            <NuxtLink to="/family">family page</NuxtLink>
            to see your family details.
          </CardText>
        </CardDetails>
      </div>
      <div v-else-if="currentState == 'closed'">
        <CardDetails>
          <strong>
            {{
              data?.user_is == 'fresher'
                ? "Fresher's survey."
                : "Parent's survey & proposals."
            }}
            [CLOSED]
          </strong>
          <CardText>
            Visit your
            <NuxtLink to="/family">family page</NuxtLink>
            to see your family details.
          </CardText>
        </CardDetails>
      </div>
    </div>
  </Card>
</template>
