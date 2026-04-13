using Lyco.Api.Data;
using Lyco.Api.Middleware;
using Lyco.Api.Repositories;
using Lyco.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers & Swagger ──────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Lyco API", Version = "v1" });
});

// ── Database ────────────────────────────────────────────────────────────────
// Connection string is in appsettings.json → "LycoDb"
// DO NOT run migrations — the DB already exists. EF will map to your tables.
builder.Services.AddDbContext<LycoDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("LycoDb")));

// ── Dependency Injection ─────────────────────────────────────────────────────
builder.Services.AddScoped<IServiceRepository, ServiceRepository>();
builder.Services.AddScoped<IServiceService, ServiceService>();

// ── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("LycoCors", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",   // Vite dev server
                "http://localhost:5174"    // fallback Vite port
            )
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// ── Middleware Pipeline ──────────────────────────────────────────────────────
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Lyco API v1"));
}

app.UseCors("LycoCors");
app.UseAuthorization();
app.MapControllers();

app.Run();
