resource "google_sql_database_instance" "main" {
  #checkov:skip=CKV_GCP_79:PostgreSQL 16 is intentionally pinned for the SageLMS pgvector/application baseline.
  count = var.enabled ? 1 : 0

  project             = var.project_id
  name                = "${var.name_prefix}-postgres"
  database_version    = var.database_version
  region              = var.region
  deletion_protection = var.deletion_protection

  settings {
    tier              = var.tier
    edition           = "ENTERPRISE"
    availability_type = var.availability_type
    disk_type         = "PD_SSD"
    disk_size         = var.disk_size_gb
    disk_autoresize   = true
    user_labels       = var.labels

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = var.network_self_link
      enable_private_path_for_google_cloud_services = true
      require_ssl                                   = true
    }

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = var.point_in_time_recovery_enabled
      start_time                     = "03:00"
    }

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }

    database_flags {
      name  = "cloudsql.enable_pgaudit"
      value = "on"
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    database_flags {
      name  = "log_duration"
      value = "on"
    }

    database_flags {
      name  = "log_hostname"
      value = "on"
    }

    database_flags {
      name  = "log_lock_waits"
      value = "on"
    }

    database_flags {
      name  = "log_min_messages"
      value = "error"
    }

    database_flags {
      name  = "log_min_error_statement"
      value = "error"
    }

    database_flags {
      name  = "log_statement"
      value = "all"
    }

    database_flags {
      name  = "pgaudit.log"
      value = "all"
    }
  }
}

resource "google_sql_database" "main" {
  count = var.enabled ? 1 : 0

  project  = var.project_id
  name     = var.database_name
  instance = google_sql_database_instance.main[0].name
}
