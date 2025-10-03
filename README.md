# Render Deploy Action

A GitHub Action for deploying services to [Render](https://render.com) and optionally waiting for the deployment to complete.

## Features

- 🚀 Trigger deployments for any Render service
- ⏳ Wait for deployment completion with configurable timeout
- 🐳 Support for Docker image deployments
- 📊 Detailed deployment status logging
- ✅ Returns deployment ID for further workflow steps

## Prerequisites

- A [Render](https://render.com) account with an active service
- A Render API token ([how to create one](https://docs.render.com/api#creating-an-api-key))
- Your Render service ID (found in your service's dashboard URL or settings)

## Usage

### Basic Deployment

```yaml
name: Deploy to Render
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: halfdomelabs/render-deploy@v1
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          render-token: ${{ secrets.RENDER_API_TOKEN }}
```

### Docker Image Deployment

```yaml
- name: Deploy Docker Image to Render
  uses: halfdomelabs/render-deploy@v1
  with:
    service-id: ${{ secrets.RENDER_SERVICE_ID }}
    render-token: ${{ secrets.RENDER_API_TOKEN }}
    image-url: ghcr.io/your-org/your-app:${{ github.sha }}
```

### Deploy Without Waiting

```yaml
- name: Trigger Render Deployment
  uses: halfdomelabs/render-deploy@v1
  with:
    service-id: ${{ secrets.RENDER_SERVICE_ID }}
    render-token: ${{ secrets.RENDER_API_TOKEN }}
    wait-for-deploy: 'false'
```

### Custom Timeout

```yaml
- name: Deploy with Extended Timeout
  uses: halfdomelabs/render-deploy@v1
  with:
    service-id: ${{ secrets.RENDER_SERVICE_ID }}
    render-token: ${{ secrets.RENDER_API_TOKEN }}
    timeout-minutes: '30'
```

## Inputs

| Input             | Description                                                 | Required | Default |
| ----------------- | ----------------------------------------------------------- | -------- | ------- |
| `service-id`      | The ID of the Render service to deploy                      | Yes      | -       |
| `render-token`    | Your Render API token                                       | Yes      | -       |
| `wait-for-deploy` | Whether to wait for the deployment to finish                | No       | `true`  |
| `timeout-minutes` | Maximum time to wait for deployment completion (in minutes) | No       | `20`    |
| `image-url`       | Docker image URL to deploy (for image-based services)       | No       | -       |
| `commit-id`       | Specific commit ID to deploy                                | No       | -       |

## Outputs

| Output          | Description                      |
| --------------- | -------------------------------- |
| `deployment-id` | The ID of the created deployment |

### Using Outputs

```yaml
- name: Deploy to Render
  id: deploy
  uses: halfdomelabs/render-deploy@v1
  with:
    service-id: ${{ secrets.RENDER_SERVICE_ID }}
    render-token: ${{ secrets.RENDER_API_TOKEN }}

- name: Use deployment ID
  run: echo "Deployment ID: ${{ steps.deploy.outputs.deployment-id }}"
```

## Setup

### 1. Get Your Render API Token

1. Log in to your [Render Dashboard](https://dashboard.render.com)
2. Go to Account Settings → API Keys
3. Click "Create API Key"
4. Copy the generated token

### 2. Get Your Service ID

Your service ID can be found in:

- The service dashboard URL: `https://dashboard.render.com/web/srv-XXXXX` (the `srv-XXXXX` part)
- Your service's Settings page

### 3. Add Secrets to GitHub

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `RENDER_API_TOKEN`: Your Render API token
   - `RENDER_SERVICE_ID`: Your Render service ID

## Troubleshooting

### Service Suspended Error

If you receive a "Render service is suspended" error, check your Render dashboard to ensure your service is active and not suspended due to billing issues.

### Deployment Timeout

If deployments consistently timeout:

- Increase the `timeout_minutes` value
- Check your Render service logs for deployment issues
- Verify your build configuration is optimized

### Authentication Failed

Ensure your `RENDER_API_TOKEN` is:

- Valid and not expired
- Has the correct permissions for the service
- Stored correctly in GitHub Secrets

## License

MIT

## Author

Half Dome Labs LLC
