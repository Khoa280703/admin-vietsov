using Vietsov.Api.DTOs.Users;

namespace Vietsov.Api.DTOs.Articles;

public class ListArticlesResponse
{
    public List<ArticleResponse> Data { get; set; } = new();
    public PaginationInfo Pagination { get; set; } = new();
}

