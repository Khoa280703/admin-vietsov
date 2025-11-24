using FluentValidation;
using Vietsov.Api.DTOs.Users;

namespace Vietsov.Api.Validators;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Valid email is required");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required");

        RuleFor(x => x.RoleId)
            .GreaterThan(0).WithMessage("Valid role ID is required");
    }
}

