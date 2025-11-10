data "archive_file" "userfunctions_lambda_auth_zip" {
  type        = "zip"
  output_path = "/tmp/userfunctions_lambda_auth.zip"
  source_dir  = "src/authorizer/dist"
}

resource "aws_lambda_function" "userfunctions_lambda_auth" {
  filename      = "${data.archive_file.userfunctions_lambda_auth_zip.output_path}"
  function_name = "${var.workshop_stack_base_name}_userfunctions_lambda_auth"
  description   = "Handler for Lambda authorizer"
  role          = "${aws_iam_role.userfunctions_lambda_auth_role.arn}"
  handler       = "lambda_function.lambda_handler"
  source_code_hash = "${data.archive_file.userfunctions_lambda_auth_zip.output_base64sha256}"
  runtime = var.lambda_runtime
  timeout = var.lambda_timeout
  environment {
    variables = {
      USER_POOL_ID = aws_cognito_user_pool.user_pool.id
      APPLICATION_CLIENT_ID = aws_cognito_user_pool_client.user_pool_client.id
      ADMIN_GROUP_NAME = var.user_pool_admin_group_name
    }
  }
}

output "userfunctions_lambda_auth" {
  value = aws_lambda_function.userfunctions_lambda_auth.function_name
}
