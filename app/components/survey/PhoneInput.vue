<script setup lang="ts">
import {
  getCountryCodeForRegionCode,
  getSupportedRegionCodes,
  parsePhoneNumber
} from 'awesome-phonenumber';

const props = defineProps<{ id: string }>();

// Stored as E.164 once it's a real number; otherwise what was typed, so the page can say so.
const model = defineModel<string | undefined>({ required: true });

const existing = model.value ? parsePhoneNumber(model.value) : undefined;
const region = ref(existing?.valid ? (existing.regionCode ?? 'GB') : 'GB');
const typed = ref(
  existing?.valid ? existing.number.national : (model.value ?? '')
);

const names = new Intl.DisplayNames(['en'], { type: 'region' });
const regions = getSupportedRegionCodes()
  .map(code => ({
    code,
    label: `${names.of(code) ?? code} (+${getCountryCodeForRegionCode(code)})`
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

watch([region, typed], () => {
  const parsed = parsePhoneNumber(typed.value, { regionCode: region.value });
  model.value = typed.value.trim()
    ? parsed.valid
      ? parsed.number.e164
      : typed.value
    : undefined;
});
</script>

<template>
  <div class="flex gap-2">
    <select v-model="region" aria-label="Country" class="w-32 rounded">
      <option v-for="one in regions" :key="one.code" :value="one.code">
        {{ one.label }}
      </option>
    </select>
    <input
      :id="props.id"
      v-model="typed"
      type="tel"
      autocomplete="tel-national"
      class="min-w-0 flex-grow rounded" />
  </div>
</template>
