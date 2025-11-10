variable "region" {default="us-east-1"}
variable "workshop_stack_base_name" {
    default = "tf-serverless-patterns"
}
variable "lambda_memory" {
  default = "128"
}
variable "lambda_runtime" {
  default = "nodejs16.x"
}
variable "lambda_timeout" {
  default = 100
}
variable "lambda_tracing_config" {
  default = "Active"
}

variable "user_pool_admin_group_name" {
  default = "apiAdmins"
}
