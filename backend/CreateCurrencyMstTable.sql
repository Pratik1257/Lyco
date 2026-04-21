-- ============================================================
-- Create CurrencyMst table in LycoDB
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CurrencyMst')
BEGIN
    CREATE TABLE [dbo].[CurrencyMst] (
        [Id]         INT           IDENTITY(1,1) NOT NULL,
        [Code]       NVARCHAR(10)  NOT NULL,
        [Name]       NVARCHAR(50)  NOT NULL,
        [Symbol]     NVARCHAR(10)  NOT NULL,
        [IsActive]   BIT           NOT NULL DEFAULT 1,
        [CreatedAt]  DATETIME      NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_CurrencyMst] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [UQ_CurrencyMst_Code] UNIQUE ([Code])
    );

    -- Insert default currencies
    INSERT INTO [dbo].[CurrencyMst] ([Code], [Name], [Symbol])
    VALUES 
    ('USD', 'US Dollar', '$'),
    ('INR', 'Indian Rupee', N'₹'),
    ('EUR', 'Euro', N'€'),
    ('GBP', 'British Pound', N'£');
END
GO
