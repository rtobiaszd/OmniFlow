// Ensure UserProfile interface includes name property
interface UserProfile {
  id: number;
  name: string;
  status: string;
}
const Pipelines: React.FC = () => {
  const userProfile: UserProfile = { id: 1, name: 'John', status: 'active' };
  return <div>{userProfile.name}</div>;
};
export default Pipelines;