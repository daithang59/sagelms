resource "google_storage_bucket" "managed" {
  #checkov:skip=CKV_GCP_62:Application/demo buckets rely on Cloud Audit Logs; dedicated storage access log buckets are out of scope for this baseline.
  for_each = var.bucket_suffixes

  project                     = var.project_id
  name                        = "${var.name_prefix}-${each.value}"
  location                    = var.region
  force_destroy               = false
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = var.labels

  versioning {
    enabled = true
  }

  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_age_days == null ? [] : [var.lifecycle_age_days]

    content {
      action {
        type = "Delete"
      }

      condition {
        age = lifecycle_rule.value
      }
    }
  }
}
