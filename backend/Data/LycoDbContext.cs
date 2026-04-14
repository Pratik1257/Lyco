using System;
using System.Collections.Generic;
using Lyco.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lyco.Api.Data;

public partial class LycoDbContext : DbContext
{
    public LycoDbContext(DbContextOptions<LycoDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<BillingPaypalMaster> BillingPaypalMasters { get; set; }

    public virtual DbSet<CardDetail> CardDetails { get; set; }

    public virtual DbSet<CountryMst> CountryMsts { get; set; }

    public virtual DbSet<EmployeeMst> EmployeeMsts { get; set; }

    public virtual DbSet<EmployeeOrderMst> EmployeeOrderMsts { get; set; }

    public virtual DbSet<InvoiceMst> InvoiceMsts { get; set; }

    public virtual DbSet<InvoiceTransaction> InvoiceTransactions { get; set; }

    public virtual DbSet<OrderDetail> OrderDetails { get; set; }

    public virtual DbSet<OrderFileMst> OrderFileMsts { get; set; }

    public virtual DbSet<PriceMst> PriceMsts { get; set; }

    public virtual DbSet<PromotionMst> PromotionMsts { get; set; }

    public virtual DbSet<Quote> Quotes { get; set; }

    public virtual DbSet<ServiceMst> ServiceMsts { get; set; }

    public virtual DbSet<UserPriceMst> UserPriceMsts { get; set; }

    public virtual DbSet<UserRegistration> UserRegistrations { get; set; }

    public virtual DbSet<VendorMst> VendorMsts { get; set; }

    public virtual DbSet<VendorOrderMst> VendorOrderMsts { get; set; }

    public virtual DbSet<CurrencyMst> CurrencyMsts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BillingPaypalMaster>(entity =>
        {
            entity.ToTable("billingPaypalMaster");

            entity.Property(e => e.Email).HasMaxLength(50);
        });

        modelBuilder.Entity<CardDetail>(entity =>
        {
            entity.HasKey(e => e.CardId);

            entity.Property(e => e.Address1)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.Address2)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.AsRegistered)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.CardNo)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CardType)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.City)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Comments)
                .HasMaxLength(1000)
                .IsUnicode(false);
            entity.Property(e => e.Currency)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Cvv)
                .HasMaxLength(4)
                .IsUnicode(false)
                .IsFixedLength()
                .HasColumnName("CVV");
            entity.Property(e => e.ExpDate)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.FirstName)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.LastName)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Middlename)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Postcode)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.State)
                .HasMaxLength(250)
                .IsUnicode(false);

            entity.HasOne(d => d.Country).WithMany(p => p.CardDetails)
                .HasForeignKey(d => d.CountryId)
                .HasConstraintName("FK_CardDetails_CountryMst");

            entity.HasOne(d => d.User).WithMany(p => p.CardDetails)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_CardDetails_UserRegistration");
        });

        modelBuilder.Entity<CountryMst>(entity =>
        {
            entity.HasKey(e => e.CountryId);

            entity.ToTable("CountryMst");

            entity.Property(e => e.CountryName)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<EmployeeMst>(entity =>
        {
            entity.HasKey(e => e.EmployeeId);

            entity.ToTable("EmployeeMst");

            entity.Property(e => e.Address)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.City)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.DateCreated).HasColumnType("datetime");
            entity.Property(e => e.Email)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.FirstName)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.IsActive)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.IsDeleted)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.MobileNo)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Password)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.State)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<EmployeeOrderMst>(entity =>
        {
            entity.HasKey(e => e.EmployeeOrderId);

            entity.ToTable("EmployeeOrderMst");

            entity.Property(e => e.AssignedDate).HasColumnType("datetime");
            entity.Property(e => e.CompletedDate).HasColumnType("datetime");
            entity.Property(e => e.Instructions)
                .HasMaxLength(1000)
                .IsUnicode(false);
            entity.Property(e => e.OrderNo)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.OrderStatus)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.Employee).WithMany(p => p.EmployeeOrderMsts)
                .HasForeignKey(d => d.EmployeeId)
                .HasConstraintName("FK_EmployeeOrderMst_EmployeeMst");

            entity.HasOne(d => d.Order).WithMany(p => p.EmployeeOrderMsts)
                .HasForeignKey(d => d.OrderId)
                .HasConstraintName("FK_EmployeeOrderMst_OrderDetails");
        });

        modelBuilder.Entity<InvoiceMst>(entity =>
        {
            entity.HasKey(e => e.InvoiceId);

            entity.ToTable("InvoiceMst");

            entity.Property(e => e.Amount)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Description)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.InvoiceDate).HasColumnType("datetime");
            entity.Property(e => e.InvoiceNo)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.InvoiceUrl)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.Po)
                .HasMaxLength(250)
                .IsUnicode(false)
                .HasColumnName("PO");

            entity.HasOne(d => d.User).WithMany(p => p.InvoiceMsts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_InvoiceMst_UserRegistration");
        });

        modelBuilder.Entity<InvoiceTransaction>(entity =>
        {
            entity.ToTable("InvoiceTransaction");

            entity.Property(e => e.Amount)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.InvoiceId).HasColumnName("InvoiceID");
            entity.Property(e => e.OrderDate).HasColumnType("datetime");
            entity.Property(e => e.OrderId).HasColumnName("OrderID");
            entity.Property(e => e.OrderNo)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("OrderNO");

            entity.HasOne(d => d.Invoice).WithMany(p => p.InvoiceTransactions)
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InvoiceTransaction_InvoiceMst");

            entity.HasOne(d => d.Order).WithMany(p => p.InvoiceTransactions)
                .HasForeignKey(d => d.OrderId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InvoiceTransaction_OrderDetails");
        });

        modelBuilder.Entity<OrderDetail>(entity =>
        {
            entity.HasKey(e => e.OrderId);

            entity.Property(e => e.AdditionalInstructions)
                .HasMaxLength(1000)
                .IsUnicode(false);
            entity.Property(e => e.Amount)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CompletedDate).HasColumnType("datetime");
            entity.Property(e => e.Currency)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.EmployeeInstructions)
                .HasMaxLength(1000)
                .IsUnicode(false);
            entity.Property(e => e.FileFormat)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.Instructions).HasColumnType("text");
            entity.Property(e => e.InvoiceNo)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.InvoiceUrl)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.IsSecondary)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.OrderDate).HasColumnType("datetime");
            entity.Property(e => e.OrderNo)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.OrderState)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.OrderStatus)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Ordertype)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Orderuq)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.PaymentDate).HasColumnType("datetime");
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Size)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Sizetype)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Stitches)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Systransactionno)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("systransactionno");
            entity.Property(e => e.TransactionNo)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.WorkTitle)
                .HasMaxLength(250)
                .IsUnicode(false);

            entity.HasOne(d => d.Invoice).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("FK_OrderDetails_InvoiceMst");

            entity.HasOne(d => d.Service).WithMany(p => p.OrderDetails)
                .HasForeignKey(d => d.ServiceId)
                .HasConstraintName("FK_OrderDetails_ServiceMst");
        });

        modelBuilder.Entity<OrderFileMst>(entity =>
        {
            entity.HasKey(e => e.OrderFileId);

            entity.ToTable("OrderFileMst");

            entity.Property(e => e.FileName)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.FileStatus)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.FileUrl)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.LastModifiedBy)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.LastModifiedUserType)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.LastModifieddate).HasColumnType("datetime");
            entity.Property(e => e.OrderNo)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<PriceMst>(entity =>
        {
            entity.HasKey(e => e.PriceId);

            entity.ToTable("PriceMst");

            entity.Property(e => e.Currency)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Price)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Show)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();

            entity.HasOne(d => d.Service).WithMany(p => p.PriceMsts)
                .HasForeignKey(d => d.ServiceId)
                .HasConstraintName("FK_PriceMst_ServiceMst");
        });

        modelBuilder.Entity<PromotionMst>(entity =>
        {
            entity.HasKey(e => e.PromotionId);

            entity.ToTable("PromotionMst");

            entity.Property(e => e.Currency)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Price)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.PromoCode)
                .HasMaxLength(200)
                .IsUnicode(false);

            entity.HasOne(d => d.Service).WithMany(p => p.PromotionMsts)
                .HasForeignKey(d => d.ServiceId)
                .HasConstraintName("FK_PromotionMst_ServiceMst");
        });

        modelBuilder.Entity<Quote>(entity =>
        {
            entity.ToTable("Quote");

            entity.Property(e => e.Amount)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Currency)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.FileFormat)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.Instructions).HasColumnType("text");
            entity.Property(e => e.IsSecondary)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.QuoteDate).HasColumnType("datetime");
            entity.Property(e => e.QuoteNo)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.QuoteType)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Quoteuq)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Size)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Sizetype)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.WorkTitle)
                .HasMaxLength(250)
                .IsUnicode(false);

            entity.HasOne(d => d.Service).WithMany(p => p.Quotes)
                .HasForeignKey(d => d.ServiceId)
                .HasConstraintName("FK_QuoteDetails_ServiceMst");
        });

        modelBuilder.Entity<ServiceMst>(entity =>
        {
            entity.HasKey(e => e.ServiceId);

            entity.ToTable("ServiceMst");

            entity.Property(e => e.ServiceName)
                .HasMaxLength(100)
                .IsUnicode(false);
        });

        modelBuilder.Entity<UserPriceMst>(entity =>
        {
            entity.HasKey(e => e.UserPriceId);

            entity.ToTable("UserPriceMst");

            entity.Property(e => e.Currency)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.IsActive)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Price)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.Service).WithMany(p => p.UserPriceMsts)
                .HasForeignKey(d => d.ServiceId)
                .HasConstraintName("FK_UserPriceMst_ServiceMst");

            entity.HasOne(d => d.User).WithMany(p => p.UserPriceMsts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_UserPriceMst_UserRegistration");
        });

        modelBuilder.Entity<UserRegistration>(entity =>
        {
            entity.HasKey(e => e.UserId);

            entity.ToTable("UserRegistration");

            entity.Property(e => e.AccountEmail)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.Address1)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.Address2)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.City)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.Companyname)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.CreatedDate).HasColumnType("datetime");
            entity.Property(e => e.Currency)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Firstname)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.FirstnameS)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.HearAbout)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.IsActive)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.IsSecondary)
                .HasMaxLength(1)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.Lastname)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.LastnameS)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Middlename)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Password)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.PrimaryEmail)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.SecondaryEmail)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.State)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Telephone)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.UserType)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Username)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.VerifyCode)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.WebsiteUrl)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.Zipcode)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<VendorMst>(entity =>
        {
            entity.HasKey(e => e.VendorId);

            entity.ToTable("VendorMst");

            entity.Property(e => e.CompanyName)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.Email)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.FirstName)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Telephone)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.WebsiteUrl)
                .HasMaxLength(250)
                .IsUnicode(false)
                .HasColumnName("WebsiteURL");
        });

        modelBuilder.Entity<VendorOrderMst>(entity =>
        {
            entity.HasKey(e => e.VenderOrderId);

            entity.ToTable("VendorOrderMst");

            entity.Property(e => e.CompletedDate).HasColumnType("datetime");
            entity.Property(e => e.Email)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.FileType)
                .HasMaxLength(250)
                .IsUnicode(false);
            entity.Property(e => e.Instructions)
                .HasMaxLength(1000)
                .IsUnicode(false);
            entity.Property(e => e.OrderDate).HasColumnType("datetime");
            entity.Property(e => e.OrderNo)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.OrderStatus)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Rate)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Stitches)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.Vendor).WithMany(p => p.VendorOrderMsts)
                .HasForeignKey(d => d.VendorId)
                .HasConstraintName("FK_VendorOrderMst_VendorMst");
        });

        modelBuilder.Entity<CurrencyMst>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Currency__3214EC07A125FD79");

            entity.ToTable("CurrencyMst");

            entity.HasIndex(e => e.Code, "UQ__Currency__A25C5AA70CAD9CBB").IsUnique();

            entity.Property(e => e.Code)
                .HasMaxLength(10)
                .IsUnicode(true);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .IsUnicode(true);
            entity.Property(e => e.Symbol)
                .HasMaxLength(10)
                .IsUnicode(true);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
