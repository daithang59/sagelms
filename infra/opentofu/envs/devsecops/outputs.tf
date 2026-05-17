output "project_id" {
  description = "GCP project ID."
  value       = var.project_id
}

output "region" {
  description = "Default GCP region."
  value       = var.region
}

output "vpc_name" {
  description = "Custom VPC name."
  value       = module.network.vpc_name
}

output "subnet_name" {
  description = "Primary subnet name."
  value       = module.network.subnet_name
}

output "gke_cluster_name" {
  description = "GKE cluster name."
  value       = module.gke.cluster_name
}

output "gke_cluster_location" {
  description = "GKE cluster location."
  value       = module.gke.cluster_location
}

output "gke_node_pool_name" {
  description = "GKE main node pool name."
  value       = module.gke.node_pool_name
}

output "workload_identity_pool" {
  description = "GKE workload identity pool."
  value       = module.gke.workload_identity_pool
}

output "cloud_sql_instance_name" {
  description = "Cloud SQL instance name."
  value       = module.cloud_sql.instance_name
}

output "cloud_sql_private_ip_address" {
  description = "Cloud SQL private IP address."
  value       = module.cloud_sql.private_ip_address
}

output "cloud_sql_database_name" {
  description = "Cloud SQL database name."
  value       = module.cloud_sql.database_name
}

output "redis_instance_name" {
  description = "Redis instance name."
  value       = module.redis.instance_name
}

output "redis_host" {
  description = "Redis host."
  value       = module.redis.host
}

output "redis_port" {
  description = "Redis port."
  value       = module.redis.port
}

output "service_account_emails" {
  description = "Service account emails for handoff."
  value = {
    iac            = local.iac_service_account_email
    github_actions = module.iam.github_actions_service_account_email
    eso            = module.iam.eso_service_account_email
    flux           = module.iam.flux_service_account_email
    app_runtime    = module.iam.app_runtime_service_account_email
    gke_nodes      = module.gke.node_service_account_email
  }
}

output "github_wif_provider_name" {
  description = "GitHub Workload Identity Federation provider name."
  value       = module.iam.github_wif_provider_name
}

output "secret_ids" {
  description = "Secret Manager secret IDs."
  value       = module.secret_manager.secret_ids
}

output "namespaces" {
  description = "Namespace convention for the devsecops runtime."
  value       = local.namespaces
}
