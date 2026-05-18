variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "GCS bucket location."
  type        = string
}

variable "bucket_name" {
  description = "Globally unique GCS bucket name for CloudNativePG base backups and WAL archive."
  type        = string
}

variable "service_account_id" {
  description = "Google service account ID for CloudNativePG backup. Must be 30 characters or fewer."
  type        = string
}

variable "ksa_namespace" {
  description = "Kubernetes namespace of the CloudNativePG PostgreSQL service account."
  type        = string
}

variable "ksa_name" {
  description = "Kubernetes service account name used by the CloudNativePG PostgreSQL cluster."
  type        = string
}

variable "object_prefix" {
  description = "Object prefix/server path for CloudNativePG backups inside the bucket."
  type        = string
  default     = "sagelms-postgres"
}

variable "retention_days" {
  description = "Age in days before deleting old backup objects."
  type        = number
  default     = 30
}

variable "force_destroy" {
  description = "Whether to delete all objects when destroying the bucket. Keep false for database safety."
  type        = bool
  default     = false
}

variable "labels" {
  description = "Labels applied to the backup bucket."
  type        = map(string)
  default     = {}
}
