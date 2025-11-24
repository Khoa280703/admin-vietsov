using FluentValidation;
using Vietsov.Api.DTOs.Categories;

namespace Vietsov.Api.Validators;

public class CreateCategoryRequestValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Slug)
            .MaximumLength(200).When(x => !string.IsNullOrEmpty(x.Slug))
            .WithMessage("Slug must not exceed 200 characters");

        RuleFor(x => x.Type)
            .IsInEnum().WithMessage("Invalid category type");
    }
}

