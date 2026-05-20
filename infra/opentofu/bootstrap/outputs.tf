output "state_bucket_name" {
  description = "GCS bucket used by the main OpenTofu backend."
  value       = google_storage_bucket.state.name
}

output "iac_service_account_email" {
  description = "Service account used for later OpenTofu applies."
  value       = google_service_account.iac.email
}
