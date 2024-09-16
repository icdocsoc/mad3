<script setup lang="ts">
type Props = {
  question: {
    type: 'matrix';
    title: string;
    rows: Record<string, string>;
    columns: Record<string, number>;
    required?: boolean;
  };
};
const props = defineProps<Props>();

const answers = ref<Record<string, number>>({});
function handleChange(item: string, value: number) {
  answers.value = { ...answers.value, [item]: value };
}
type Emits = {
  update: [obj: Record<string, number>];
};
const emit = defineEmits<Emits>();
watch(answers, () => {
  emit('update', answers.value);
});
</script>

<template>
  <div class="overflow-x-scroll">
    <h3>
      {{ props.question.title }}
      <span class="text-red-600" v-if="props.question.required">*</span>
    </h3>
    <table class="w-full">
      <thead>
        <tr class="border">
          <th class="border-x"></th>
          <th
            v-for="(value, key) in props.question.columns"
            :key="key"
            class="border-x px-2">
            {{ key }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(value, key) in props.question.rows"
          :key="key"
          class="border">
          <td class="px-2 py-1">
            {{ value }}
          </td>
          <td
            v-for="(colValue, _) in props.question.columns"
            :key="key"
            class="border-x">
            <div class="grid h-full w-full place-items-center px-1 py-2">
              <input
                type="radio"
                :name="key"
                :value="colValue"
                @change="handleChange(key, colValue)"
                :required="props.question.required" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
