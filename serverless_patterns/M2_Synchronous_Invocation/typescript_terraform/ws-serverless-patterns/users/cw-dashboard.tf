# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

resource "aws_cloudwatch_dashboard" "application_dashboard" {
  dashboard_name = "${var.workshop_stack_base_name}-dashboard"

  dashboard_body = <<EOF
{
  "widgets": [
    {
      "height": 6,
      "width": 6,
      "y": 6,
      "x": 0,
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "${aws_lambda_function.userfunctions_lambda.function_name}"],
          [".", "Errors", ".", "."],
          [".", "Throttles", ".", "."],
          [".", "Duration", ".", ".", { "stat": "Average" }],
          [".", "ConcurrentExecutions", ".", ".", { "stat": "Maximum" }]
        ],
        "view": "timeSeries",
        "region": "${var.region}",
        "stacked": false,
        "title": "Users Lambda",
        "period": 60,
        "stat": "Sum"
      }
    },
    {
      "height": 6,
      "width": 6,
      "y": 6,
      "x": 6,
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "${aws_lambda_function.userfunctions_lambda_auth.function_name}"],
          [".", "Errors", ".", "."],
          [".", "Throttles", ".", "."],
          [".", "Duration", ".", ".", { "stat": "Average" }],
          [".", "ConcurrentExecutions", ".", ".", { "stat": "Maximum" }]
        ],
        "view": "timeSeries",
        "region": "${var.region}",
        "stacked": false,
        "title": "Authorizer Lambda",
        "period": 60,
        "stat": "Sum"
      }
    },
    {
      "height": 6,
      "width": 12,
      "y": 0,
      "x": 0,
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "4XXError", "ApiName", "${aws_api_gateway_rest_api.rest_api.name}", { "yAxis": "right" }],
          [".", "5XXError", ".", ".", { "yAxis": "right" }],
          [".", "DataProcessed", ".", ".", { "yAxis": "left" }],
          [".", "Count", ".", ".", { "label": "Count", "yAxis": "right" }],
          [".", "IntegrationLatency", ".", ".", { "stat": "Average" }],
          [".", "Latency", ".", ".", { "stat": "Average" }]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${var.region}",
        "period": 60,
        "stat": "Sum",
        "title": "API Gateway"
      }
    }
  ]
}
EOF
}

output "dashboard_url" {
    value = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.application_dashboard.dashboard_name}"
}
