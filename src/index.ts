import * as core from '@actions/core';

import type { DeployServiceInput } from './deploy-service.js';

import { deployService } from './deploy-service.js';

// Extract inputs from GitHub Actions context
function getTimeoutMinutes(): number {
  const value = core.getInput('timeout-minutes');
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid timeout-minutes value: ${value}. Must be a positive number.`,
    );
  }
  return parsed;
}

const inputs: DeployServiceInput = {
  renderToken: core.getInput('render-token', { required: true }),
  serviceId: core.getInput('service-id', { required: true }),
  waitForDeploy: core.getInput('wait-for-deploy') === 'true',
  timeoutMinutes: getTimeoutMinutes(),
  imageUrl: core.getInput('image-url') || undefined,
  commitId: core.getInput('commit-id') || undefined,
};

// Run the action
await deployService(inputs)
  .then((output) => {
    core.setOutput('deployment-id', output.deploymentId);
  })
  .catch((error: unknown) => {
    core.setFailed(error instanceof Error ? error.message : String(error));
    throw error;
  });
