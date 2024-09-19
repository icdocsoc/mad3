<script setup lang="ts">
import { z } from 'zod';
const { currentUser } = useAuth();

definePageMeta({
  middleware: ['require-auth']
});

// Page setup stuff
const headers = useRequestHeaders(); // since it is SSR, we need to retrieve the headers in the server
if (currentUser.value!.completedSurvey) {
  throw new Error('You have already completed the survey');
}

// Survey form stuff
const formData = reactive({
  name: '',
  interests: {
    alcohol: 0,
    anime: 0,
    artGraphics: 0,
    baking: 0,
    tabletopGames: 0,
    charity: 0,
    clubbing: 0,
    cooking: 0,
    danceBallroom: 0,
    danceContemporary: 0,
    dramatics: 0,
    film: 0,
    finance: 0,
    exerciseAndHealth: 0,
    hiking: 0,
    kpop: 0,
    martialArts: 0,
    performingMusicPopRockJazz: 0,
    performingMusicClassical: 0,
    photography: 0,
    politics: 0,
    videoGames: 0,
    football: 0,
    rugby: 0,
    rowing: 0,
    racketSports: 0,
    otherSports: 0
  },
  aboutMe: '',
  socials: [] as string[],
  gender: 'male',
  course: 'computing'
});
async function handleSubmit() {
  const confirmation = confirm(
    'Are you sure you want to submit? You cannot redo this survey.'
  );
  if (!confirmation) return;

  try {
    await $fetch('/api/family/survey', {
      method: 'POST',
      headers,
      body: {
        name: formData.name,
        interests: formData.interests,
        aboutMe: formData.aboutMe,
        socials: formData.socials,
        gender: formData.gender,
        jmc: formData.course == 'jmc'
      }
    });

    navigateTo('/portal');
  } catch (err) {
    // @ts-ignore error type to be checked later
    alert(err.message);
  }
}
</script>

<template>
  <Card>
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-5">
      <SurveyGroup label="Preferred Name:" :required="true">
        <input
          class="inline-block w-full"
          type="text"
          v-model="formData.name"
          required />
      </SurveyGroup>

      <SurveyGroup label="Interests:" :required="true">
        <SurveyMatrix
          :labels="interestLabels"
          v-model="formData.interests"
          :required="true" />
      </SurveyGroup>

      <SurveyGroup
        label="If you'd like to write a few words to introduce yourself to the rest of your family, here's your chance. Your family will see this once the families have been assigned:"
        :required="false">
        <textarea class="inline-block w-full" v-model="formData.aboutMe" />
      </SurveyGroup>

      <SurveyGroup
        label="Social Media links so other family members can contact you prior to the first social:"
        :required="false">
        <div class="flex flex-col gap-2">
          <div
            class="flex gap-5"
            v-for="(_, index) in formData.socials"
            :key="index">
            <input
              type="text"
              class="flex-grow"
              v-model="formData.socials[index]" />
            <button
              v-if="formData.socials[index]?.length"
              class="rounded bg-red-600 p-2 text-center text-white"
              @click.prevent="
                formData.socials = formData.socials.splice(index - 1, 1)
              ">
              Remove Link
            </button>
          </div>
          <button
            class="self-start rounded bg-green-600 p-2 text-center text-white"
            @click.prevent="formData.socials = [...formData.socials, '']">
            Add Link
          </button>
        </div>
      </SurveyGroup>

      <SurveyGroup label="Gender:" :required="true">
        <SurveySelect
          :options="['male', 'female', 'other', 'na']"
          :labels="['Male', 'Female', 'Other', 'Prefer not to say']"
          name="gender"
          v-model="formData.gender"
          :required="true" />
      </SurveyGroup>
      <SurveyGroup label="Course:" :required="true">
        <SurveySelect
          :options="['computing', 'jmc']"
          :labels="['Computing', 'JMC']"
          name="course"
          v-model="formData.course"
          :required="true" />
      </SurveyGroup>

      <input
        type="submit"
        value="Submit"
        class="cursor-pointer rounded border bg-primary px-3 py-1 font-semibold text-white" />
    </form>
  </Card>
</template>
