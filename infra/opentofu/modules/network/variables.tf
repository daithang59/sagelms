variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "Region for regional network resources."
  type        = string
}

variable "name_prefix" {
  description = "Resource naming prefix."
  type        = string
}

variable "labels" {
  description = "Labels applied to supported resources."
  type        = map(string)
  default     = {}
}

variable "subnet_cidr" {
  description = "Primary subnet CIDR."
  type        = string
  default     = "10.10.0.0/20"
}

variable "pods_cidr" {
  description = "Secondary CIDR for GKE Pods."
  type        = string
  default     = "10.20.0.0/16"
}

variable "services_cidr" {
  description = "Secondary CIDR for GKE Services."
  type        = string
  default     = "10.30.0.0/20"
}

variable "pods_range_name" {
  description = "GKE Pods secondary range name."
  type        = string
  default     = "pods"
}

variable "services_range_name" {
  description = "GKE Services secondary range name."
  type        = string
  default     = "services"
}

variable "private_service_access_prefix_length" {
  description = "Prefix length for the reserved Private Service Access range."
  type        = number
  default     = 16
}
