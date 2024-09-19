export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const { setState } = useAppState();
  const { data: newState } = await useFetch('/api/admin/state');

  setState(newState.value.state);
});
