import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DeployServiceInput } from './deploy-service.js';
import type { RenderDeployment, RenderService } from './render.js';

import { deployService } from './deploy-service.js';
import * as render from './render.js';

// Mock timers
vi.useFakeTimers();

// Mock the render module
vi.mock('./render.js', async () => {
  const actual = await vi.importActual('./render.js');
  return {
    ...actual,
    getRenderService: vi.fn(),
    createRenderDeployment: vi.fn(),
    getRenderDeployment: vi.fn(),
  };
});

// Mock @actions/core
vi.mock('@actions/core', () => ({
  info: vi.fn(),
  setOutput: vi.fn(),
  getInput: vi.fn(),
  setFailed: vi.fn(),
}));

describe('deployService', () => {
  const mockService: RenderService = {
    id: 'srv-123',
    autoDeploy: 'yes',
    branch: 'main',
    name: 'test-service',
    repo: 'https://github.com/test/repo',
    suspended: 'not_suspended',
    type: 'web_service',
  };

  const mockDeployment: RenderDeployment = {
    id: 'dep-456',
    commit: {
      id: 'abc123',
      message: 'test commit',
      createdAt: '2025-01-01T00:00:00Z',
    },
    status: 'created',
    finishedAt: '2025-01-01T00:05:00Z',
    createdAt: '2025-01-01T00:00:00Z',
  };

  const defaultInputs: DeployServiceInput = {
    renderToken: 'test-token',
    serviceId: 'srv-123',
    waitForDeploy: false,
    timeoutMinutes: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic deployment', () => {
    it('should create a deployment without waiting', async () => {
      vi.mocked(render.getRenderService).mockResolvedValue(mockService);
      vi.mocked(render.createRenderDeployment).mockResolvedValue(
        mockDeployment,
      );

      const result = await deployService(defaultInputs);

      expect(render.getRenderService).toHaveBeenCalledWith(
        'srv-123',
        'test-token',
      );
      expect(render.createRenderDeployment).toHaveBeenCalledWith(
        'srv-123',
        'test-token',
        {
          imageUrl: undefined,
          commitId: undefined,
        },
      );
      expect(result).toEqual({ deploymentId: 'dep-456' });
      expect(render.getRenderDeployment).not.toHaveBeenCalled();
    });

    it('should create a deployment with image tag', async () => {
      vi.mocked(render.getRenderService).mockResolvedValue(mockService);
      vi.mocked(render.createRenderDeployment).mockResolvedValue(
        mockDeployment,
      );

      const inputs: DeployServiceInput = {
        ...defaultInputs,
        imageTag: 'v1.2.3',
      };

      await deployService(inputs);

      expect(render.createRenderDeployment).toHaveBeenCalledWith(
        'srv-123',
        'test-token',
        {
          imageUrl: 'v1.2.3',
          commitId: undefined,
        },
      );
    });

    it('should create a deployment with commit id', async () => {
      vi.mocked(render.getRenderService).mockResolvedValue(mockService);
      vi.mocked(render.createRenderDeployment).mockResolvedValue(
        mockDeployment,
      );

      const inputs: DeployServiceInput = {
        ...defaultInputs,
        commitId: 'abc123',
      };

      await deployService(inputs);

      expect(render.createRenderDeployment).toHaveBeenCalledWith(
        'srv-123',
        'test-token',
        {
          imageUrl: undefined,
          commitId: 'abc123',
        },
      );
    });
  });

  describe('service validation', () => {
    it('should throw error if service is suspended', async () => {
      const suspendedService: RenderService = {
        ...mockService,
        suspended: 'suspended',
      };

      vi.mocked(render.getRenderService).mockResolvedValue(suspendedService);

      await expect(deployService(defaultInputs)).rejects.toThrow(
        'Render service is suspended',
      );
      expect(render.createRenderDeployment).not.toHaveBeenCalled();
    });
  });

  describe('wait for deployment', () => {
    it('should wait for deployment to become live', async () => {
      const inputs: DeployServiceInput = {
        ...defaultInputs,
        waitForDeploy: true,
        timeoutMinutes: 5,
      };

      vi.mocked(render.getRenderService).mockResolvedValue(mockService);
      vi.mocked(render.createRenderDeployment).mockResolvedValue(
        mockDeployment,
      );

      // Simulate deployment progression
      vi.mocked(render.getRenderDeployment)
        .mockResolvedValueOnce({
          ...mockDeployment,
          status: 'build_in_progress',
        })
        .mockResolvedValueOnce({
          ...mockDeployment,
          status: 'update_in_progress',
        })
        .mockResolvedValueOnce({
          ...mockDeployment,
          status: 'live',
        });

      const runPromise = deployService(inputs);

      // Fast-forward through the setTimeout calls
      await vi.runAllTimersAsync();

      const result = await runPromise;

      expect(render.getRenderDeployment).toHaveBeenCalledTimes(3);
      expect(render.getRenderDeployment).toHaveBeenCalledWith(
        'srv-123',
        'dep-456',
        'test-token',
      );
      expect(result).toEqual({ deploymentId: 'dep-456' });
    });

    it('should throw error on failed deployment status', async () => {
      const inputs: DeployServiceInput = {
        ...defaultInputs,
        waitForDeploy: true,
      };

      vi.mocked(render.getRenderService).mockResolvedValue(mockService);
      vi.mocked(render.createRenderDeployment).mockResolvedValue(
        mockDeployment,
      );

      vi.mocked(render.getRenderDeployment).mockResolvedValue({
        ...mockDeployment,
        status: 'build_failed',
      });

      const runPromise = deployService(inputs).catch((e: unknown) => e);
      await vi.runAllTimersAsync();

      const result = await runPromise;
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe(
        'Render deployment failed: build_failed',
      );
    });

    it('should timeout if deployment takes too long', async () => {
      const inputs: DeployServiceInput = {
        ...defaultInputs,
        waitForDeploy: true,
        timeoutMinutes: 1, // 1 minute timeout
      };

      vi.mocked(render.getRenderService).mockResolvedValue(mockService);
      vi.mocked(render.createRenderDeployment).mockResolvedValue(
        mockDeployment,
      );

      // Always return in_progress status
      vi.mocked(render.getRenderDeployment).mockResolvedValue({
        ...mockDeployment,
        status: 'build_in_progress',
      });

      const runPromise = deployService(inputs).catch((e: unknown) => e);
      await vi.runAllTimersAsync();

      const result = await runPromise;
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe(
        'Render deployment timed out after 1 minutes',
      );
    });
  });
});
