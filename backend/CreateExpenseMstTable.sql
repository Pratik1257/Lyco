-- ============================================================
-- Create ExpenseMst table in LycoDB
-- Run this script against your SQL Server database before
-- starting the backend.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExpenseMst')
BEGIN
    CREATE TABLE [dbo].[ExpenseMst] (
        [ExpenseId]    BIGINT         IDENTITY(1,1) NOT NULL,
        [ServiceId]    BIGINT         NULL,
        [Title]        VARCHAR(250)   NULL,
        [Amount]       DECIMAL(18,2)  NULL,
        [Currency]     VARCHAR(50)    NULL,
        [ExpenseDate]  DATETIME       NULL,
        [Notes]        VARCHAR(1000)  NULL,
        [CreatedDate]  DATETIME       NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_ExpenseMst] PRIMARY KEY CLUSTERED ([ExpenseId] ASC),
        CONSTRAINT [FK_ExpenseMst_ServiceMst] FOREIGN KEY ([ServiceId])
            REFERENCES [dbo].[ServiceMst] ([ServiceId])
    );
END
GO
