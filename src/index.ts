import * as core from '@actions/core';

import type { RunInputs } from './main.js';

import { run } from './main.js';

// Extract inputs from GitHub Actions context
function getTimeoutMinutes(): number {
  const value = core.getInput('timeout_minutes');
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid timeout_minutes value: ${value}. Must be a positive number.`,
    );
  }
  return parsed;
}

const inputs: RunInputs = {
  renderToken: core.getInput('render-token', { required: true }),
  serviceId: core.getInput('service-id', { required: true }),
  waitForDeploy: core.getInput('wait-for-deploy') === 'true',
  timeoutMinutes: getTimeoutMinutes(),
  imageTag: core.getInput('image_tag') || undefined,
  commitId: core.getInput('commit_id') || undefined,
};

// Run the action
await run(inputs)
  .then((output) => {
    core.setOutput('deployment-id', output.deploymentId);
  })
  .catch((error: unknown) => {
    core.setFailed(error instanceof Error ? error.message : String(error));
  });
