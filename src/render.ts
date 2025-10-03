import type { HttpClientResponse } from '@actions/http-client';

import * as core from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/lib/auth.js';

async function makeRenderRequest<T>(
  endpoint: string,
  method: 'get' | 'post' | 'patch' | 'delete',
  data?: unknown,
  { retryAttemptsForGet = 2 }: { retryAttemptsForGet?: number } = {},
): Promise<T> {
  const renderApiKey = core.getInput('render-token', {
    required: true,
  });
  const client = new HttpClient('render-deploy-github-action', [
    new BearerCredentialHandler(renderApiKey),
  ]);
  const url = `https://api.render.com/v1/${endpoint}`;

  try {
    let result: HttpClientResponse;

    switch (method) {
      case 'get': {
        result = await client.get(url);
        break;
      }
      case 'post': {
        result = await client.post(url, JSON.stringify(data));
        break;
      }
      case 'patch': {
        result = await client.patch(url, JSON.stringify(data));
        break;
      }
      case 'delete': {
        result = await client.del(url);
        break;
      }
    }

    if (
      !result.message.statusCode ||
      result.message.statusCode < 200 ||
      result.message.statusCode >= 300
    ) {
      throw new Error(
        `Invalid status code from Render API: ${result.message.statusCode}`,
      );
    }
    const body = await result.readBody();
    return JSON.parse(body) as T;
  } catch (err) {
    // Retry GET requests automatically
    if (method === 'get' && retryAttemptsForGet && retryAttemptsForGet > 0) {
      core.info(
        `Encountered error while making GET request: ${
          err instanceof Error ? err.message : typeof err
        }`,
      );
      core.info(`Retrying GET request to ${url}...`);
      // wait one second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return makeRenderRequest<T>(endpoint, method, data, {
        retryAttemptsForGet: retryAttemptsForGet - 1,
      });
    }

    throw err;
  }
}

export interface RenderService {
  id: string;
  autoDeploy: 'yes' | 'no';
  branch: string;
  name: string;
  repo: string;
  suspended: 'suspended' | 'not_suspended';
  type:
    | 'static_site'
    | 'web_service'
    | 'background_worker'
    | 'private_service'
    | 'cron_job';
}

export async function getRenderService(
  serviceId: string,
): Promise<RenderService> {
  return makeRenderRequest<RenderService>(`services/${serviceId}`, 'get');
}

export type RenderDeploymentStatus =
  | 'created'
  | 'build_in_progress'
  | 'update_in_progress'
  | 'live'
  | 'deactivated'
  | 'build_failed'
  | 'update_failed'
  | 'pre_deploy_in_progress'
  | 'pre_deploy_failed'
  | 'canceled';

export const FAILURE_STATUSES = [
  'deactivated',
  'build_failed',
  'update_failed',
  'canceled',
  'pre_deploy_failed',
] as RenderDeploymentStatus[];

export interface RenderDeployment {
  id: string;
  commit: {
    id: string;
    message: string;
    createdAt: string;
  };
  status: RenderDeploymentStatus;
  finishedAt: string;
  createdAt: string;
}

export async function createRenderDeployment(
  serviceId: string,
  options: { imageUrl?: string; commitId?: string },
): Promise<RenderDeployment> {
  return makeRenderRequest<RenderDeployment>(
    `services/${serviceId}/deploys`,
    'post',
    options,
  );
}

export async function getRenderDeployment(
  serviceId: string,
  deploymentId: string,
): Promise<RenderDeployment> {
  return makeRenderRequest<RenderDeployment>(
    `services/${serviceId}/deploys/${deploymentId}`,
    'get',
  );
}
