export default () => {
  const currentState = useState<State>('state', () => 'closed');
  const setState = (state: State) => {
    currentState.value = state;
  };

  return {
    currentState,
    setState
  };
};
