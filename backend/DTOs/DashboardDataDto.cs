using System.Collections.Generic;

namespace Lyco.Api.DTOs;

public class DashboardDataDto
{
    public string CurrencySymbol { get; set; } = "$";
    public DashboardGreeting Greeting { get; set; } = new();
    public MetricValueAmount TodayRevenue { get; set; } = new();
    public MetricValueCount TodayOrders { get; set; } = new();
    public PendingPaymentsMetrics PendingPayments { get; set; } = new();
    public MetricValueCount TotalUsers { get; set; } = new();
    public MetricValueCount TotalOrders { get; set; } = new();
    public int InProcessOrders { get; set; }
    public MetricValueCount MonthOrders { get; set; } = new();
    public MetricValueCount MonthInvoices { get; set; } = new();
    public MetricValueAmount MonthOrderValue { get; set; } = new();
    public decimal PendingMonth { get; set; }
    public OrderRevenueTrend OrderRevenueTrend { get; set; } = new();
    public OrderStatusMetrics OrderStatus { get; set; } = new();
    public List<ServiceBreakdownDto> ServiceBreakdown { get; set; } = new();
    public List<RecentOrderDto> RecentOrders { get; set; } = new();
    public List<NewQuoteRequestDto> NewQuoteRequests { get; set; } = new();
    public List<RevenueByServiceDto> RevenueByService { get; set; } = new();
    public List<TopCustomerDto> TopCustomers { get; set; } = new();
    public List<ServiceStatsDto> ServiceStats { get; set; } = new();
}

public class DashboardGreeting
{
    public string Name { get; set; } = string.Empty;
    public decimal RevenueChangePercent { get; set; }
    public int OrdersInProgress { get; set; }
    public int QuotesAwaiting { get; set; }
}

public class MetricValueAmount
{
    public decimal Amount { get; set; }
    public decimal ChangePercent { get; set; }
}

public class MetricValueCount
{
    public int Count { get; set; }
    public decimal ChangePercent { get; set; }
    public decimal ChangeFromAvg { get; set; } // Used for todayOrders instead of ChangePercent
}

public class PendingPaymentsMetrics
{
    public decimal Amount { get; set; }
    public int OpenOrders { get; set; }
}

public class OrderRevenueTrend
{
    public List<TrendPoint> Week { get; set; } = new();
    public List<TrendPoint> Month { get; set; } = new();
    public List<TrendPoint> Year { get; set; } = new();
}

public class TrendPoint
{
    public string Label { get; set; } = string.Empty;
    public int Orders { get; set; }
    public decimal Revenue { get; set; }
    public decimal Expenses { get; set; }
}

public class OrderStatusMetrics
{
    public int Total { get; set; }
    public StatusCountPercent Completed { get; set; } = new();
    public StatusCountPercent NewOrders { get; set; } = new();
    public StatusCountPercent Pending { get; set; } = new();
    public StatusCountPercent InProcess { get; set; } = new();
}

public class StatusCountPercent
{
    public int Count { get; set; }
    public decimal Percent { get; set; }
}

public class ServiceBreakdownDto
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class RecentOrderDto
{
    public string Id { get; set; } = string.Empty;
    public string Customer { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public string AvatarColor { get; set; } = string.Empty;
    public string Service { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class NewQuoteRequestDto
{
    public string Id { get; set; } = string.Empty;
    public string Customer { get; set; } = string.Empty;
    public string Service { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
}

public class RevenueByServiceDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Current { get; set; }
    public decimal Goal { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class TopCustomerDto
{
    public string Name { get; set; } = string.Empty;
    public int Orders { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class ServiceStatsDto
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}
