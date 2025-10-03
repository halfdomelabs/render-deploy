import * as core from '@actions/core';

import type { RenderDeployment } from './render.js';

import {
  createRenderDeployment,
  FAILURE_STATUSES,
  getRenderDeployment,
  getRenderService,
} from './render.js';

/**
 * The main function for the action.
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const renderServiceId = core.getInput('service-id', {
    required: true,
  });
  const waitForDeploy = core.getInput('wait-for-deploy');
  const timeoutMinutes = core.getInput('timeout_minutes');
  const imageTag = core.getInput('image_tag');
  const commitId = core.getInput('commit_id');

  // fetch service info
  core.info(`Fetching service info for ${renderServiceId}...`);
  const renderService = await getRenderService(renderServiceId);

  if (renderService.suspended === 'suspended') {
    throw new Error('Render service is suspended');
  }

  // create deployment
  core.info(`Creating deployment for ${renderService.name}...`);
  const newDeployment = await createRenderDeployment(renderServiceId, {
    imageUrl: imageTag || undefined,
    commitId: commitId || undefined,
  });

  if (waitForDeploy === 'true') {
    // wait for deployment to finish
    let deployment: RenderDeployment;
    const timeoutMs = Number.parseInt(timeoutMinutes, 10) * 60 * 1000;

    if (Number.isNaN(timeoutMs) || timeoutMs <= 0) {
      throw new Error(
        `Invalid timeout_minutes value: ${timeoutMinutes}. Must be a positive number.`,
      );
    }

    core.info(`Waiting for deployment to finish...`);
    const start = Date.now();
    do {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      deployment = await getRenderDeployment(renderServiceId, newDeployment.id);
      if (FAILURE_STATUSES.includes(deployment.status)) {
        throw new Error(`Render deployment failed: ${deployment.status}`);
      }
      if (Date.now() - start > timeoutMs) {
        throw new Error(
          `Render deployment timed out after ${timeoutMinutes} minutes`,
        );
      }
    } while (deployment.status !== 'live');

    const duration = Math.round((Date.now() - start) / 1000);

    const durationMin = Math.floor(duration / 60);
    const durationSec = duration % 60;

    core.info(
      `Deployment successfully completed in ${durationMin} min and ${durationSec} sec!`,
    );
  }

  // Set deployment ID output
  core.setOutput('deployment-id', newDeployment.id);
}
