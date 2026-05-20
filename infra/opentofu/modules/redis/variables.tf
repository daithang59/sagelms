variable "enabled" {
  description = "Whether to provision Memorystore Redis."
  type        = bool
  default     = true
}

variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "Redis region."
  type        = string
}

variable "name_prefix" {
  description = "Resource naming prefix."
  type        = string
}

variable "labels" {
  description = "Labels applied to Redis."
  type        = map(string)
  default     = {}
}

variable "network_self_link" {
  description = "VPC self link for private Redis access."
  type        = string
}

variable "memory_size_gb" {
  description = "Redis memory size in GB."
  type        = number
  default     = 5
}

variable "redis_version" {
  description = "Memorystore Redis version."
  type        = string
  default     = "REDIS_7_0"
}

variable "tier" {
  description = "Memorystore Redis tier."
  type        = string
  default     = "STANDARD_HA"
}

variable "auth_enabled" {
  description = "Whether to enable Redis AUTH. When true, the generated AUTH string is sensitive."
  type        = bool
  default     = true
}

variable "location_id" {
  description = "Preferred zone for the primary Redis node."
  type        = string
  default     = null
}

variable "alternative_location_id" {
  description = "Preferred zone for the standby Redis node."
  type        = string
  default     = null
}

variable "transit_encryption_mode" {
  description = "Redis in-transit encryption mode."
  type        = string
  default     = "SERVER_AUTHENTICATION"
}
