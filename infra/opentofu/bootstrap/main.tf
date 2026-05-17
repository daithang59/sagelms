locals {
  labels = {
    project    = "sagelms"
    env        = "devsecops"
    owner      = "thang"
    managed_by = "opentofu"
  }

  bootstrap_services = toset([
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "serviceusage.googleapis.com",
    "storage.googleapis.com",
  ])
}

resource "google_project_service" "bootstrap" {
  for_each = local.bootstrap_services

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_storage_bucket" "state" {
  #checkov:skip=CKV_GCP_62:State bucket access is covered by Cloud Audit Logs; separate access-log bucket is out of scope for the shared demo baseline.
  name                        = var.state_bucket_name
  project                     = var.project_id
  location                    = var.region
  force_destroy               = false
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = local.labels

  versioning {
    enabled = true
  }

  depends_on = [google_project_service.bootstrap]
}

resource "google_service_account" "iac" {
  project      = var.project_id
  account_id   = "${var.name_prefix}-iac-sa"
  display_name = "SageLMS DevSecOps IaC service account"
  description  = "Used by OpenTofu to provision the SageLMS DevSecOps cloud foundation."

  depends_on = [google_project_service.bootstrap]
}

resource "google_storage_bucket_iam_member" "iac_state_object_admin" {
  bucket = google_storage_bucket.state.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.iac.email}"
}

resource "google_storage_bucket_iam_member" "iac_state_bucket_reader" {
  bucket = google_storage_bucket.state.name
  role   = "roles/storage.legacyBucketReader"
  member = "serviceAccount:${google_service_account.iac.email}"
}

resource "google_project_iam_member" "iac_project_roles" {
  #checkov:skip=CKV_GCP_49:The bootstrap IaC service account needs temporary service account administration to create workload identities; this should be narrowed after the demo foundation stabilizes.
  for_each = var.iac_project_roles

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.iac.email}"
}
