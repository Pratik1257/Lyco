using System;
using System.Collections.Generic;

namespace Lyco.Api.Models;

public partial class OrderFileMst
{
    public long OrderFileId { get; set; }

    public string? OrderNo { get; set; }

    public string? FileUrl { get; set; }

    public string? FileStatus { get; set; }

    public string? LastModifiedBy { get; set; }

    public string? LastModifiedUserType { get; set; }

    public DateTime? LastModifieddate { get; set; }

    public string? FileName { get; set; }
}
