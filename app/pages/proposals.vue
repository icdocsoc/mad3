<script setup lang="ts">
definePageMeta({
  middleware: [
    'require-auth',
    function () {
      const { currentUser } = useAuth();

      if (currentUser.value!.role !== 'parent') {
        navigateTo('/portal');
      }
    }
  ]
});

const { currentUser } = useAuth();
type Proposal = {
  proposer: string;
  proposee: string;
};

// See if they have a partner.
const headers = useRequestHeaders();
const {
  data: familyData,
  status: familyStatus,
  error: familyError
} = useFetch<any>('/api/family/myFamily', {
  headers
});

const { data, status, error } = useFetch<Proposal[]>('/api/family/proposals');
const receivedProposals = computed(() =>
  data.value?.filter(p => p.proposee === currentUser.value!.shortcode)
);
const sentProposals = computed(() =>
  data.value?.filter(p => p.proposer === currentUser.value!.shortcode)
);

const proposeInput = ref('');
const router = useRouter();
async function handlePropose() {
  if (!proposeInput.value) {
    return;
  }

  try {
    await $fetch('/api/family/propose', {
      method: 'POST',
      body: {
        shortcode: proposeInput.value
      }
    });

    router.go(0);
  } catch (err) {
    alert(err.message);
  }
}
async function handleAccept(shortcode: string) {
  try {
    await $fetch('/api/family/acceptProposal', {
      method: 'POST',
      body: { shortcode }
    });

    router.go(0);
  } catch (err) {
    alert(err.message);
  }
}
</script>

<template>
  <div>
    <Card>
      <CardTitle>Info:</CardTitle>

      <CardText class="mt-2">
        To complete your registration you must be in a family. You can do that
        by either proposing to someone or accepting a proposal.
        <ul class="mt-2 list-disc ps-4">
          <li>
            If you have any proposals they will appear on this page, and you can
            accept one to complete registration.
          </li>
          <li>
            You can also propose to your chosen partner using their shortcode.
            <strong>
              Make sure they accept your proposal or your registration will not
              be valid.
            </strong>
          </li>
        </ul>
      </CardText>
    </Card>

    <Card v-if="familyData">
      <CardTitle>It's a match!</CardTitle>
      <div class="mt-4 flex gap-2">
        <Student :student="familyData.parents[0]" />
        <Student :student="familyData.parents[1]" />
      </div>
    </Card>

    <div v-else>
      <Card>
        <CardTitle>People who proposed to you:</CardTitle>
  
        <div class="mt-4 flex flex-wrap gap-2 self-start">
          <p v-if="status == 'pending'">Loading...</p>
          <p v-else-if="status == 'error'">Oops, {{ error!.message }}</p>
          <p v-else-if="data && !receivedProposals?.length">
            You have no proposals yet, ask your partner to propose to you or
            propose them.
          </p>
          <div
            v-else
            v-for="proposal in receivedProposals"
            :key="proposal.proposer"
            class="flex gap-5 border px-2 py-1">
            <div class="flex flex-col items-start">
              <strong>{{ proposal.proposer }}</strong>
            </div>
            <div class="flex items-start gap-3">
              <span
                class="cursor-pointer bg-green-400 p-1 text-sm text-white"
                @click="handleAccept(proposal.proposer)">
                Accept
              </span>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <CardTitle>People that you proposed to:</CardTitle>
  
        <div class="mt-4 flex flex-wrap gap-2 self-start">
          <p v-if="status == 'pending'">Loading...</p>
          <p v-else-if="status == 'error'">Oops, {{ error!.message }}</p>
          <p v-else-if="data && !sentProposals?.length">
            You have not proposed to anyone yet. It's time to take that leap of
            faith to get what you want.
          </p>
          <div
            v-else
            v-for="proposal in sentProposals"
            :key="proposal.proposee"
            class="flex gap-5 border px-2 py-1">
            <div class="flex flex-col items-start">
              <strong>{{ proposal.proposee }}</strong>
            </div>
            <div class="flex items-start gap-3">
              <span class="cursor-pointer bg-yellow-400 p-1 text-sm text-white">
                Pending
              </span>
            </div>
          </div>
        </div>
  
        <CardDetails>
          <strong>
            Want to send a proposal to a potential partner? Enter their exact
            shortcode:
          </strong>
          <div class="flex gap-4">
            <input
              type="text"
              class="flex-grow"
              placeholder="e.g. nj421"
              v-model="proposeInput" />
            <button
              class="hover flex items-center gap-2 rounded bg-[#ff4669] px-2 text-white"
              @click="handlePropose">
              Propose
              <img
                src="~/assets/icons/docsoc-love.webp"
                alt="Propose"
                class="aspect-square w-5" />
            </button>
          </div>
        </CardDetails>
      </Card>
    </div>
  </div>
</template>
