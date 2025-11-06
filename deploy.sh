#!/bin/bash

# IBA Touch ID Authentication Deployment Script
# Run this to deploy the new biometric authentication system

echo "🚀 IBA Touch ID Authentication Deployment"
echo "=========================================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged in
echo "📝 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null
then
    echo "🔐 Please login to Firebase..."
    firebase login
fi

# Confirm deployment
echo ""
echo "⚠️  WARNING: This will deploy to PRODUCTION"
echo "   Site: https://ibapurdue.online"
echo ""
read -p "Continue with deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Set the project
echo ""
echo "🎯 Setting Firebase project..."
firebase use iba-website-63cb3

# Deploy
echo ""
echo "📦 Deploying Functions, Firestore Rules, and Hosting..."
echo ""
firebase deploy --only functions,firestore:rules,hosting

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🧪 Testing Instructions:"
    echo "1. Visit: https://ibapurdue.online"
    echo "2. Click 'Admin' button (bottom-right)"
    echo "3. Click '🔐 Use Touch ID / Face ID'"
    echo "4. First time: Enter email/password"
    echo "5. Authenticate with Touch ID/Face ID"
    echo ""
    echo "📊 Monitor Functions:"
    echo "   https://console.firebase.google.com/project/iba-website-63cb3/functions"
    echo ""
    echo "⚠️  If something goes wrong, run: ./rollback.sh"
else
    echo ""
    echo "❌ DEPLOYMENT FAILED!"
    echo "Check the errors above and try again."
    exit 1
fi
