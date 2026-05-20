variable "project_id" {
  description = "Existing GCP project ID."
  type        = string
  default     = "sagelms"
}

variable "region" {
  description = "Default region for bootstrap resources."
  type        = string
  default     = "asia-southeast1"
}

variable "name_prefix" {
  description = "Naming prefix for SageLMS DevSecOps resources."
  type        = string
  default     = "sagelms-devsecops"
}

variable "state_bucket_name" {
  description = "Globally unique GCS bucket name for OpenTofu remote state."
  type        = string
  default     = "sagelms-devsecops-tofu-state"
}

variable "iac_project_roles" {
  description = "Project roles granted to the IaC service account for provisioning later stacks."
  type        = set(string)
  default = [
    "roles/cloudsql.admin",
    "roles/compute.networkAdmin",
    "roles/container.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/iam.workloadIdentityPoolAdmin",
    "roles/redis.admin",
    "roles/secretmanager.admin",
    "roles/serviceusage.serviceUsageAdmin",
    "roles/servicenetworking.networksAdmin",
    "roles/storage.admin",
  ]
}
