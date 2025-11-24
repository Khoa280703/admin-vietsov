using FluentValidation;
using Vietsov.Api.DTOs.Users;

namespace Vietsov.Api.Validators;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().When(x => x.Username != null)
            .WithMessage("Username cannot be empty");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email))
            .WithMessage("Valid email is required");

        RuleFor(x => x.FullName)
            .NotEmpty().When(x => x.FullName != null)
            .WithMessage("Full name cannot be empty");

        RuleFor(x => x.RoleId)
            .GreaterThan(0).When(x => x.RoleId.HasValue)
            .WithMessage("Valid role ID is required");
    }
}

