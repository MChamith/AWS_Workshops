data "archive_file" "create_order_lambda_zip" {
  type        = "zip"
  output_path = "/tmp/create_order_lambda.zip"
  source_dir  = "src/orders/dist"
}

resource "aws_lambda_function" "create_order_lambda" {
  filename      = data.archive_file.create_order_lambda_zip.output_path
  function_name = "${var.workshop_stack_base_name}_CreateOrderFunction"
  description   = "Handler function for creating an order"
  role          = aws_iam_role.orders_lambda_role.arn
  handler       = "create_order.handler"
  runtime       = var.lambda_runtime
  timeout       = var.lambda_timeout
  tracing_config {
    mode = var.lambda_tracing_config
  }
  environment {
    variables = {
      ORDERS_TABLE = "${aws_dynamodb_table.orders_table.id}"
    }
  }
}
