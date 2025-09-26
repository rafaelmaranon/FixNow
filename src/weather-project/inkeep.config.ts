import { defineConfig } from '@inkeep/agents-cli/config';

  const config = defineConfig({
    tenantId: "default",
    projectId: "weather-project",
    agentsManageApiUrl: 'http://localhost:3002',
    agentsRunApiUrl: 'http://localhost:3003',
    modelSettings: {
  "base": {
    "model": "anthropic/claude-sonnet-4-20250514"
  },
  "structuredOutput": {
    "model": "anthropic/claude-3-5-haiku-20241022"
  },
  "summarizer": {
    "model": "anthropic/claude-3-5-haiku-20241022"
  }
},
  });
      
  export default config;