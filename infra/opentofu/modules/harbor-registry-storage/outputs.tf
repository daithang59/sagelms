output "bucket_name" {
  description = "Harbor registry GCS bucket name."
  value       = google_storage_bucket.registry.name
}

output "bucket_url" {
  description = "Harbor registry GCS bucket URL."
  value       = "gs://${google_storage_bucket.registry.name}"
}

output "service_account_email" {
  description = "Google service account email used by Harbor registry."
  value       = google_service_account.registry.email
}

output "service_account_name" {
  description = "Fully qualified Google service account resource name."
  value       = google_service_account.registry.name
}

output "workload_identity_member" {
  description = "Kubernetes principal granted workloadIdentityUser on the Harbor registry Google service account."
  value       = google_service_account_iam_member.registry_workload_identity.member
}

output "ksa_namespace" {
  description = "Kubernetes namespace expected for the Harbor registry service account."
  value       = var.ksa_namespace
}

output "ksa_name" {
  description = "Kubernetes service account expected for the Harbor registry service account."
  value       = var.ksa_name
}
