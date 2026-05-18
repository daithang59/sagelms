locals {
  # GCP service account IDs must be 30 characters or fewer.
  service_accounts = {
    github_actions = {
      account_id   = "${var.name_prefix}-gha-sa"
      display_name = "SageLMS DevSecOps GitHub Actions"
    }
    eso = {
      account_id   = "${var.name_prefix}-eso-sa"
      display_name = "SageLMS DevSecOps External Secrets Operator"
    }
    flux = {
      account_id   = "${var.name_prefix}-flux-sa"
      display_name = "SageLMS DevSecOps FluxCD"
    }
    app_runtime = {
      account_id   = "${var.name_prefix}-app-sa"
      display_name = "SageLMS DevSecOps app runtime"
    }
  }
}

resource "google_service_account" "managed" {
  for_each = local.service_accounts

  project      = var.project_id
  account_id   = each.value.account_id
  display_name = each.value.display_name
}

resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = var.wif_pool_id
  display_name              = "SageLMS GitHub Actions"
  description               = "OIDC trust pool for GitHub Actions workflows."
}

resource "google_iam_workload_identity_pool_provider" "github" {
  #checkov:skip=CKV_GCP_125:The provider is repository and protected-branch constrained using variables resolved at plan/apply time.
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = var.wif_provider_id
  display_name                       = "GitHub OIDC"
  description                        = "GitHub Actions OIDC provider for SageLMS."

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  attribute_condition = "assertion.repository == '${var.github_owner}/${var.github_repository}' && assertion.ref == 'refs/heads/${var.deploy_branch}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_service_account_iam_member" "github_wif_user" {
  service_account_id = google_service_account.managed["github_actions"].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_owner}/${var.github_repository}"
}

resource "google_service_account_iam_member" "github_impersonates_iac" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.iac_service_account_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.managed["github_actions"].email}"
}
