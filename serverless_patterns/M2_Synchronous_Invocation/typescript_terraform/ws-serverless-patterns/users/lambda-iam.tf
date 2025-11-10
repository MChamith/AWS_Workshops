resource "aws_iam_role" "userfunctions_lambda_role" {
    name = "${var.workshop_stack_base_name}_userfunctions_lambda_role"
    description = "Role for the userfunctions lambda function"
    assume_role_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
            {
                Action = "sts:AssumeRole"
                Effect = "Allow"
                Principal = {
                    Service = "lambda.amazonaws.com"
                }
            }
        ]
    })

}

resource "aws_iam_policy" "userfunctions_lambda_role_policy" {
    name = "${var.workshop_stack_base_name}_userfunctions_lambda_role_policy"
    description = "Policy for the userfunctions lambda function"
    
    policy = jsonencode({

        Version = "2012-10-17"
        Statement = [
            {
                Action = [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Scan",
                    "dynamodb:Query",   
                    "dynamodb:BatchGetItem",
                    "dynamodb:BatchWriteItem",
                    "dynamodb:DescribeTable",
                    "dynamodb:ConditionCheckItem",
                   
                ] ,
                Effect = "Allow",
                Resource = "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/${aws_dynamodb_table.users_table.id}"
            },
            {
                Action = [
                    "logs:*"
                ] ,
                Effect = "Allow",
                Resource = "*"
            },
            {
                Action = [
                "xray:*"
                ] ,
                Effect = "Allow",
                Resource = "*"
            }
        ]
    })
}

resource "aws_iam_policy_attachment" "userfunctions_lambda_attach" {
    name = "${var.workshop_stack_base_name}_userfunctions_lambda_attach"
    roles = [aws_iam_role.userfunctions_lambda_role.name]
    policy_arn = aws_iam_policy.userfunctions_lambda_role_policy.arn
}


