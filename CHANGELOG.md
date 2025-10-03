# render-deploy

## 0.2.1

### Patch Changes

- f66fef0: Fix casing of inputs for image_url -> image-url and timeout_minutes to timeout-minutes

## 0.2.0

### Minor Changes

- 2df2439: - **Breaking**: Renamed `timeout` input parameter to `timeout_minutes` for better clarity. The value is now specified in minutes instead of milliseconds (default changed from `1200000` ms to `20` minutes)
  - Add `image_url` optional input to support deploying specific image tags for image-based services
  - Add `commit_id` optional input to support deploying specific commit IDs for git-based services
  - Fix HTTP status code validation logic that was incorrectly allowing non-2xx responses

### Patch Changes

- efa6f3f: Upgrade dev dependencies to use newer version of linting/prettier/typescript
- efa6f3f: Upgrade Node to Node 24

## 0.1.2

### Patch Changes

- e9eb383: Upgrade setup-pnpm and changesets action
- 053f920: Upgrade undici to address security issue

## 0.1.1

### Patch Changes

- dcd6b10: Handle pre-deploy statuses
- c4ad955: Upgrade dependencies and add changesets
