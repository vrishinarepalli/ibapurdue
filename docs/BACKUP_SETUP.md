# 🔄 Firestore Automated Backup Setup

Your backup function is deployed! Follow these steps to enable daily automated backups.

## ✅ What's Already Done:
- ✅ Backup Cloud Function deployed
- ✅ Cloud Storage bucket exists (`iba-website-63cb3.appspot.com`)

## 📋 Setup Steps (5 minutes):

### **Step 1: Enable Required APIs**

Open Google Cloud Console:
https://console.cloud.google.com/apis/dashboard?project=iba-website-63cb3

Click "Enable APIs and Services" and enable:
1. **Cloud Scheduler API**
2. **App Engine Admin API**

### **Step 2: Create App Engine App** (Required for Cloud Scheduler)

Open this link:
https://console.cloud.google.com/appengine?project=iba-website-63cb3

- Click "Create Application"
- Select region: **us-central** (recommended)
- Click "Create"

### **Step 3: Create Cloud Scheduler Job**

Open Cloud Scheduler:
https://console.cloud.google.com/cloudscheduler?project=iba-website-63cb3

Click **"Create Job"** and enter:

```
Name: firestore-daily-backup
Region: us-central1
Frequency: 0 2 * * *
Timezone: (UTC-05:00) Eastern Time
Target type: HTTP
URL: https://us-central1-iba-website-63cb3.cloudfunctions.net/scheduledFirestoreExport
HTTP method: GET
```

Click **"Create"**

### **Step 4: Test the Backup**

In Cloud Scheduler, find your job and click **"RUN NOW"**

Check if it worked:
https://console.cloud.google.com/storage/browser/iba-website-63cb3.appspot.com?project=iba-website-63cb3

You should see a folder: `firestore-backups/YYYY-MM-DD/`

---

## 📊 Backup Details:

| Setting | Value |
|---------|-------|
| **Schedule** | Daily at 2:00 AM EST |
| **Storage Location** | `gs://iba-website-63cb3.appspot.com/firestore-backups/` |
| **Backup Format** | Firestore export format (date-stamped folders) |
| **Retention** | Manual deletion (free tier: 5 GB) |
| **Cost** | ~$0.026/GB/month (Storage) + $0.10/job (Scheduler) |

## 💰 Cost Estimate:

**Free Tier:**
- Cloud Scheduler: 3 jobs/month free (you're using 1)
- Cloud Storage: 5 GB free
- Function calls: 2M invocations/month free

**Typical Costs (after free tier):**
- 100 MB database backup daily = 3 GB/month storage = **$0.08/month**
- Cloud Scheduler = **$0.10/month**
- **Total: ~$0.18/month** ($2.16/year)

## 🔍 View Backups:

**Storage Browser:**
https://console.cloud.google.com/storage/browser/iba-website-63cb3.appspot.com/firestore-backups?project=iba-website-63cb3

**Backups are organized by date:**
```
firestore-backups/
  ├── 2025-01-15/
  ├── 2025-01-16/
  └── 2025-01-17/
```

## 🔄 Manual Backup:

To manually trigger a backup anytime:
1. Go to Cloud Scheduler: https://console.cloud.google.com/cloudscheduler?project=iba-website-63cb3
2. Click "RUN NOW" on the `firestore-daily-backup` job

## 📥 Restore from Backup:

If you ever need to restore data:

1. **Find the backup date:**
   ```
   https://console.cloud.google.com/storage/browser/iba-website-63cb3.appspot.com/firestore-backups
   ```

2. **Open Cloud Shell** (top-right icon in Google Cloud Console)

3. **Run restore command:**
   ```bash
   gcloud firestore import gs://iba-website-63cb3.appspot.com/firestore-backups/YYYY-MM-DD
   ```

   Replace `YYYY-MM-DD` with the backup date you want to restore.

## 🗑️ Cleanup Old Backups:

To save storage costs, you can delete old backups:

**Option 1: Manual deletion**
- Go to: https://console.cloud.google.com/storage/browser/iba-website-63cb3.appspot.com/firestore-backups
- Select old folders and click "Delete"

**Option 2: Auto-delete after 30 days** (Lifecycle rule)
1. Go to: https://console.cloud.google.com/storage/browser/iba-website-63cb3.appspot.com
2. Click "Lifecycle" tab
3. Add rule: Delete objects older than 30 days with prefix `firestore-backups/`

---

## 🆘 Troubleshooting:

**Job fails with "Permission denied":**
- Go to: https://console.cloud.google.com/iam-admin/iam?project=iba-website-63cb3
- Find: `iba-website-63cb3@appspot.gserviceaccount.com`
- Add role: "Cloud Datastore Import Export Admin"

**No backups appearing:**
- Check Cloud Scheduler logs: https://console.cloud.google.com/logs/query?project=iba-website-63cb3
- Look for errors from `scheduledFirestoreExport`

**Out of storage:**
- Check usage: https://console.cloud.google.com/storage/browser?project=iba-website-63cb3
- Delete old backups to free space

---

## ✅ Next Steps:

After setup is complete, your database will automatically backup daily. You can:
- ✅ Set it and forget it
- 📊 Monitor backups monthly
- 🗑️ Clean up backups older than 30-90 days

**Your data is now protected!** 🎉
