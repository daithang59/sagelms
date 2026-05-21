resource "google_storage_bucket" "backup" {
  #checkov:skip=CKV_GCP_62:CloudNativePG backup bucket relies on project-level Cloud Audit Logs for this project baseline.
  project                     = var.project_id
  name                        = var.bucket_name
  location                    = var.region
  force_destroy               = var.force_destroy
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = var.labels

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }

    condition {
      age = var.retention_days
    }
  }
}

resource "google_service_account" "backup" {
  project      = var.project_id
  account_id   = var.service_account_id
  display_name = "SageLMS CloudNativePG Backup"
  description  = "Service account used by CloudNativePG to write and restore PostgreSQL backups from GCS."
}

resource "google_storage_bucket_iam_member" "backup_object_admin" {
  bucket = google_storage_bucket.backup.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.backup.email}"
}

resource "google_storage_bucket_iam_member" "backup_bucket_reader" {
  bucket = google_storage_bucket.backup.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.backup.email}"
}

resource "google_service_account_iam_member" "backup_workload_identity" {
  service_account_id = google_service_account.backup.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.ksa_namespace}/${var.ksa_name}]"
}
