output "instance_name" {
  description = "Redis instance name."
  value       = var.enabled ? google_redis_instance.main[0].name : null
}

output "host" {
  description = "Redis host."
  value       = var.enabled ? google_redis_instance.main[0].host : null
}

output "port" {
  description = "Redis port."
  value       = var.enabled ? google_redis_instance.main[0].port : null
}

output "current_location_id" {
  description = "Current Redis primary location."
  value       = var.enabled ? google_redis_instance.main[0].current_location_id : null
}

output "alternative_location_id" {
  description = "Redis alternative location."
  value       = var.enabled ? google_redis_instance.main[0].alternative_location_id : null
}

output "auth_string" {
  description = "Generated Redis AUTH string. Store it in Secret Manager outside OpenTofu workflows."
  value       = var.enabled && var.auth_enabled ? google_redis_instance.main[0].auth_string : null
  sensitive   = true
}

output "secret_names_for_connection_info" {
  description = "Secret names expected to hold Redis connection data."
  value = {
    host     = "${var.name_prefix}-redis-host"
    port     = "${var.name_prefix}-redis-port"
    password = "${var.name_prefix}-redis-password"
  }
}
