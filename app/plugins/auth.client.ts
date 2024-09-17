export default defineNuxtPlugin(nuxtApp => {
  const { checkAuthStatus } = useAuth();

  nuxtApp.hook('app:created', async () => {
    await checkAuthStatus();
  });

  nuxtApp.hook('page:start', async () => {
    await checkAuthStatus();
  });
});
