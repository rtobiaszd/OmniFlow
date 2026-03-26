// Ensure UserProfile interface includes status property
interface UserProfile {
  id: number;
  name: string;
  status: string;
}
const Users: React.FC = () => {
  const userProfiles: UserProfile[] = [{ id: 1, name: 'John', status: 'active' }];
  return <div>{userProfiles.map(profile => profile.status)}</div>;
};
export default Users;