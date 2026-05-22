variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "name_prefix" {
  description = "Resource naming prefix."
  type        = string
}

variable "labels" {
  description = "Labels applied to secrets."
  type        = map(string)
  default     = {}
}

variable "eso_service_account_email" {
  description = "ESO Google service account email."
  type        = string
}

variable "grant_eso_access" {
  description = "Whether to grant ESO Secret Manager accessor on managed secrets."
  type        = bool
  default     = true
}

variable "secret_suffixes" {
  description = "Secret suffixes appended to name_prefix."
  type        = set(string)
  default = [
    "db-host",
    "db-port",
    "db-name",
    "cnpg-app-username",
    "cnpg-app-password",
    "cnpg-superuser-password",
    "db-auth-username",
    "db-auth-password",
    "db-course-username",
    "db-course-password",
    "db-content-username",
    "db-content-password",
    "db-progress-username",
    "db-progress-password",
    "db-assessment-username",
    "db-assessment-password",
    "db-ai-tutor-username",
    "db-ai-tutor-password",
    "redis-host",
    "redis-port",
    "redis-password",
    "jwt-secret",
    "gateway-shared-secret",
    "internal-api-secret",
    "llm-api-key",
    "harbor-pull-secret",
    "grafana-admin-password",
  ]
}
