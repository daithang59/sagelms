variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "GCS bucket location."
  type        = string
}

variable "bucket_name" {
  description = "Globally unique GCS bucket name for Harbor registry image blobs."
  type        = string
}

variable "service_account_id" {
  description = "Google service account ID for Harbor registry GCS access. Must be 30 characters or fewer."
  type        = string
}

variable "ksa_namespace" {
  description = "Kubernetes namespace of the Harbor registry service account."
  type        = string
}

variable "ksa_name" {
  description = "Kubernetes service account name used by the Harbor registry deployment."
  type        = string
}

variable "versioning_enabled" {
  description = "Whether to enable object versioning for the Harbor registry bucket."
  type        = bool
  default     = true
}

variable "force_destroy" {
  description = "Whether to delete all objects when destroying the bucket. Keep false for registry data safety."
  type        = bool
  default     = false
}

variable "labels" {
  description = "Labels applied to the Harbor registry bucket."
  type        = map(string)
  default     = {}
}
