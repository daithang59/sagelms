variable "enabled" {
  description = "Whether to provision Cloud SQL."
  type        = bool
  default     = true
}

variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "Cloud SQL region."
  type        = string
}

variable "name_prefix" {
  description = "Resource naming prefix."
  type        = string
}

variable "labels" {
  description = "Labels applied to Cloud SQL resources."
  type        = map(string)
  default     = {}
}

variable "network_self_link" {
  description = "VPC self link for private IP."
  type        = string
}

variable "private_service_access_connection_id" {
  description = "Private Service Access connection id from the network module."
  type        = string
}

variable "database_version" {
  description = "Cloud SQL PostgreSQL version."
  type        = string
  default     = "POSTGRES_16"
}

variable "tier" {
  description = "Cloud SQL machine tier."
  type        = string
  default     = "db-custom-2-7680"
}

variable "availability_type" {
  description = "Cloud SQL availability type."
  type        = string
  default     = "ZONAL"
}

variable "disk_size_gb" {
  description = "Initial disk size in GB."
  type        = number
  default     = 50
}

variable "database_name" {
  description = "Application database name."
  type        = string
  default     = "sagelms"
}

variable "db_users" {
  description = "Application database usernames. Passwords are created outside OpenTofu."
  type        = set(string)
  default = [
    "sagelms_auth",
    "sagelms_course",
    "sagelms_content",
    "sagelms_progress",
    "sagelms_assessment",
    "sagelms_ai_tutor",
  ]
}

variable "point_in_time_recovery_enabled" {
  description = "Whether to enable PostgreSQL point-in-time recovery."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Terraform-level deletion protection for the Cloud SQL instance."
  type        = bool
  default     = true
}
