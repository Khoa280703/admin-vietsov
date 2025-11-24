using FluentValidation;
using Vietsov.Api.DTOs.Articles;

namespace Vietsov.Api.Validators;

public class UpdateArticleRequestValidator : AbstractValidator<UpdateArticleRequest>
{
    public UpdateArticleRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().When(x => !string.IsNullOrEmpty(x.Title))
            .MaximumLength(500).When(x => !string.IsNullOrEmpty(x.Title))
            .WithMessage("Title must not exceed 500 characters");
    }
}

