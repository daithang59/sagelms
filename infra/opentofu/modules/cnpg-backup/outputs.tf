output "bucket_name" {
  description = "CloudNativePG backup bucket name."
  value       = google_storage_bucket.backup.name
}

output "bucket_url" {
  description = "CloudNativePG backup bucket URL."
  value       = "gs://${google_storage_bucket.backup.name}"
}

output "object_store_destination_path" {
  description = "Destination path for the CloudNativePG/Barman object store."
  value       = "gs://${google_storage_bucket.backup.name}/${var.object_prefix}"
}

output "service_account_email" {
  description = "Google service account email used by CloudNativePG backup."
  value       = google_service_account.backup.email
}

output "service_account_name" {
  description = "Fully qualified Google service account resource name."
  value       = google_service_account.backup.name
}

output "workload_identity_member" {
  description = "Kubernetes principal granted workloadIdentityUser on the backup Google service account."
  value       = google_service_account_iam_member.backup_workload_identity.member
}

output "ksa_namespace" {
  description = "Kubernetes namespace expected for the CloudNativePG backup service account."
  value       = var.ksa_namespace
}

output "ksa_name" {
  description = "Kubernetes service account expected for the CloudNativePG backup service account."
  value       = var.ksa_name
}
