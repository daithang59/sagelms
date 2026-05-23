module "project_services" {
  source     = "../../modules/project-services"
  project_id = var.project_id
}

module "network" {
  source      = "../../modules/network"
  project_id  = var.project_id
  region      = var.region
  name_prefix = var.name_prefix
  labels      = local.labels

  depends_on = [module.project_services]
}

module "iam" {
  source                    = "../../modules/iam"
  project_id                = var.project_id
  name_prefix               = var.name_prefix
  github_owner              = var.github_owner
  github_repository         = var.github_repository
  deploy_branch             = var.deploy_branch
  wif_pool_id               = var.wif_pool_id
  wif_provider_id           = var.wif_provider_id
  iac_service_account_email = local.iac_service_account_email
  eso_ksa_namespace         = var.eso_ksa_namespace
  eso_ksa_name              = var.eso_ksa_name

  depends_on = [module.project_services]
}

module "gke" {
  source                     = "../../modules/gke"
  project_id                 = var.project_id
  region                     = var.region
  zones                      = var.zones
  name_prefix                = var.name_prefix
  network_name               = module.network.vpc_name
  subnet_name                = module.network.subnet_name
  pods_range                 = module.network.pods_range_name
  services_range             = module.network.services_range_name
  labels                     = local.labels
  master_authorized_networks = var.master_authorized_networks

  depends_on = [module.project_services, module.network]
}

resource "google_service_account_iam_member" "eso_workload_identity" {
  service_account_id = module.iam.eso_service_account_name
  role               = "roles/iam.workloadIdentityUser"
  member             = module.iam.eso_workload_identity_member

  depends_on = [module.gke]
}

module "storage" {
  source      = "../../modules/storage"
  project_id  = var.project_id
  region      = var.region
  name_prefix = var.name_prefix
  labels      = local.labels

  depends_on = [module.project_services]
}

module "cnpg_backup" {
  count = var.enable_cnpg_backup ? 1 : 0

  source             = "../../modules/cnpg-backup"
  project_id         = var.project_id
  region             = var.region
  bucket_name        = var.cnpg_backup_bucket_name
  service_account_id = var.cnpg_backup_service_account_id
  ksa_namespace      = var.cnpg_backup_ksa_namespace
  ksa_name           = var.cnpg_backup_ksa_name
  object_prefix      = var.cnpg_backup_object_prefix
  retention_days     = var.cnpg_backup_retention_days
  labels             = local.labels

  depends_on = [module.project_services]
}

module "harbor_registry_storage" {
  count = var.enable_harbor_registry_storage ? 1 : 0

  source             = "../../modules/harbor-registry-storage"
  project_id         = var.project_id
  region             = var.region
  bucket_name        = var.harbor_registry_bucket_name
  service_account_id = var.harbor_registry_service_account_id
  ksa_namespace      = var.harbor_registry_ksa_namespace
  ksa_name           = var.harbor_registry_ksa_name
  versioning_enabled = var.harbor_registry_bucket_versioning_enabled
  log_bucket_name    = var.harbor_registry_log_bucket_name
  log_object_prefix  = var.harbor_registry_log_object_prefix
  labels             = local.labels

  depends_on = [module.project_services, module.gke]
}

module "redis" {
  source            = "../../modules/redis"
  enabled           = var.enable_managed_redis
  project_id        = var.project_id
  region            = var.region
  name_prefix       = var.name_prefix
  labels            = local.labels
  network_self_link = module.network.vpc_self_link
  auth_enabled      = var.redis_auth_enabled

  depends_on = [module.project_services, module.network]
}

module "secret_manager" {
  source                    = "../../modules/secret-manager"
  project_id                = var.project_id
  name_prefix               = var.name_prefix
  labels                    = local.labels
  eso_service_account_email = module.iam.eso_service_account_email

  depends_on = [module.project_services, module.iam]
}
