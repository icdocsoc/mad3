<script setup lang="ts">
definePageMeta({
  middleware: [
    'require-auth',
    function () {
      const { currentUser } = useAuth();

      if (currentUser.value!.role !== 'parent') {
        return navigateTo('/portal');
      }
    }
  ]
});

type Proposal = {
  proposer: string;
  proposee: string;
  proposerName: string | null;
  proposeeName: string | null;
};

const { currentUser } = useAuth();
const { currentState } = useAppState();
const headers = useRequestHeaders(['cookie']);

// Your partner, once you have one. A 404 just means "not yet".
const { data: family, refresh: refreshFamily } = useFetch<IFamily>(
  '/api/family/myFamily',
  { headers }
);
const { data, refresh: refreshProposals } = useFetch<Proposal[]>(
  '/api/family/proposals',
  { headers }
);

const me = computed(() => currentUser.value!.shortcode);
const received = computed(() =>
  (data.value ?? []).filter(p => p.proposee === me.value)
);
const sent = computed(() =>
  (data.value ?? []).filter(p => p.proposer === me.value)
);
const partner = computed(() =>
  family.value?.parents.find(parent => parent.shortcode != me.value)
);

async function refresh() {
  await Promise.all([refreshFamily(), refreshProposals()]);
}

// Proposals arrive from other people, so keep the lists current while the page is open.
let polling: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  polling = setInterval(() => void refresh(), 15_000);
});
onBeforeUnmount(() => clearInterval(polling));

const messageOf = (err: unknown) =>
  (err as { data?: { error?: string } }).data?.error ??
  'Something went wrong. Please try again.';

const shortcode = ref('');
const proposeError = ref('');
const proposing = ref(false);
async function propose() {
  if (!shortcode.value.trim() || proposing.value) return;
  proposing.value = true;
  proposeError.value = '';
  try {
    await $fetch('/api/family/propose', {
      method: 'POST',
      body: { shortcode: shortcode.value }
    });
    shortcode.value = '';
    await refresh();
  } catch (err) {
    proposeError.value = messageOf(err);
  } finally {
    proposing.value = false;
  }
}

// Accepting is for life, so it takes a second tap.
const confirming = ref<string | null>(null);
const listError = ref('');
async function accept(proposer: string) {
  listError.value = '';
  try {
    await $fetch('/api/family/acceptProposal', {
      method: 'POST',
      body: { shortcode: proposer }
    });
  } catch (err) {
    listError.value = messageOf(err);
  }
  confirming.value = null;
  await refresh();
}

async function revoke(proposee: string) {
  listError.value = '';
  try {
    await $fetch('/api/family/proposal', {
      method: 'DELETE',
      body: { shortcode: proposee }
    });
  } catch (err) {
    listError.value = messageOf(err);
  }
  await refresh();
}

const nameOf = (shortcode: string, name: string | null) =>
  name ? `${name} (${shortcode})` : shortcode;
</script>

<template>
  <div>
    <Card v-if="partner">
      <CardTitle>It's a match!</CardTitle>
      <div class="mt-4 flex flex-col gap-2 md:flex-row">
        <Student
          v-for="parent in family!.parents"
          :key="parent.shortcode"
          :student="parent" />
      </div>
      <CardText>
        You and {{ partner.answers?.preferredName || partner.name }} are parents
        together. We'll email you both once your children are allocated.
      </CardText>
    </Card>

    <template v-else>
      <Card>
        <CardTitle>Find your partner</CardTitle>
        <CardText class="mt-4">
          Parents sign up in pairs. Propose to your partner by their shortcode,
          or accept their proposal below.
          <strong>
            Until one of you accepts, you aren't signed up as parents.
          </strong>
        </CardText>
        <CardText v-if="!currentUser!.completedSurvey">
          You need to
          <NuxtLink to="/survey">fill in the survey</NuxtLink>
          before you can propose or accept.
        </CardText>
        <p v-if="currentState != 'open'" class="text-red-600">
          Sign-ups are closed, so proposals can't be sent or accepted.
        </p>
      </Card>

      <Card>
        <CardTitle>Proposals to you</CardTitle>
        <p v-if="listError" role="alert" class="mt-4 text-red-600">
          {{ listError }}
        </p>
        <p v-if="!received.length" class="mt-4">
          No proposals yet. Ask your partner to propose to you, or propose to
          them below.
        </p>
        <ul v-else class="mt-4 flex flex-col gap-2">
          <li
            v-for="proposal in received"
            :key="proposal.proposer"
            class="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2">
            <strong>
              {{ nameOf(proposal.proposer, proposal.proposerName) }}
            </strong>
            <div
              v-if="confirming == proposal.proposer"
              class="flex items-center gap-2">
              <span>Become parents together?</span>
              <button
                type="button"
                class="rounded bg-green-600 px-3 py-1 text-white"
                @click="accept(proposal.proposer)">
                Yes, accept
              </button>
              <button
                type="button"
                class="rounded px-3 py-1 text-primary"
                @click="confirming = null">
                Not yet
              </button>
            </div>
            <button
              v-else
              type="button"
              class="rounded bg-green-600 px-3 py-1 text-white"
              @click="confirming = proposal.proposer">
              Accept
            </button>
          </li>
        </ul>
      </Card>

      <Card>
        <CardTitle>Your proposals</CardTitle>
        <p v-if="!sent.length" class="mt-4">
          You haven't proposed to anyone yet.
        </p>
        <ul v-else class="mt-4 flex flex-col gap-2">
          <li
            v-for="proposal in sent"
            :key="proposal.proposee"
            class="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2">
            <span>
              <strong>
                {{ nameOf(proposal.proposee, proposal.proposeeName) }}
              </strong>
              · waiting for them to accept
            </span>
            <button
              type="button"
              class="rounded px-3 py-1 text-red-600 hover:bg-red-50"
              @click="revoke(proposal.proposee)">
              Take back
            </button>
          </li>
        </ul>

        <form class="mt-4 flex flex-col gap-2" @submit.prevent="propose">
          <label for="partner" class="font-bold">
            Your partner's shortcode
          </label>
          <div class="flex gap-2">
            <input
              id="partner"
              v-model="shortcode"
              type="text"
              autocapitalize="none"
              spellcheck="false"
              placeholder="e.g. nj421"
              class="min-w-0 flex-grow rounded" />
            <button
              type="submit"
              :disabled="proposing"
              class="flex items-center gap-2 rounded bg-[#ff4669] px-3 text-white disabled:opacity-60">
              Propose
              <img
                src="~/assets/icons/docsoc-love.webp"
                alt=""
                class="aspect-square w-5" />
            </button>
          </div>
          <p v-if="proposeError" role="alert" class="text-red-600">
            {{ proposeError }}
          </p>
        </form>
      </Card>
    </template>
  </div>
</template>
