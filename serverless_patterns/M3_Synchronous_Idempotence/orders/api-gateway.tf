resource "aws_api_gateway_rest_api" "workshop_api" {
  name        = "WorkshopApiGateway"
  description = "Workshop API Gateway for Orders"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "orders_resource" {
  rest_api_id = aws_api_gateway_rest_api.workshop_api.id
  parent_id   = aws_api_gateway_rest_api.workshop_api.root_resource_id
  path_part   = "orders"
}

resource "aws_api_gateway_resource" "order_id_resource" {
  rest_api_id = aws_api_gateway_rest_api.workshop_api.id
  parent_id   = aws_api_gateway_resource.orders_resource.id
  path_part   = "{orderId}"
}

resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name            = "Module3CognitoAuthorizer"
  rest_api_id     = aws_api_gateway_rest_api.workshop_api.id
  type            = "COGNITO_USER_POOLS"
  identity_source = "method.request.header.Authorization"
  provider_arns   = ["arn:aws:cognito-idp:${var.region}:${data.aws_caller_identity.current.account_id}:userpool/${var.user_pool_id}"]
}

resource "aws_api_gateway_method" "orders_post" {
  rest_api_id   = aws_api_gateway_rest_api.workshop_api.id
  resource_id   = aws_api_gateway_resource.orders_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_method" "orders_get" {
  rest_api_id   = aws_api_gateway_rest_api.workshop_api.id
  resource_id   = aws_api_gateway_resource.order_id_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "orders_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.workshop_api.id
  resource_id             = aws_api_gateway_resource.order_id_resource.id
  http_method             = aws_api_gateway_method.orders_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_order_lambda.invoke_arn
}
resource "aws_api_gateway_integration" "orders_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.workshop_api.id
  resource_id             = aws_api_gateway_resource.orders_resource.id
  http_method             = aws_api_gateway_method.orders_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.create_order_lambda.invoke_arn
}

resource "aws_api_gateway_deployment" "orders_deployment" {
  rest_api_id = aws_api_gateway_rest_api.workshop_api.id
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_integration.orders_post_integration.id,
      aws_api_gateway_integration.orders_get_integration.id
    ]))
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "orders_stage" {
  deployment_id = aws_api_gateway_deployment.orders_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.workshop_api.id
  stage_name    = "Prod"
  # TODO: Add X-Ray tracing and logging features
}

resource "aws_lambda_permission" "api_gw_invoke_permission" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_order_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.workshop_api.execution_arn}/*/*/*"
}

resource "aws_lambda_permission" "api_gw_get_invoke_permission" {
  statement_id  = "AllowGetOrderExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_order_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.workshop_api.execution_arn}/*/GET/orders/*"
}

output "OrdersAPIEndpoint" {
  value = aws_api_gateway_stage.orders_stage.invoke_url
}
