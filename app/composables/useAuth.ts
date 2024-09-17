export default () => {
  const user = useState<IStudent | undefined>('user', () => undefined);

  return {
    user
  };
};
