import * as core from '@actions/core';

import { run } from './main.js';

await run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
