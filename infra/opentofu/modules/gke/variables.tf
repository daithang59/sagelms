variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "GKE regional cluster location."
  type        = string
}

variable "zones" {
  description = "Node locations for the regional cluster."
  type        = list(string)
}

variable "name_prefix" {
  description = "Resource naming prefix."
  type        = string
}

variable "network_name" {
  description = "VPC network name or self link."
  type        = string
}

variable "subnet_name" {
  description = "Subnetwork name or self link."
  type        = string
}

variable "pods_range" {
  description = "Secondary range name for Pods."
  type        = string
}

variable "services_range" {
  description = "Secondary range name for Services."
  type        = string
}

variable "labels" {
  description = "Labels applied to supported resources."
  type        = map(string)
  default     = {}
}

variable "release_channel" {
  description = "GKE release channel."
  type        = string
  default     = "REGULAR"
}

variable "machine_type" {
  description = "Main node pool machine type."
  type        = string
  default     = "e2-standard-4"
}

variable "disk_type" {
  description = "Main node pool disk type."
  type        = string
  default     = "pd-balanced"
}

variable "disk_size_gb" {
  description = "Main node pool disk size."
  type        = number
  default     = 50
}

variable "initial_node_count_per_zone" {
  description = "Initial node count per zone."
  type        = number
  default     = 1
}

variable "min_node_count_per_zone" {
  description = "Autoscaling minimum node count per zone."
  type        = number
  default     = 1
}

variable "max_node_count_per_zone" {
  description = "Autoscaling maximum node count per zone."
  type        = number
  default     = 2
}

variable "enable_private_endpoint" {
  description = "Whether to expose only the private GKE control plane endpoint."
  type        = bool
  default     = false
}

variable "master_ipv4_cidr_block" {
  description = "CIDR block for the GKE control plane."
  type        = string
  default     = "172.16.0.0/28"
}

variable "master_authorized_networks" {
  description = "CIDR blocks allowed to reach the public control plane endpoint."
  type = list(object({
    cidr_block   = string
    display_name = string
  }))
  default = []
}
