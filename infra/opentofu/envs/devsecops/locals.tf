locals {
  labels = {
    project    = "sagelms"
    env        = var.environment
    owner      = "thang"
    managed_by = "opentofu"
  }

  namespaces = [
    "sagelms-devsecops",
    "platform-system",
    "cnpg-system",
    "sagelms-data",
    "harbor",
    "monitoring",
  ]

  iac_service_account_email = "${var.name_prefix}-iac-sa@${var.project_id}.iam.gserviceaccount.com"
}
