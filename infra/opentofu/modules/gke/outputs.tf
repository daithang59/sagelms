output "cluster_name" {
  description = "GKE cluster name."
  value       = google_container_cluster.main.name
}

output "cluster_location" {
  description = "GKE cluster location."
  value       = google_container_cluster.main.location
}

output "cluster_endpoint" {
  description = "GKE control plane endpoint."
  value       = google_container_cluster.main.endpoint
  sensitive   = true
}

output "node_pool_name" {
  description = "Main node pool name."
  value       = google_container_node_pool.main.name
}

output "node_service_account_email" {
  description = "GKE node service account email."
  value       = google_service_account.nodes.email
}

output "workload_identity_pool" {
  description = "GKE workload identity pool."
  value       = "${var.project_id}.svc.id.goog"
}
