<script setup lang="ts">
const { currentUser } = useAuth();
</script>

<template>
  <nav
    class="flex justify-between rounded-b-2xl bg-primary px-4 py-2 lg:mx-auto lg:max-w-screen-lg">
    <NavigationLink to="/" icon="/images/docsoc-square-white.png">
      <span class="md:hidden">MaD</span>
      <span class="max-md:hidden md:text-xl">Mums & Dads</span>
    </NavigationLink>
    <ul class="flex items-center gap-3">
      <li v-if="currentUser === null">
        <NuxtLink
          to="/login"
          class="font-bold text-white hover:text-white hover:no-underline md:text-xl">
          Log In
        </NuxtLink>
      </li>
      <li
        v-if="currentUser"
        class="rounded-full bg-white/15 px-3 py-1 text-sm text-white md:text-base"
        data-testid="signed-in-as">
        <span class="sr-only">Logged in as</span>
        <span class="font-mono font-bold">
          &#123;{{ currentUser.shortcode }}&#125;
        </span>
        <span class="max-md:hidden">
          {{ currentUser.role == 'fresher' ? 'Fresher' : 'Parent' }}
        </span>
      </li>
      <li v-if="currentUser !== null">
        <NavigationLink to="/portal">
          <span class="md:text-xl">Portal</span>
        </NavigationLink>
      </li>
      <li v-if="currentUser !== null">
        <form method="post" action="/api/auth/signOut">
          <button
            type="submit"
            class="font-bold text-white hover:text-white md:text-xl">
            Log Out
          </button>
        </form>
      </li>
    </ul>
  </nav>
</template>
