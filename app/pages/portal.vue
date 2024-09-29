<script setup lang="ts">
// Required composables
const { currentUser } = useAuth();
const { currentState } = useAppState();

definePageMeta({
  middleware: ['require-auth']
});

const { status } = useFetch('/api/family/myFamily', {
  immediate: false
});
</script>

<template>
  <Card>
    <CardTitle>Welcome to the portal, {{ currentUser!.shortcode }}</CardTitle>
    <div>
      <div v-if="currentState == 'parents_open'">
        <CardDetails v-if="currentUser!.role == 'fresher'">
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
          <CardText v-if="!currentUser!.completedSurvey">
            Please complete our
            <NuxtLink to="/survey">survey</NuxtLink>
            to start sending proposals.
          </CardText>
          <div v-else>
            <Student :student="currentUser!" />
            <CardText>
              Visit the
              <NuxtLink to="/proposals">proposals page</NuxtLink>
              to see your proposal status.
            </CardText>
          </div>
        </CardDetails>
      </div>
      <div v-else-if="currentState == 'parents_close'">
        <CardDetails v-if="currentUser!.role == 'fresher'">
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
          <CardText v-if="status == 'success'">
            Visit your
            <NuxtLink to="/family">family page</NuxtLink>
            to see your family details.
          </CardText>
          <CardText v-else-if="status == 'error'">
            Sorry, we could not fetch your family details. Please try again.
          </CardText>
        </CardDetails>
      </div>
      <div v-else-if="currentState == 'freshers_open'">
        <CardDetails v-if="currentUser!.role == 'fresher'">
          <strong>Fresher's survey. [OPEN]</strong>
          <CardText>
            If you have not completed our survey yet, please complete the
            <NuxtLink to="/survey">survey</NuxtLink>
            so we can assign a family to you.
          </CardText>
        </CardDetails>
        <CardDetails v-else>
          <strong>Parent's survey & proposals. [CLOSED]</strong>
          <CardText v-if="status == 'success'">
            Visit your
            <NuxtLink to="/family">family page</NuxtLink>
            to see your family details.
          </CardText>
          <CardText v-else-if="status == 'error'">
            Sorry, we could not fetch your family details. Please try again.
          </CardText>
        </CardDetails>
      </div>
      <div v-else-if="currentState == 'closed'">
        <CardDetails>
          <strong>
            {{
              currentUser!.role == 'fresher'
                ? "Fresher's survey."
                : "Parent's survey & proposals."
            }}
            [CLOSED]
          </strong>
          <CardText v-if="status == 'success'">
            Visit your
            <NuxtLink to="/family">family page</NuxtLink>
            to see your family details.
          </CardText>
          <CardText v-else-if="status == 'error'">
            Sorry, we could not fetch your family details. Please try again.
          </CardText>
        </CardDetails>
      </div>
    </div>
  </Card>
</template>
