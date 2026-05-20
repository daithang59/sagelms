output "bucket_names" {
  description = "Application/demo/evidence buckets managed by this module."
  value       = { for suffix, bucket in google_storage_bucket.managed : suffix => bucket.name }
}
