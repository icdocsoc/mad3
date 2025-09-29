<script setup lang="ts">
// Required composables
const { currentUser } = useAuth();
const { currentState } = useAppState();

definePageMeta({
  middleware: ['require-auth']
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
          <CardText>
            Visit your
            <NuxtLink to="/family">family page</NuxtLink>
            to see your family details.
          </CardText>
        </CardDetails>
      </div>
      <div v-else-if="currentState == 'freshers_open'">
        <CardDetails>
          <strong>Mums and Dads Survey. [OPEN]</strong>
          <CardText v-if="!currentUser!.completedSurvey">
            Please complete the
            <NuxtLink to="/survey">Mums and Dads survey</NuxtLink>
            so we can assign you to a happy family!
          </CardText>
          <CardText v-else-if="currentUser!.role == 'fresher'">
            Thank you for completing the survey! Be on the look out for an email
            with more details once families have been assigned.
          </CardText>
          <CardText v-else-if="currentUser!.role == 'parent'">
            Thank you for completing the survey! If you haven't yet, please
            send/accept a
            <NuxtLink to="/proposals">proposal</NuxtLink>
            to mark the start of your happy family.
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
