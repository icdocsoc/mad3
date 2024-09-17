export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user } = useAuth();

  if (
    user == undefined ||
    (user.value?.role != to.meta.auth && to.meta.auth != 'authenticated')
  )
    return abortNavigation();
});
