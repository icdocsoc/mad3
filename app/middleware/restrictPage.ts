export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user } = useAuth();

  console.log('running')
  if (user == undefined || user.value?.role != to.meta.auth) return abortNavigation();
});
