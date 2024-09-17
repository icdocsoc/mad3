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

// Form stuff
const preferredName = ref('');
const interests = ref({
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
  exerciseAndHeath: 0,
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
});
const selfDescription = ref('');
const socialMedia = ref<string[]>([]);
const gender = ref('male');
const course = ref('computing');

const matrixLabels = {
  alcohol: 'Alcohol - Drinking',
  anime: 'Anime',
  artGraphics: 'Art/Graphics',
  baking: 'Baking',
  tabletopGames: 'Board/Tabletop Games',
  charity: 'Charity',
  clubbing: 'Clubbing',
  cooking: 'Cooking',
  danceBallroom: 'Dance - Salsa, Ballroom, other partnered dances',
  danceContemporary: 'Dance - Hip hop, urban other contemporary dances',
  dramatics: 'Dramatics - Drama or Musical Theatre',
  film: 'Film and Cinematography',
  finance: 'Finance and Entrepreneurship',
  exerciseAndHeath: 'Fitness and Health',
  hiking: 'Hiking',
  kpop: 'K-pop',
  martialArts: 'Martial Arts and Self Defence',
  performingMusicPopRockJazz: 'Performing Music - Pop, Rock, Jazz',
  performingMusicClassical: 'Performing Music - Classical, Chamber',
  photography: 'Photography',
  politics: 'Politics',
  videoGames: 'Video Games',
  football: 'Football (the British one!)',
  rugby: 'Rugby',
  rowing: 'Rowing',
  racketSports: 'Racket Sports - Tennis, Badminton, other racket sports',
  otherSports: 'Other Sports'
};

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
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-5">
      <SurveyGroup label="Preferred Name:" :required="true">
        <input
          class="inline-block w-full"
          type="text"
          v-model="preferredName"
          required />
      </SurveyGroup>

      <SurveyGroup label="Interests:" :required="true">
        <SurveyMatrix
          :labels="matrixLabels"
          v-model="interests"
          :required="true" />
      </SurveyGroup>

      <SurveyGroup
        label="If you'd like to write a few words to introduce yourself to the rest of your family, here's your chance. Your family will see this once the families have been assigned:"
        :required="false">
        <textarea class="inline-block w-full" v-model="selfDescription" />
      </SurveyGroup>

      <SurveyGroup
        label="Social Media links so other family members can contact you prior to the first social:"
        :required="false">
        <input
          class="inline-block w-full"
          type="text"
          v-model="preferredName" />
        <button
          class="mt-2 border bg-primary px-3 py-1 text-white"
          @click.prevent="">
          Add more
        </button>
      </SurveyGroup>

      <SurveyGroup label="Gender:" :required="true">
        <SurveySelect
          :options="['male', 'female', 'other', 'na']"
          :labels="['Male', 'Female', 'Other', 'Prefer not to say']"
          name="gender"
          v-model="gender"
          :required="true" />
      </SurveyGroup>
      <SurveyGroup label="Course:" :required="true">
        <SurveySelect
          :options="['computing', 'jmc']"
          :labels="['Computing', 'JMC']"
          name="course"
          v-model="course"
          :required="true" />
      </SurveyGroup>

      <input
        type="submit"
        value="Submit"
        class="cursor-pointer border bg-primary px-3 py-1 font-semibold text-white" />
    </form>
  </Card>
</template>
