# Open Repository Guide

This public repository contains the local application, the Cloudflare Worker
edition, validation materials, and the technical documentation needed to
inspect and reproduce the project.

## Contents

- `server.mjs`, `public/`, and `resources/`: local edition.
- `cloudflare/`: Worker source and deployment configuration. Install its
  dependencies before deploying; no credentials are stored in this repository.
- `validation/`: validation reports, test pages, comparison data, and scripts.
- `Web_Readability_Radar_technical_documentation.pdf`: technical documentation.

## Local use

Use `launch-windows.bat` on Windows. For macOS and Linux, follow `MACOS.md`.
The portable Node runtime is deliberately excluded from the public repository;
install Node.js 18 or later when it is not already available.

## Cloudflare use

From `cloudflare/`, install dependencies and deploy with Wrangler after
authenticating to your own Cloudflare account. The deployed edition has
platform-specific limits; document any change to those limits in a release.

## Privacy and security

Do not commit credentials, Cloudflare API tokens, account identifiers, user
inputs, or analysis results containing personal data. The `.gitignore` file
excludes common local and deployment artifacts.

