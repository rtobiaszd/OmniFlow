// This file is part of the React example project.
//
// (c) 2023 Your Name
//
// For the full copyright and license information, please view the LICENSE
// file that was distributed with this source code.
import { Inbox } from './pages/Inbox';
import { Pipelines } from './pages/Pipelines';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import WorkflowEditor from '../components/WorkflowEditor';

const App = () => {
  return (
    <div>
      <h1>React Example</h1>
      <Inbox />
      <Pipelines />
      <Users />
      <Settings />
      <WorkflowEditor />
    </div>
  );
};

export default App;