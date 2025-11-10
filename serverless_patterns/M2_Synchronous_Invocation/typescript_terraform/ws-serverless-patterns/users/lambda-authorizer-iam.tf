resource "aws_iam_role" "userfunctions_lambda_auth_role" {
  name = "${var.workshop_stack_base_name}_userfunctions_lambda_auth_role"
  description = "Lambda function authorizer IAM role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "userfunctions_lambda_auth_role_policy" {
  name        = "userfunctions_lambda_auth_role_policy"
  description = "Lambda function authorizer policy"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:*"
      ],
      "Effect": "Allow",
      "Resource": "*"
    },
    {
      "Action": [
        "xray:*"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_policy_attachment" "userfunctions_lambda_auth_attach" {
  name       = "userfunctions_lambda_auth_attachment"
  roles      = ["${aws_iam_role.userfunctions_lambda_auth_role.name}"]
  policy_arn = "${aws_iam_policy.userfunctions_lambda_auth_role_policy.arn}"
}
