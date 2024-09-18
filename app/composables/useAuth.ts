export default () => {
  const currentUser = useState<IStudent | null>('user', () => null);
  const setUser = (newUser: IStudent | null) => {
    currentUser.value = newUser;
  };

  return {
    currentUser,
    setUser
  };
};
