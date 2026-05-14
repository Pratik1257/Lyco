using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lyco.Api.Data;
using Lyco.Api.DTOs;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

namespace Lyco.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly LycoDbContext _context;
    private static readonly string[] AvatarColors = new[] 
    { 
        "#3b82f6", // Blue
        "#8b5cf6", // Violet
        "#f97316", // Orange
        "#eab308", // Yellow
        "#10b981", // Emerald
        "#06b6d4", // Cyan
        "#ef4444", // Red
        "#ec4899", // Pink
        "#6366f1", // Indigo
        "#f43f5e", // Rose
        "#14b8a6", // Teal
        "#f59e0b", // Amber
        "#84cc16", // Lime
        "#a855f7", // Purple
        "#0ea5e9", // Sky
        "#fb923c", // Light Orange
        "#c026d3", // Fuchsia
        "#4d7c0f", // Dark Lime
        "#be123c", // Dark Rose
        "#1d4ed8", // Dark Blue
        "#7e22ce"  // Dark Purple
    };

    private int GetStableHash(string s)
    {
        if (string.IsNullOrEmpty(s)) return 0;
        int h = 0;
        foreach (char c in s) h = 31 * h + c;
        return Math.Abs(h);
    }

    public DashboardController(LycoDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboardData([FromQuery] string timeframe = "Month", [FromQuery] string currency = "USD", [FromQuery] long? uniqueNo = null)
    {
        var now = DateTime.Now;
        var startOfToday = now.Date;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var startOfLastMonth = startOfMonth.AddMonths(-1);
        
        // Timeframe start dates
        var timeframeStart = timeframe.ToLower() switch
        {
            "week" => startOfToday.AddDays(-6),
            "year" => new DateTime(now.Year, 1, 1),
            _ => startOfMonth // default "month"
        };

        // Fetch currency symbol
        var currencyInfo = await _context.CurrencyMsts.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Code == currency);
        var currencySymbol = currencyInfo?.Symbol ?? "$";

        // Pre-fetch commonly used lists to memory to avoid multiple db hits if they're small. 
        // For large datasets, we should do IQueryable aggregations.
        var usersCount = await _context.UserRegistrations.CountAsync(u => u.UserType != "Admin");
        
        long? filteredUserId = null;
        if (uniqueNo.HasValue)
        {
            filteredUserId = await _context.UserRegistrations
                .Where(u => u.UniqueNo == uniqueNo.Value)
                .Select(u => (long?)u.UserId)
                .FirstOrDefaultAsync();
        }

        var allOrders = await _context.OrderDetails.AsNoTracking()
            .Where(o => (string.IsNullOrEmpty(currency) || o.Currency == currency) && (!uniqueNo.HasValue || o.UniqueNo == uniqueNo.Value))
            .ToListAsync();
        var allInvoices = await _context.InvoiceMsts.AsNoTracking()
            .Where(i => !filteredUserId.HasValue || i.UserId == filteredUserId.Value)
            .Where(i => string.IsNullOrEmpty(currency) || i.OrderDetails.Any(od => od.Currency == currency))
            .ToListAsync();
        var allQuotes = await _context.Quotes.AsNoTracking()
            .Where(q => (string.IsNullOrEmpty(currency) || q.Currency == currency) && (!uniqueNo.HasValue || q.UniqueNo == uniqueNo.Value))
            .ToListAsync();
        var allServices = await _context.ServiceMsts.AsNoTracking().ToListAsync();
        var allExpenses = await _context.ExpenseMsts.AsNoTracking()
            .Where(e => (string.IsNullOrEmpty(currency) || e.Currency == currency))
            .ToListAsync();

        // Filter by timeframe
        var filteredOrders = allOrders.Where(o => o.OrderDate >= timeframeStart).ToList();

        // Period filtering for stats
        DateTime periodStart = timeframeStart;
        DateTime periodEnd = now; 
        
        DateTime lastPeriodStart;
        DateTime lastPeriodEnd;

        if (timeframe.ToLower() == "week")
        {
            lastPeriodStart = periodStart.AddDays(-7);
            lastPeriodEnd = periodStart;
        }
        else if (timeframe.ToLower() == "year")
        {
            lastPeriodStart = periodStart.AddYears(-1);
            // Compare same months of previous year for accurate growth
            lastPeriodEnd = lastPeriodStart.AddMonths(now.Month - 1).AddDays(now.Day);
            if (lastPeriodEnd > periodStart) lastPeriodEnd = periodStart;
        }
        else // Month
        {
            lastPeriodStart = periodStart.AddMonths(-1);
            // Compare same days of previous month for accurate growth
            lastPeriodEnd = lastPeriodStart.AddDays(now.Day);
            if (lastPeriodEnd > periodStart) lastPeriodEnd = periodStart;
        }

        var periodOrders = allOrders.Where(o => o.OrderDate >= periodStart && o.OrderDate < periodEnd).ToList();
        var lastPeriodOrders = allOrders.Where(o => o.OrderDate >= lastPeriodStart && o.OrderDate < lastPeriodEnd).ToList();
        
        var periodInvoices = allInvoices.Where(i => i.InvoiceDate >= periodStart && i.InvoiceDate < periodEnd).ToList();
        var lastPeriodInvoices = allInvoices.Where(i => i.InvoiceDate >= lastPeriodStart && i.InvoiceDate < lastPeriodEnd).ToList();

        var todayOrdersList = allOrders.Where(o => o.OrderDate >= startOfToday).ToList();

        // Safe decimal parsing helper
        decimal ParseAmount(string? amountStr) => decimal.TryParse(amountStr, out var val) ? val : 0m;

        // 1. Greeting
        var ordersInProgress = allOrders.Count(o => o.OrderStatus == "In Process" || o.OrderStatus == "New");
        var quotesAwaiting = allQuotes.Count(q => q.QuoteType == "Quote" || q.QuoteType == "Standard" || string.IsNullOrEmpty(q.QuoteType));
        
        var periodRevenue = periodOrders.Sum(o => ParseAmount(o.Amount));
        var lastPeriodRevenue = lastPeriodOrders.Sum(o => ParseAmount(o.Amount));
        var revenueChange = lastPeriodRevenue == 0 ? 0 : ((periodRevenue - lastPeriodRevenue) / lastPeriodRevenue) * 100;

        // 2. Metrics
        var todayRevenue = todayOrdersList.Sum(o => ParseAmount(o.Amount));
        
        // Use total days in period for avg
        var daysInLastPeriod = (decimal)(lastPeriodEnd - lastPeriodStart).TotalDays;
        if (daysInLastPeriod <= 0) daysInLastPeriod = 1; // Prevent div by zero

        var avgDailyRevenueLastPeriod = lastPeriodRevenue / daysInLastPeriod;
        var todayRevChange = avgDailyRevenueLastPeriod == 0 ? 0 : ((todayRevenue - avgDailyRevenueLastPeriod) / avgDailyRevenueLastPeriod) * 100;

        var avgDailyOrdersLastPeriod = lastPeriodOrders.Count / daysInLastPeriod;
        var todayOrdersChange = todayOrdersList.Count - avgDailyOrdersLastPeriod;

        var pendingPaymentsOrders = allOrders.Where(o => o.PaymentStatus != "Completed" && o.PaymentStatus != "Paid").ToList();
        var pendingPaymentsAmount = pendingPaymentsOrders.Sum(o => ParseAmount(o.Amount));

        var periodOrderChange = lastPeriodOrders.Count == 0 ? 0 : ((decimal)(periodOrders.Count - lastPeriodOrders.Count) / lastPeriodOrders.Count) * 100;
        var periodInvoiceChange = lastPeriodInvoices.Count == 0 ? 0 : ((decimal)(periodInvoices.Count - lastPeriodInvoices.Count) / lastPeriodInvoices.Count) * 100;

        // 3. Revenue Trend
        var trendWeek = new List<TrendPoint>();
        var startOfTrendWeek = startOfToday.AddDays(-6);
        for (int i = 0; i < 7; i++)
        {
            var day = startOfTrendWeek.AddDays(i);
            var nextDay = day.AddDays(1);
            var dayOrders = allOrders.Where(o => o.OrderDate >= day && o.OrderDate < nextDay).ToList();
            var dayExpenses = allExpenses.Where(e => e.ExpenseDate >= day && e.ExpenseDate < nextDay).ToList();
            trendWeek.Add(new TrendPoint
            {
                Label = day.ToString("ddd"),
                Orders = dayOrders.Count,
                Revenue = dayOrders.Sum(o => ParseAmount(o.Amount)),
                Expenses = dayExpenses.Sum(e => e.Amount ?? 0)
            });
        }

        var trendMonth = new List<TrendPoint>();
        for (int i = 0; i < 4; i++)
        {
            var weekStart = startOfMonth.AddDays(i * 7);
            var weekEnd = (i == 3) ? startOfMonth.AddMonths(1) : weekStart.AddDays(7);
            
            var weekOrders = allOrders.Where(o => o.OrderDate >= weekStart && o.OrderDate < weekEnd).ToList();
            var weekExpenses = allExpenses.Where(e => e.ExpenseDate >= weekStart && e.ExpenseDate < weekEnd).ToList();
            
            var rangeEnd = weekEnd.AddDays(-1);
            var label = (weekStart.Month == rangeEnd.Month)
                ? $"{weekStart:MMM d}–{rangeEnd:%d}"
                : $"{weekStart:MMM d}–{rangeEnd:MMM d}";

            trendMonth.Add(new TrendPoint
            {
                Label = label,
                Orders = weekOrders.Count,
                Revenue = weekOrders.Sum(o => ParseAmount(o.Amount)),
                Expenses = weekExpenses.Sum(e => e.Amount ?? 0)
            });
        }

        var trendYear = new List<TrendPoint>();
        var currentYear = now.Year;
        for (int i = 0; i < 12; i++)
        {
            var monthStart = new DateTime(currentYear, i + 1, 1);
            var monthEnd = monthStart.AddMonths(1);
            
            var mOrders = allOrders.Where(o => o.OrderDate >= monthStart && o.OrderDate < monthEnd).ToList();
            var mExpenses = allExpenses.Where(e => e.ExpenseDate >= monthStart && e.ExpenseDate < monthEnd).ToList();
            trendYear.Add(new TrendPoint
            {
                Label = monthStart.ToString("MMM"),
                Orders = mOrders.Count,
                Revenue = mOrders.Sum(o => ParseAmount(o.Amount)),
                Expenses = mExpenses.Sum(e => e.Amount ?? 0)
            });
        }

        // 4. Order Status
        var totalOrdersCount = filteredOrders.Count;
        var completedOrders = filteredOrders.Count(o => o.OrderStatus == "Completed" || o.OrderStatus == "Invoiced");
        var newOrdersCount = filteredOrders.Count(o => o.OrderStatus == "New");
        var pendingOrdersCount = filteredOrders.Count(o => o.OrderStatus == "Pending");
        var inProcessOrdersCount = filteredOrders.Count(o => o.OrderStatus == "In Process");

        decimal CalcPercent(int count) => totalOrdersCount == 0 ? 0 : Math.Round(((decimal)count / totalOrdersCount) * 100, 1);

        // 5. Service Breakdown
        var serviceGroups = filteredOrders
            .Where(o => o.ServiceId.HasValue)
            .GroupBy(o => o.ServiceId)
            .Select(g => new { ServiceId = g.Key ?? 0, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(4)
            .ToList();

        var serviceBreakdown = new List<ServiceBreakdownDto>();
        var serviceStats = new List<ServiceStatsDto>();
        var icons = new[] { "image", "layers", "pen-tool", "more-horizontal" };
        
        int colorIdx = 0;
        foreach (var sg in serviceGroups)
        {
            var serviceName = allServices.FirstOrDefault(s => s.ServiceId == sg.ServiceId)?.ServiceName ?? "Unknown";
            var color = AvatarColors[colorIdx % AvatarColors.Length];
            var icon = icons[colorIdx % icons.Length];
            
            serviceBreakdown.Add(new ServiceBreakdownDto { Name = serviceName, Count = sg.Count, Color = color });
            serviceStats.Add(new ServiceStatsDto { Name = serviceName, Count = sg.Count, Icon = icon, Color = color });
            colorIdx++;
        }

        // 6. Recent Orders
        var recentOrdersDb = filteredOrders
            .Where(o => o.PaymentStatus != "Paid" && o.PaymentStatus != "Completed")
            .OrderByDescending(o => o.OrderId)
            .Take(5)
            .ToList();
        var recentOrders = new List<RecentOrderDto>();
        foreach (var ro in recentOrdersDb)
        {
            var user = await _context.UserRegistrations.FirstOrDefaultAsync(u => u.UniqueNo == ro.UniqueNo);
            var service = allServices.FirstOrDefault(s => s.ServiceId == ro.ServiceId);
            
            var customerName = !string.IsNullOrEmpty(user?.Firstname) 
                ? $"{user.Firstname} {user.Lastname}".Trim() 
                : user?.Username ?? "Unknown";

            var initials = "";
            if (!string.IsNullOrEmpty(user?.Firstname) && !string.IsNullOrEmpty(user?.Lastname))
                initials = $"{user.Firstname[0]}{user.Lastname[0]}".ToUpper();
            else
                initials = customerName.Length >= 2 ? customerName.Substring(0, 2).ToUpper() : "UN";
            
            // Deterministic stable color based on name AND UniqueNo for maximum uniqueness
            var colorSeed = GetStableHash(customerName) + (int)(user?.UniqueNo ?? 0);
            var avatarColor = AvatarColors[Math.Abs(colorSeed) % AvatarColors.Length];

            recentOrders.Add(new RecentOrderDto
            {
                Id = ro.OrderId.ToString(),
                Customer = customerName,
                Initials = initials,
                AvatarColor = avatarColor,
                Service = service?.ServiceName ?? "Others",
                OrderNumber = ro.OrderNo ?? $"#{ro.OrderId}",
                Amount = ParseAmount(ro.Amount),
                Status = string.IsNullOrEmpty(ro.OrderStatus) ? "New" : ro.OrderStatus
            });
        }

        // 7. New Quote Requests
        var filteredQuotes = allQuotes.Where(q => q.QuoteDate >= timeframeStart).ToList();
        var recentQuotesDb = filteredQuotes.OrderByDescending(q => q.QuoteId).Take(5).ToList();
        var newQuoteRequests = new List<NewQuoteRequestDto>();
        foreach (var rq in recentQuotesDb)
        {
            var user = await _context.UserRegistrations.FirstOrDefaultAsync(u => u.UniqueNo == rq.UniqueNo);
            var service = allServices.FirstOrDefault(s => s.ServiceId == rq.ServiceId);

            var customerName = !string.IsNullOrEmpty(user?.Firstname) 
                ? $"{user.Firstname} {user.Lastname}".Trim() 
                : user?.Username ?? "Unknown";

            newQuoteRequests.Add(new NewQuoteRequestDto
            {
                Id = rq.QuoteNo ?? rq.QuoteId.ToString(),
                Customer = customerName,
                Service = service?.ServiceName ?? "Others",
                Date = rq.QuoteDate?.ToString("MM/dd/yyyy") ?? ""
            });
        }

        // 8. Revenue By Service
        var revServiceGroups = filteredOrders
            .Where(o => o.ServiceId.HasValue)
            .GroupBy(o => o.ServiceId)
            .Select(g => new { 
                ServiceId = g.Key ?? 0, 
                Revenue = g.Sum(o => ParseAmount(o.Amount)) 
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        var revenueByService = new List<RevenueByServiceDto>();
        colorIdx = 0;
        foreach (var rsg in revServiceGroups)
        {
            var serviceName = allServices.FirstOrDefault(s => s.ServiceId == rsg.ServiceId)?.ServiceName ?? "Unknown";
            revenueByService.Add(new RevenueByServiceDto
            {
                Name = serviceName,
                Current = rsg.Revenue,
                Goal = rsg.Revenue > 0 ? rsg.Revenue * 1.2m : 100m, // Set a dynamic goal +20%
                Color = AvatarColors[colorIdx % AvatarColors.Length]
            });
            colorIdx++;
        }

        // 9. Top Customers
        var topCustGroups = filteredOrders
            .Where(o => o.UniqueNo.HasValue)
            .GroupBy(o => o.UniqueNo)
            .Select(g => new { UniqueNo = g.Key ?? 0, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(5)
            .ToList();

        var topCustomers = new List<TopCustomerDto>();
        colorIdx = 0;
        foreach (var tcg in topCustGroups)
        {
            var user = await _context.UserRegistrations.FirstOrDefaultAsync(u => u.UniqueNo == tcg.UniqueNo);
            
            var customerName = !string.IsNullOrEmpty(user?.Firstname) 
                ? $"{user.Firstname} {user.Lastname}".Trim() 
                : user?.Username ?? "Unknown";

            topCustomers.Add(new TopCustomerDto
            {
                Name = customerName,
                Orders = tcg.Count,
                Color = AvatarColors[colorIdx % AvatarColors.Length]
            });
            colorIdx++;
        }

        // Build Response
        var dto = new DashboardDataDto
        {
            CurrencySymbol = currencySymbol,
            Greeting = new DashboardGreeting
            {
                Name = uniqueNo.HasValue 
                    ? (await _context.UserRegistrations.FirstOrDefaultAsync(u => u.UniqueNo == uniqueNo))?.Firstname ?? "User"
                    : "Admin",
                RevenueChangePercent = Math.Round(revenueChange, 1),
                OrdersInProgress = ordersInProgress,
                QuotesAwaiting = quotesAwaiting
            },
            TodayRevenue = new MetricValueAmount { Amount = todayRevenue, ChangePercent = Math.Round(todayRevChange, 1) },
            TodayOrders = new MetricValueCount { Count = todayOrdersList.Count, ChangeFromAvg = Math.Round((decimal)todayOrdersChange, 1) },
            PendingPayments = new PendingPaymentsMetrics { Amount = pendingPaymentsAmount, OpenOrders = pendingPaymentsOrders.Count },
            TotalUsers = new MetricValueCount { Count = usersCount, ChangePercent = 0 },
            TotalOrders = new MetricValueCount { Count = allOrders.Count, ChangePercent = 0 },
            InProcessOrders = allOrders.Count(o => o.OrderStatus == "In Process"),
            MonthOrders = new MetricValueCount { Count = periodOrders.Count, ChangePercent = Math.Round(periodOrderChange, 1) },
            MonthInvoices = new MetricValueCount { Count = periodInvoices.Count, ChangePercent = Math.Round(periodInvoiceChange, 1) },
            MonthOrderValue = new MetricValueAmount { Amount = periodRevenue, ChangePercent = Math.Round(revenueChange, 1) },
            PendingMonth = periodOrders.Where(o => o.PaymentStatus != "Completed" && o.PaymentStatus != "Paid").Sum(o => ParseAmount(o.Amount)),
            OrderRevenueTrend = new OrderRevenueTrend
            {
                Week = trendWeek,
                Month = trendMonth,
                Year = trendYear
            },
            OrderStatus = new OrderStatusMetrics
            {
                Total = filteredOrders.Count,
                Completed = new StatusCountPercent { 
                    Count = filteredOrders.Count(o => o.OrderStatus == "Completed"), 
                    Percent = CalcPercent(filteredOrders.Count(o => o.OrderStatus == "Completed")) 
                },
                NewOrders = new StatusCountPercent { 
                    Count = filteredOrders.Count(o => o.OrderStatus == "Invoiced"), 
                    Percent = CalcPercent(filteredOrders.Count(o => o.OrderStatus == "Invoiced")) 
                },
                Pending = new StatusCountPercent { 
                    Count = filteredOrders.Count(o => o.OrderStatus == "Cancelled"), 
                    Percent = CalcPercent(filteredOrders.Count(o => o.OrderStatus == "Cancelled")) 
                },
                InProcess = new StatusCountPercent { 
                    Count = filteredOrders.Count(o => o.OrderStatus == "In Process" || o.OrderStatus == "New"), 
                    Percent = CalcPercent(filteredOrders.Count(o => o.OrderStatus == "In Process" || o.OrderStatus == "New")) 
                }
            },
            ServiceBreakdown = serviceBreakdown,
            RecentOrders = recentOrders,
            NewQuoteRequests = newQuoteRequests,
            RevenueByService = revenueByService,
            TopCustomers = topCustomers,
            ServiceStats = serviceStats,
            
            // Legacy Artwork Categories
            BasicArtworkCount = allOrders.Count(o => allServices.FirstOrDefault(s => s.ServiceId == o.ServiceId)?.ServiceName == "Basic Artwork"),
            ComplexArtworkCount = allOrders.Count(o => allServices.FirstOrDefault(s => s.ServiceId == o.ServiceId)?.ServiceName == "Complex Artwork"),
            DigitizingCount = allOrders.Count(o => allServices.FirstOrDefault(s => s.ServiceId == o.ServiceId)?.ServiceName == "Digitizing"),
            OtherArtworkCount = allOrders.Count(o => !new[] { "Basic Artwork", "Complex Artwork", "Digitizing" }.Contains(allServices.FirstOrDefault(s => s.ServiceId == o.ServiceId)?.ServiceName ?? ""))
        };

        return Ok(dto);
    }
}
