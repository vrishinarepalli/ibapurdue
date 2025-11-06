#!/bin/bash

# IBA Firestore Backup Setup Script
# This script sets up automated daily backups of your Firestore database

PROJECT_ID="iba-website-63cb3"
BUCKET_NAME="gs://${PROJECT_ID}.appspot.com/firestore-backups"

echo "🔄 Setting up Firestore automated backups..."
echo ""

echo "📋 Prerequisites:"
echo "  1. Google Cloud CLI (gcloud) must be installed"
echo "  2. You must be authenticated with: gcloud auth login"
echo "  3. Billing must be enabled on the project"
echo ""

read -p "Press Enter to continue or Ctrl+C to cancel..."

# Enable required APIs
echo ""
echo "1️⃣ Enabling required APIs..."
gcloud services enable cloudscheduler.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudfunctions.googleapis.com --project=$PROJECT_ID
gcloud services enable appengine.googleapis.com --project=$PROJECT_ID

# Create App Engine app (required for Cloud Scheduler)
echo ""
echo "2️⃣ Creating App Engine app (required for Cloud Scheduler)..."
gcloud app create --project=$PROJECT_ID --region=us-central || echo "App Engine app already exists"

# Deploy the backup function
echo ""
echo "3️⃣ Deploying backup Cloud Function..."
cd ../functions
firebase deploy --only functions:scheduledFirestoreExport

# Create the Cloud Scheduler job
echo ""
echo "4️⃣ Creating daily backup schedule (runs at 2 AM UTC)..."
gcloud scheduler jobs create http firestore-backup \
  --schedule="0 2 * * *" \
  --uri="https://us-central1-${PROJECT_ID}.cloudfunctions.net/scheduledFirestoreExport" \
  --http-method=GET \
  --project=$PROJECT_ID \
  --location=us-central1

echo ""
echo "✅ Backup setup complete!"
echo ""
echo "📊 Your backups will be stored at: $BUCKET_NAME"
echo "⏰ Backups run daily at 2:00 AM UTC"
echo ""
echo "To manually trigger a backup, run:"
echo "  gcloud scheduler jobs run firestore-backup --project=$PROJECT_ID --location=us-central1"
echo ""
echo "To view backups:"
echo "  gsutil ls $BUCKET_NAME"
