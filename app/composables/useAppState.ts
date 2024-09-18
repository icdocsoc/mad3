export default () => {
  const currentState = useState<State>('state', () => 'parents_open');
  const setState = (state: string) => {
    currentState.value = state;
  };

  return {
    currentState,
    setState
  };
};
