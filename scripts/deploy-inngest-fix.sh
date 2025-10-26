#!/bin/bash

# Inngest Production Fix Deployment Script

echo "🚀 Deploying Inngest Production Fixes..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Stage the changes
echo "📝 Staging changes..."
git add vercel.json
git add lib/inngest.ts
git add docs/INNGEST_PRODUCTION_SETUP.md

# Commit the changes
echo "💾 Committing changes..."
git commit -m "Fix Inngest production issues

- Increase function timeout for Inngest endpoint (300s)
- Update Inngest client configuration for production
- Add comprehensive production setup guide

Fixes: Inngest runs stuck at 'Running' status"

# Push to deploy
echo "🚀 Pushing to deploy..."
git push

echo "✅ Deployment initiated!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up Inngest Cloud account at https://inngest.com"
echo "2. Add environment variables to Vercel:"
echo "   - INNGEST_EVENT_KEY=your-event-key"
echo "   - INNGEST_SIGNING_KEY=your-signing-key"
echo "3. Configure webhook: https://yourdomain.com/api/inngest"
echo "4. Test bulk import on live domain"
echo ""
echo "📖 Full guide: docs/INNGEST_PRODUCTION_SETUP.md"
