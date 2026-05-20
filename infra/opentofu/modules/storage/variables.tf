variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "Bucket location."
  type        = string
}

variable "name_prefix" {
  description = "Resource naming prefix."
  type        = string
}

variable "labels" {
  description = "Labels applied to buckets."
  type        = map(string)
  default     = {}
}

variable "bucket_suffixes" {
  description = "Non-state bucket suffixes managed by this module."
  type        = set(string)
  default     = ["materials", "evidence"]
}

variable "lifecycle_age_days" {
  description = "Age in days before deleting old objects. Set to null to disable."
  type        = number
  default     = 30
}
