resource "aws_dynamodb_table" "users_table" {
    name = "${var.workshop_stack_base_name}_Users"
    billing_mode = "PAY_PER_REQUEST"
    hash_key = "userid"
    attribute {
        name = "userid"
        type = "S"
    }
}

output "UsersTable" {
    value = aws_dynamodb_table.users_table.id
}
