variable "project_id" {
  description = "GCP project ID for SageLMS DevSecOps environment."
  type        = string
  default     = "sagelms"
}

variable "project_number" {
  description = "GCP project number for documentation and IAM references."
  type        = string
  default     = "384858175117"
}

variable "region" {
  description = "Default GCP region."
  type        = string
  default     = "asia-southeast1"
}

variable "zones" {
  description = "GKE node zones."
  type        = list(string)
  default     = ["asia-southeast1-a", "asia-southeast1-b", "asia-southeast1-c"]
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "devsecops"
}

variable "name_prefix" {
  description = "Naming prefix for resources."
  type        = string
  default     = "sagelms-devsecops"
}

variable "enable_cloud_sql" {
  description = "Whether to provision managed Cloud SQL."
  type        = bool
  default     = true
}

variable "enable_managed_redis" {
  description = "Whether to provision managed Redis."
  type        = bool
  default     = true
}

variable "redis_auth_enabled" {
  description = "Whether to enable Redis AUTH."
  type        = bool
  default     = true
}

variable "cloud_sql_deletion_protection" {
  description = "Terraform-level deletion protection for Cloud SQL."
  type        = bool
  default     = true
}

variable "cloud_sql_pitr_enabled" {
  description = "Whether to enable Cloud SQL point-in-time recovery."
  type        = bool
  default     = false
}

variable "master_authorized_networks" {
  description = "CIDR blocks allowed to access the GKE public control plane endpoint."
  type = list(object({
    cidr_block   = string
    display_name = string
  }))
  default = []
}

variable "github_owner" {
  description = "GitHub organization or username."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository name."
  type        = string
  default     = "sagelms"
}

variable "deploy_branch" {
  description = "Protected branch allowed to apply infra."
  type        = string
  default     = "main"
}

variable "wif_pool_id" {
  description = "GitHub Workload Identity Federation pool ID."
  type        = string
  default     = "sagelms-devsecops-github-pool"
}

variable "wif_provider_id" {
  description = "GitHub Workload Identity Federation provider ID."
  type        = string
  default     = "github"
}

variable "eso_ksa_namespace" {
  description = "External Secrets Operator Kubernetes namespace."
  type        = string
  default     = "platform-system"
}

variable "eso_ksa_name" {
  description = "External Secrets Operator Kubernetes service account."
  type        = string
  default     = "external-secrets"
}
