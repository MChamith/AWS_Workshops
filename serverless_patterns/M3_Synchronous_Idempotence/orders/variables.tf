variable "region" { default = "us-east-1" }
variable "workshop_stack_base_name" {
  default = "ws-serverless-patterns-orders"
}
variable "user_pool_id" {
  description = "The ID of the Cognito user pool"
  type        = string

}
variable "lambda_runtime" {
  description = "The runtime for the lambda function"
  type        = string
  default     = "nodejs16.x"
}
variable "lambda_timeout" {
  description = "The timeout for the lambda function"
  type        = number
  default     = 100
}
variable "lambda_tracing_config" {
  description = "The tracing config for the lambda function"
  type        = string
  default     = "Active"
}

