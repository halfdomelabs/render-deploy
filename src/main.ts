import * as core from '@actions/core';
import {
  FAILURE_STATUSES,
  RenderDeployment,
  createRenderDeployment,
  getRenderDeployment,
  getRenderService,
} from './render';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const renderServiceId = core.getInput('service-id', {
    required: true,
  });
  const waitForDeploy = core.getInput('wait-for-deploy');
  const timeout = core.getInput('timeout');

  // fetch service info
  core.info(`Fetching service info for ${renderServiceId}...`);
  const renderService = await getRenderService(renderServiceId);

  if (renderService.suspended === 'suspended') {
    throw new Error('Render service is suspended');
  }

  // create deployment
  core.info(`Creating deployment for ${renderService.name}...`);
  const newDeployment = await createRenderDeployment(renderServiceId);

  if (waitForDeploy === 'true') {
    // wait for deployment to finish
    let deployment: RenderDeployment;
    const timeoutInt = parseInt(timeout, 10);

    core.info(`Waiting for deployment to finish...`);
    const start = Date.now();
    do {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      deployment = await getRenderDeployment(renderServiceId, newDeployment.id);
      if (FAILURE_STATUSES.includes(deployment.status)) {
        throw new Error(`Render deployment failed: ${deployment.status}`);
      }
      if (Date.now() - start > timeoutInt) {
        throw new Error(`Render deployment timed out after ${timeoutInt}ms`);
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
