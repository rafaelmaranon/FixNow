import { contractorDispatcherGraph } from './graphs/contractor-dispatcher.ts';
import { project } from '@inkeep/agents-sdk';

export const myProject = project({
  id: 'contractor-dispatcher-mvp',
  name: 'Contractor Dispatcher MVP',
  description: 'AI-powered contractor dispatch and management system',
  graphs: () => [contractorDispatcherGraph],
});