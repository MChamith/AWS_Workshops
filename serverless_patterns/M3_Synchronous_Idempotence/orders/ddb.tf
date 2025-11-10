resource "aws_dynamodb_table" "orders_table" {
  name         = "${var.workshop_stack_base_name}_Orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "orderId"
  attribute {
    name = "userId"
    type = "S"
  }
  attribute {
    name = "orderId"
    type = "S"
  }
}

output "OrdersTable" {
  value = aws_dynamodb_table.orders_table.id
}
