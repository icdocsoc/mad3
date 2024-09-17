<script setup lang="ts">
const columns = ['No Interest', 'Mild Interest', 'Strong Interest'];

type Props = {
  labels: Record<string, string>;
  modelValue: Record<string, number>;
  required?: boolean;
};
const { labels, modelValue, required = false } = defineProps<Props>();

type Emits = {
  'update:modelValue': [value: Record<string, number>];
};
const emit = defineEmits<Emits>();
const handleChange = (key: string, index: number) => {
  emit('update:modelValue', { ...modelValue, [key]: index });
};
</script>

<template>
  <div class="overflow-x-scroll">
    <table class="w-full">
      <thead>
        <tr class="border">
          <th class="border-x"></th>
          <th v-for="heading in columns" :key="heading" class="border-x px-2">
            {{ heading }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(_, key) in modelValue" :key="key" class="border">
          <td class="px-2 py-1">
            {{ labels[key] }}
          </td>
          <td v-for="(_, index) in columns" :key="key" class="border-x">
            <div class="grid h-full w-full place-items-center px-1 py-2">
              <input
                type="radio"
                :name="labels[key]"
                @change="handleChange(key, index)"
                :value="index"
                :required="required" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
