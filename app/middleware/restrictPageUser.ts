export default defineNuxtRouteMiddleware(async (to, from) => {
  const { currentUser } = useAuth();

  if (
    currentUser == undefined ||
    (currentUser.value?.role != to.meta.auth && to.meta.auth != 'authenticated')
  )
    return abortNavigation();
});
