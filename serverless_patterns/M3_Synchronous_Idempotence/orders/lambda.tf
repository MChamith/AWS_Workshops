data "archive_file" "create_order_lambda_zip" {
  type        = "zip"
  output_path = "/tmp/create_order_lambda.zip"
  source_dir  = "src/orders/dist"
}

data "archive_file" "order_utils_layer_zip" {
  type        = "zip"
  output_path = "/tmp/order_utils_layer.zip"
  source_dir  = "src/layers/dist"
}

data "archive_file" "get_order_lambda_zip" {
  type        = "zip"
  output_path = "/tmp/get_order_lambda.zip"
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

resource "aws_lambda_function" "get_order_lambda" {
  filename      = data.archive_file.get_order_lambda_zip.output_path
  function_name = "${var.workshop_stack_base_name}_GetOrderFunction"
  description   = "Handler function for getting an order"
  role          = aws_iam_role.orders_lambda_role.arn
  handler       = "get_order.handler"
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
  layers = [aws_lambda_layer_version.order_utils_layer.arn]
}

resource "aws_lambda_layer_version" "order_utils_layer" {
  layer_name          = "${var.workshop_stack_base_name}_UtilsLayer"
  description         = "Shared utilities for the order functions"
  filename            = data.archive_file.order_utils_layer_zip.output_path
  source_code_hash    = data.archive_file.order_utils_layer_zip.output_base64sha256
  compatible_runtimes = [var.lambda_runtime]
}
