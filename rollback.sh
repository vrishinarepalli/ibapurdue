#!/bin/bash

# IBA Rollback Script
# Run this if the Touch ID deployment causes issues

echo "⚠️  IBA EMERGENCY ROLLBACK"
echo "=========================="
echo ""
echo "This will restore your site to the previous version (main branch)"
echo ""
read -p "Continue with rollback? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

echo ""
echo "🔄 Switching to main branch..."
git checkout main

echo ""
echo "📦 Redeploying from main branch..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ROLLBACK SUCCESSFUL!"
    echo "   Your site has been restored to the main branch version"
    echo ""
    echo "🔍 Check your site: https://ibapurdue.online"
    echo ""
    echo "Note: Functions may still be active. To remove them:"
    echo "   Visit: https://console.firebase.google.com/project/iba-website-63cb3/functions"
    echo "   Delete the 5 new functions manually if needed"
else
    echo ""
    echo "❌ ROLLBACK FAILED!"
    echo "Manual steps:"
    echo "1. Go to Firebase Console"
    echo "2. Hosting → View releases"
    echo "3. Click 'Rollback' on previous version"
    exit 1
fi
