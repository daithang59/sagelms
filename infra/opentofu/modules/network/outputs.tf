output "vpc_name" {
  description = "Custom VPC name."
  value       = google_compute_network.main.name
}

output "vpc_self_link" {
  description = "Custom VPC self link."
  value       = google_compute_network.main.self_link
}

output "subnet_name" {
  description = "Primary subnet name."
  value       = google_compute_subnetwork.main.name
}

output "subnet_self_link" {
  description = "Primary subnet self link."
  value       = google_compute_subnetwork.main.self_link
}

output "pods_range_name" {
  description = "GKE Pods secondary range name."
  value       = var.pods_range_name
}

output "services_range_name" {
  description = "GKE Services secondary range name."
  value       = var.services_range_name
}

output "private_service_access_range_name" {
  description = "Reserved range name for Private Service Access."
  value       = google_compute_global_address.private_service_access.name
}

output "private_service_access_connection_id" {
  description = "Private Service Access connection id."
  value       = google_service_networking_connection.private_service_access.id
}
