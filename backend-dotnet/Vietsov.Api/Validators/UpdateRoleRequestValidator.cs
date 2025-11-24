using FluentValidation;
using Vietsov.Api.DTOs.Roles;

namespace Vietsov.Api.Validators;

public class UpdateRoleRequestValidator : AbstractValidator<UpdateRoleRequest>
{
    public UpdateRoleRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().When(x => !string.IsNullOrEmpty(x.Name))
            .WithMessage("Role name cannot be empty");
    }
}

