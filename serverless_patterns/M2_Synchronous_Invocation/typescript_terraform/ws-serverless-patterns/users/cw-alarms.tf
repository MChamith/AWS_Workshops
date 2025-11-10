# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

resource "aws_cloudwatch_metric_alarm" "rest_api_errors_alarm" {
  alarm_name                = "RestAPIErrorsAlarm"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = 1
  metric_name               = "5XXError"
  namespace                 = "AWS/ApiGateway"
  period                    = 60
  statistic                 = "Sum"
  threshold                 = 1
  alarm_description         = "This metric monitors for server-side errors in the API Gateway"
  alarm_actions             = [aws_sns_topic.alarms_topic.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.rest_api.id
  }
}

resource "aws_cloudwatch_metric_alarm" "authorizer_function_errors_alarm" {
  alarm_name                = "AuthorizerFunctionErrorsAlarm"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = 1
  metric_name               = "Errors"
  namespace                 = "AWS/Lambda"
  period                    = 60
  statistic                 = "Sum"
  threshold                 = 1
  alarm_description         = "This metric monitors for errors in the Authorizer Lambda function"
  alarm_actions             = [aws_sns_topic.alarms_topic.arn]

  dimensions = {
    FunctionName = aws_lambda_function.userfunctions_lambda_auth.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "authorizer_function_throttling_alarm" {
  alarm_name                = "AuthorizerFunctionThrottlingAlarm"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = 1
  metric_name               = "Throttles"
  namespace                 = "AWS/Lambda"
  period                    = 60
  statistic                 = "Sum"
  threshold                 = 1
  alarm_description         = "This metric monitors for throttling in the Authorizer Lambda function"
  alarm_actions             = [aws_sns_topic.alarms_topic.arn]

  dimensions = {
    FunctionName = aws_lambda_function.userfunctions_lambda_auth.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "users_function_errors_alarm" {
  alarm_name                = "UsersFunctionErrorsAlarm"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = 1
  metric_name               = "Errors"
  namespace                 = "AWS/Lambda"
  period                    = 60
  statistic                 = "Sum"
  threshold                 = 1
  alarm_description         = "This metric monitors for errors in the Users Lambda function"
  alarm_actions             = [aws_sns_topic.alarms_topic.arn]

  dimensions = {
    FunctionName = aws_lambda_function.userfunctions_lambda.function_name
  }
}

resource "aws_cloudwatch_metric_alarm" "users_function_throttling_alarm" {
  alarm_name                = "UsersFunctionThrottlingAlarm"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = 1
  metric_name               = "Throttles"
  namespace                 = "AWS/Lambda"
  period                    = 60
  statistic                 = "Sum"
  threshold                 = 1
  alarm_description         = "This metric monitors for throttling in the Users Lambda function"
  alarm_actions             = [aws_sns_topic.alarms_topic.arn]

  dimensions = {
    FunctionName = aws_lambda_function.userfunctions_lambda.function_name
  }
}
