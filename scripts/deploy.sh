#!/bin/bash
set -e

echo "==> Building for Cloudflare Workers..."
npx opennextjs-cloudflare build

echo "==> Deploying to Cloudflare Workers..."
npx wrangler deploy

echo "==> Done! https://food-picker.sean22492249.workers.dev"
