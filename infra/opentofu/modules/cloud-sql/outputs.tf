output "instance_name" {
  description = "Cloud SQL instance name."
  value       = var.enabled ? google_sql_database_instance.main[0].name : null
}

output "private_ip_address" {
  description = "Cloud SQL private IP address."
  value       = var.enabled ? google_sql_database_instance.main[0].private_ip_address : null
}

output "connection_name" {
  description = "Cloud SQL connection name."
  value       = var.enabled ? google_sql_database_instance.main[0].connection_name : null
}

output "database_name" {
  description = "Application database name."
  value       = var.enabled ? google_sql_database.main[0].name : null
}

output "db_usernames" {
  description = "Planned DB usernames. Password/user creation is intentionally outside OpenTofu."
  value       = sort(tolist(var.db_users))
}

output "secret_names_for_passwords" {
  description = "Secret names expected to hold DB user passwords."
  value = {
    for username in var.db_users :
    username => "${var.name_prefix}-db-${replace(trimprefix(username, "sagelms_"), "_", "-")}-password"
  }
}
