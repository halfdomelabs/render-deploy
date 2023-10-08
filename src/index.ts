import * as core from '@actions/core';
import { run } from './main.js';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run().catch((error) => {
  if (error instanceof Error) core.setFailed(error.message);
});
