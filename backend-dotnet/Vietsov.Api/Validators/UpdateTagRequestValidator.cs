using FluentValidation;
using Vietsov.Api.DTOs.Tags;

namespace Vietsov.Api.Validators;

public class UpdateTagRequestValidator : AbstractValidator<UpdateTagRequest>
{
    public UpdateTagRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().When(x => !string.IsNullOrEmpty(x.Name))
            .MaximumLength(200).When(x => !string.IsNullOrEmpty(x.Name))
            .WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Slug)
            .MaximumLength(200).When(x => !string.IsNullOrEmpty(x.Slug))
            .WithMessage("Slug must not exceed 200 characters");
    }
}

