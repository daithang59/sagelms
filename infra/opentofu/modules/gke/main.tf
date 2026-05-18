resource "google_service_account" "nodes" {
  project      = var.project_id
  account_id   = "${var.name_prefix}-gke-nodes"
  display_name = "SageLMS DevSecOps GKE nodes"
}

resource "google_project_iam_member" "node_roles" {
  for_each = toset([
    "roles/artifactregistry.reader",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/monitoring.viewer",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.nodes.email}"
}

resource "google_container_cluster" "main" {
  #checkov:skip=CKV_GCP_66:Binary Authorization requires a project policy and attestors owned by the supply-chain workstream; Kyverno/Cosign integration is handled separately.
  #checkov:skip=CKV_GCP_65:Google Groups for GKE RBAC requires an organization group address that is not available in the student project.
  #checkov:skip=CKV_GCP_69:The default node pool is removed; the managed node pool enables GKE_METADATA explicitly.
  project                     = var.project_id
  name                        = "${var.name_prefix}-gke"
  location                    = var.region
  node_locations              = var.zones
  network                     = var.network_name
  subnetwork                  = var.subnet_name
  remove_default_node_pool    = true
  initial_node_count          = 1
  deletion_protection         = false
  networking_mode             = "VPC_NATIVE"
  enable_shielded_nodes       = true
  enable_intranode_visibility = true
  logging_service             = "logging.googleapis.com/kubernetes"
  monitoring_service          = "monitoring.googleapis.com/kubernetes"
  resource_labels             = var.labels

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }

  release_channel {
    channel = var.release_channel
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = var.pods_range
    services_secondary_range_name = var.services_range
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = var.enable_private_endpoint
    master_ipv4_cidr_block  = var.master_ipv4_cidr_block
  }

  master_authorized_networks_config {
    dynamic "cidr_blocks" {
      for_each = var.master_authorized_networks

      content {
        cidr_block   = cidr_blocks.value.cidr_block
        display_name = cidr_blocks.value.display_name
      }
    }
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  addons_config {
    horizontal_pod_autoscaling {
      disabled = false
    }

    http_load_balancing {
      disabled = false
    }

    network_policy_config {
      disabled = false
    }
  }

  network_policy {
    enabled  = true
    provider = "CALICO"
  }
}

resource "google_container_node_pool" "main" {
  project            = var.project_id
  name               = "${var.name_prefix}-main-pool"
  location           = google_container_cluster.main.location
  cluster            = google_container_cluster.main.name
  node_locations     = var.zones
  initial_node_count = var.initial_node_count_per_zone

  autoscaling {
    min_node_count = var.min_node_count_per_zone
    max_node_count = var.max_node_count_per_zone
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    machine_type    = var.machine_type
    disk_type       = var.disk_type
    disk_size_gb    = var.disk_size_gb
    image_type      = "COS_CONTAINERD"
    service_account = google_service_account.nodes.email
    labels          = var.labels
    tags            = ["${var.name_prefix}-gke-node"]

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    metadata = {
      disable-legacy-endpoints = "true"
    }

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_integrity_monitoring = true
      enable_secure_boot          = true
    }
  }

  depends_on = [google_project_iam_member.node_roles]
}
