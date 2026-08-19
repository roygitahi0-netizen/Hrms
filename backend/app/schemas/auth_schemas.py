from marshmallow import Schema, fields, validate

class UserRegistrationSchema(Schema):
    email = fields.Email(
        required=True,
        error_messages={"required": "Email address is required.", "invalid": "Invalid email address format."}
    )
    password = fields.Str(
        required=True,
        validate=[
            validate.Length(min=6, error="Password must be at least 6 characters long."),
            validate.Regexp(r'^(?=.*[A-Za-z])(?=.*\d).*$', error="Password must contain at least one letter and one number.")
        ],
        error_messages={"required": "Password is required."}
    )
    first_name = fields.Str(
        required=True,
        validate=validate.Length(min=1, error="First name is required."),
        error_messages={"required": "First name is required."}
    )
    last_name = fields.Str(
        required=True,
        validate=validate.Length(min=1, error="Last name is required."),
        error_messages={"required": "Last name is required."}
    )
    department_id = fields.Int(
        required=True,
        error_messages={"required": "Please select your company department."}
    )
    phone = fields.Str(required=False, allow_none=True)
    country = fields.Str(required=False, allow_none=True)

class UserLoginSchema(Schema):
    email = fields.Email(
        required=True,
        error_messages={"required": "Email address is required.", "invalid": "Invalid email address format."}
    )
    password = fields.Str(
        required=True,
        error_messages={"required": "Password is required."}
    )

class UserEligibilityUpdateSchema(Schema):
    role = fields.Str(
        required=False,
        validate=validate.OneOf(['ADMIN', 'HR_STAFF', 'MANAGER', 'EMPLOYEE'], error="Invalid role specified.")
    )
    department_id = fields.Int(required=False, allow_none=True)
    is_active = fields.Bool(required=False)

class ForgotPasswordSchema(Schema):
    email = fields.Email(
        required=True,
        error_messages={"required": "Email address is required.", "invalid": "Invalid email address format."}
    )

class ResetPasswordSchema(Schema):
    token = fields.Str(
        required=True,
        error_messages={"required": "Reset token is required."}
    )
    password = fields.Str(
        required=True,
        validate=[
            validate.Length(min=6, error="Password must be at least 6 characters long."),
            validate.Regexp(r'^(?=.*[A-Za-z])(?=.*\d).*$', error="Password must contain at least one letter and one number.")
        ],
        error_messages={"required": "Password is required."}
    )

