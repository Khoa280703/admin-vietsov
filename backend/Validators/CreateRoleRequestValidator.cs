using FluentValidation;
using Vietsov.Api.DTOs.Roles;

namespace Vietsov.Api.Validators;

public class CreateRoleRequestValidator : AbstractValidator<CreateRoleRequest>
{
    public CreateRoleRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Role name is required");
    }
}

