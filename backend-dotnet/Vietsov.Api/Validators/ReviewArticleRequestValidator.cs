using FluentValidation;
using Vietsov.Api.DTOs.Articles;

namespace Vietsov.Api.Validators;

public class ReviewArticleRequestValidator : AbstractValidator<ReviewArticleRequest>
{
    public ReviewArticleRequestValidator()
    {
        // Notes is optional, no validation needed
    }
}

