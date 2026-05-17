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

module "storage" {
  source      = "../../modules/storage"
  project_id  = var.project_id
  region      = var.region
  name_prefix = var.name_prefix
  labels      = local.labels

  depends_on = [module.project_services]
}

module "cloud_sql" {
  source                               = "../../modules/cloud-sql"
  enabled                              = var.enable_cloud_sql
  project_id                           = var.project_id
  region                               = var.region
  name_prefix                          = var.name_prefix
  labels                               = local.labels
  network_self_link                    = module.network.vpc_self_link
  private_service_access_connection_id = module.network.private_service_access_connection_id
  deletion_protection                  = var.cloud_sql_deletion_protection
  point_in_time_recovery_enabled       = var.cloud_sql_pitr_enabled

  depends_on = [module.project_services, module.network]
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
