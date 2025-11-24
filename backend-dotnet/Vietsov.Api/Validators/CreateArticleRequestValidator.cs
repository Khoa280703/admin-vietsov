using FluentValidation;
using Vietsov.Api.DTOs.Articles;

namespace Vietsov.Api.Validators;

public class CreateArticleRequestValidator : AbstractValidator<CreateArticleRequest>
{
    public CreateArticleRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters");

        RuleFor(x => x.Slug)
            .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Slug))
            .WithMessage("Slug must not exceed 500 characters");

        RuleFor(x => x.Content)
            .NotNull().WithMessage("Content is required");
    }
}

