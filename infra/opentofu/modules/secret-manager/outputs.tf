output "secret_ids" {
  description = "Secret Manager secret IDs."
  value       = sort(keys(google_secret_manager_secret.managed))
}

output "secret_resource_names" {
  description = "Secret Manager resource names."
  value       = { for id, secret in google_secret_manager_secret.managed : id => secret.name }
}
