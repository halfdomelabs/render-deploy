---
'render-deploy': minor
---

- **Breaking**: Renamed `timeout` input parameter to `timeout_minutes` for better clarity. The value is now specified in minutes instead of milliseconds (default changed from `1200000` ms to `20` minutes)
- Add `image_url` optional input to support deploying specific image tags for image-based services
- Add `commit_id` optional input to support deploying specific commit IDs for git-based services
- Fix HTTP status code validation logic that was incorrectly allowing non-2xx responses
