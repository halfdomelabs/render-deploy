import * as core from '@actions/core';

import type { RenderDeployment } from './render.js';

import {
  createRenderDeployment,
  FAILURE_STATUSES,
  getRenderDeployment,
  getRenderService,
} from './render.js';

export interface DeployServiceInput {
  renderToken: string;
  serviceId: string;
  waitForDeploy: boolean;
  timeoutMinutes: number;
  imageUrl?: string;
  commitId?: string;
}

export interface DeployServiceOutput {
  deploymentId: string;
}

/**
 * The main function for the action.
 * @param inputs - The inputs for the action.
 * @returns The deployment ID.
 * @throws An error if the deployment fails.
 * @throws An error if the service is suspended.
 * @throws An error if the deployment times out.
 */
export async function deployService(
  inputs: DeployServiceInput,
): Promise<DeployServiceOutput> {
  const {
    renderToken,
    serviceId,
    waitForDeploy,
    timeoutMinutes,
    imageUrl,
    commitId,
  } = inputs;

  // fetch service info
  core.info(`Fetching service info for ${serviceId}...`);
  const renderService = await getRenderService(serviceId, renderToken);

  if (renderService.suspended === 'suspended') {
    throw new Error('Render service is suspended');
  }

  // create deployment
  core.info(`Creating deployment for ${renderService.name}...`);
  const newDeployment = await createRenderDeployment(serviceId, renderToken, {
    imageUrl,
    commitId,
  });

  if (waitForDeploy) {
    // wait for deployment to finish
    let deployment: RenderDeployment;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    core.info(`Waiting for deployment to finish...`);
    const start = Date.now();
    do {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      deployment = await getRenderDeployment(
        serviceId,
        newDeployment.id,
        renderToken,
      );
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

  return { deploymentId: newDeployment.id };
}
