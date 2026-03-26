// Ensure props are correctly typed
const Settings: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={className}>Settings</div>;
};
export default Settings;