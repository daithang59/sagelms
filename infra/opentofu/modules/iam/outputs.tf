output "github_actions_service_account_email" {
  description = "GitHub Actions service account email."
  value       = google_service_account.managed["github_actions"].email
}

output "eso_service_account_email" {
  description = "ESO service account email."
  value       = google_service_account.managed["eso"].email
}

output "eso_service_account_name" {
  description = "Fully qualified ESO service account resource name."
  value       = google_service_account.managed["eso"].name
}

output "flux_service_account_email" {
  description = "FluxCD service account email."
  value       = google_service_account.managed["flux"].email
}

output "app_runtime_service_account_email" {
  description = "Application runtime service account email."
  value       = google_service_account.managed["app_runtime"].email
}

output "github_wif_provider_name" {
  description = "Full resource name of the GitHub WIF provider."
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "eso_workload_identity_member" {
  description = "Kubernetes principal granted workloadIdentityUser for ESO."
  value       = "serviceAccount:${var.project_id}.svc.id.goog[${var.eso_ksa_namespace}/${var.eso_ksa_name}]"
}
