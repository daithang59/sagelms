terraform {
  backend "gcs" {
    bucket = "sagelms-devsecops-tofu-state"
    prefix = "opentofu/devsecops"
  }
}
