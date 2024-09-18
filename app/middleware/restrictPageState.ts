export default defineNuxtRouteMiddleware(async (to, from) => {
  const { currentState, setState } = useAppState()
  const { data: newState } = await useFetch('/api/admin/state');

  setState(newState.value.state)

  if (currentState.value != to.meta.state) return abortNavigation();
});
