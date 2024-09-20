<script setup lang="ts">
const { currentUser } = useAuth();
const loginFeature = useFeature('login');
</script>

<template>
  <nav
    class="flex justify-between rounded-b-2xl bg-primary px-4 py-2 lg:mx-auto lg:max-w-screen-lg">
    <NavigationLink to="/" icon="/images/docsoc-square-white.png">
      <span class="md:hidden">MaD</span>
      <span class="max-md:hidden md:text-xl">Mums & Dads</span>
    </NavigationLink>
    <ul class="flex items-center gap-3">
      <li v-if="loginFeature && currentUser === null">
        <a
          class="cursor-pointer font-bold text-white hover:text-white hover:no-underline md:text-xl"
          href="/api/auth/signIn">
          Log In
        </a>
      </li>
      <li v-if="loginFeature && currentUser !== null">
        <NavigationLink to="/portal">
          <span class="md:text-xl">Portal</span>
        </NavigationLink>
      </li>
      <li v-if="currentUser !== null">
        <a
          class="cursor-pointer font-bold text-white hover:text-white hover:no-underline md:text-xl"
          href="/api/auth/signOut">
          Log Out
        </a>
      </li>
    </ul>
  </nav>
</template>
