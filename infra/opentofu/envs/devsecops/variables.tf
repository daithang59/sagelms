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
  default     = ["asia-southeast1-b", "asia-southeast1-c"]
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

variable "enable_cnpg_backup" {
  description = "Whether to provision CloudNativePG backup bucket, IAM and Workload Identity."
  type        = bool
  default     = true
}

variable "enable_harbor_registry_storage" {
  description = "Whether to provision Harbor registry GCS bucket, IAM and Workload Identity."
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

variable "cnpg_backup_bucket_name" {
  description = "GCS bucket name for CloudNativePG base backups and WAL archive."
  type        = string
  default     = "sagelms-cnpg-backup-sagelms"
}

variable "cnpg_backup_service_account_id" {
  description = "Google service account ID for CloudNativePG backup. Must be 30 characters or fewer."
  type        = string
  default     = "sagelms-devsecops-cnpg-sa"
}

variable "cnpg_backup_ksa_namespace" {
  description = "Kubernetes namespace for the CloudNativePG PostgreSQL service account."
  type        = string
  default     = "sagelms-data"
}

variable "cnpg_backup_ksa_name" {
  description = "Kubernetes service account name used by the CloudNativePG PostgreSQL cluster."
  type        = string
  default     = "sagelms-postgres"
}

variable "cnpg_backup_object_prefix" {
  description = "Object prefix/server path for CloudNativePG backups inside the bucket."
  type        = string
  default     = "sagelms-postgres"
}

variable "cnpg_backup_retention_days" {
  description = "Age in days before deleting old CloudNativePG backup objects."
  type        = number
  default     = 30
}

variable "harbor_registry_bucket_name" {
  description = "GCS bucket name for Harbor registry image blobs."
  type        = string
  default     = "sagelms-devsecops-harbor-registry"
}

variable "harbor_registry_service_account_id" {
  description = "Google service account ID for Harbor registry GCS access. Must be 30 characters or fewer."
  type        = string
  default     = "sagelms-devsecops-harbor-gcs"
}

variable "harbor_registry_ksa_namespace" {
  description = "Kubernetes namespace for the Harbor registry service account."
  type        = string
  default     = "harbor"
}

variable "harbor_registry_ksa_name" {
  description = "Kubernetes service account name used by Harbor registry."
  type        = string
  default     = "harbor-registry"
}

variable "harbor_registry_bucket_versioning_enabled" {
  description = "Whether to enable object versioning for the Harbor registry bucket."
  type        = bool
  default     = true
}

variable "harbor_registry_log_bucket_name" {
  description = "Optional bucket that receives Harbor registry bucket access logs. Null keeps the current project-level audit-log-only baseline."
  type        = string
  default     = null
}

variable "harbor_registry_log_object_prefix" {
  description = "Object prefix for Harbor registry bucket access logs when harbor_registry_log_bucket_name is set."
  type        = string
  default     = "harbor-registry-access"
}
