variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "name_prefix" {
  description = "Resource naming prefix."
  type        = string
}

variable "github_owner" {
  description = "GitHub organization or user that owns the repository."
  type        = string
}

variable "github_repository" {
  description = "GitHub repository name."
  type        = string
}

variable "deploy_branch" {
  description = "Protected branch allowed to run apply workflows."
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

variable "iac_service_account_email" {
  description = "Existing IaC service account email created by bootstrap."
  type        = string
  default     = "sagelms-devsecops-iac-sa@sagelms.iam.gserviceaccount.com"
}

variable "eso_ksa_namespace" {
  description = "Kubernetes namespace for External Secrets Operator."
  type        = string
  default     = "platform-system"
}

variable "eso_ksa_name" {
  description = "Kubernetes service account name used by External Secrets Operator."
  type        = string
  default     = "external-secrets"
}
