resource "google_redis_instance" "main" {
  count = var.enabled ? 1 : 0

  project                 = var.project_id
  name                    = "${var.name_prefix}-redis"
  display_name            = "SageLMS DevSecOps Redis"
  region                  = var.region
  tier                    = var.tier
  memory_size_gb          = var.memory_size_gb
  redis_version           = var.redis_version
  authorized_network      = var.network_self_link
  connect_mode            = "PRIVATE_SERVICE_ACCESS"
  auth_enabled            = var.auth_enabled
  transit_encryption_mode = var.transit_encryption_mode
  location_id             = var.location_id
  alternative_location_id = var.alternative_location_id
  labels                  = var.labels
}
