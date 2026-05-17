output "enabled_services" {
  description = "Project services managed by this module."
  value       = sort([for service in google_project_service.required : service.service])
}
