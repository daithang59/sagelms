resource "google_storage_bucket" "registry" {
  #checkov:skip=CKV_GCP_62:Harbor registry bucket relies on project-level Cloud Audit Logs for this project baseline.
  project                     = var.project_id
  name                        = var.bucket_name
  location                    = var.region
  force_destroy               = var.force_destroy
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = var.labels

  dynamic "logging" {
    for_each = var.log_bucket_name == null ? [] : [var.log_bucket_name]

    content {
      log_bucket        = logging.value
      log_object_prefix = var.log_object_prefix
    }
  }

  versioning {
    enabled = var.versioning_enabled
  }
}

resource "google_service_account" "registry" {
  project      = var.project_id
  account_id   = var.service_account_id
  display_name = "SageLMS Harbor Registry GCS"
  description  = "Service account used by Harbor registry to store image blobs in GCS through GKE Workload Identity."
}

resource "google_storage_bucket_iam_member" "registry_object_admin" {
  bucket = google_storage_bucket.registry.name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${google_service_account.registry.email}"
}

resource "google_storage_bucket_iam_member" "registry_bucket_reader" {
  bucket = google_storage_bucket.registry.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.registry.email}"
}

resource "google_service_account_iam_member" "registry_workload_identity" {
  service_account_id = google_service_account.registry.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${var.ksa_namespace}/${var.ksa_name}]"
}
