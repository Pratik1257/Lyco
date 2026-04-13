using System.ComponentModel.DataAnnotations;

namespace Lyco.Api.DTOs;

public record ServiceDto(long Id, string Name, DateTime CreatedAt);

public record CreateServiceRequest
{
    [Required(ErrorMessage = "Service name is required.")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters.")]
    [MinLength(2, ErrorMessage = "Name must be at least 2 characters.")]
    public string Name { get; init; } = string.Empty;
}

public record UpdateServiceRequest
{
    [Required(ErrorMessage = "Service name is required.")]
    [MaxLength(200, ErrorMessage = "Name cannot exceed 200 characters.")]
    [MinLength(2, ErrorMessage = "Name must be at least 2 characters.")]
    public string Name { get; init; } = string.Empty;
}

public record PagedResult<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);
