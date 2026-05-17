locals {
  secret_ids = toset([for suffix in var.secret_suffixes : "${var.name_prefix}-${suffix}"])
}

resource "google_secret_manager_secret" "managed" {
  for_each = local.secret_ids

  project   = var.project_id
  secret_id = each.value
  labels    = var.labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_iam_member" "eso_accessor" {
  for_each = var.grant_eso_access ? google_secret_manager_secret.managed : {}

  project   = var.project_id
  secret_id = each.value.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.eso_service_account_email}"
}
