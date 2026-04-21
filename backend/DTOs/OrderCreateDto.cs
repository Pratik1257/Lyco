namespace Lyco.Api.DTOs;

public class OrderCreateDto
{
    public long UniqueNo { get; set; }
    public string? OrderNo { get; set; }
    public long ServiceId { get; set; }
    public string? WorkTitle { get; set; }
    public string? Instructions { get; set; }
    public string? FileFormat { get; set; }
    public string? Size { get; set; }
    public string? Sizetype { get; set; }
    public string? Amount { get; set; }
    public string? Currency { get; set; }
    public string? Email { get; set; }
}
