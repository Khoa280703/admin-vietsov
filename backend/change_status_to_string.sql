-- ============================================
-- Script: Thay đổi cột Status từ int sang nvarchar
-- ============================================

USE test_post;
GO

-- Bước 1: Tạo cột tạm StatusTemp
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Articles')
    AND name = 'StatusTemp'
)
BEGIN
    ALTER TABLE [Articles]
    ADD [StatusTemp] NVARCHAR(50) NULL;

    PRINT 'Column StatusTemp added successfully';
END
GO

-- Bước 2: Convert dữ liệu từ số sang string
UPDATE [Articles]
SET [StatusTemp] = CASE [Status]
    WHEN 0 THEN 'draft'
    WHEN 1 THEN 'submitted'
    WHEN 2 THEN 'under_review'
    WHEN 3 THEN 'approved'
    WHEN 4 THEN 'rejected'
    WHEN 5 THEN 'published'
    ELSE 'draft'
END
WHERE [StatusTemp] IS NULL;
GO

-- Bước 3: Xóa index trên cột Status cũ (nếu có)
DECLARE @IndexName NVARCHAR(128);
SELECT TOP 1 @IndexName = i.name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('Articles')
  AND c.name = 'Status'
  AND i.name IS NOT NULL
  AND i.name NOT LIKE 'PK_%';

IF @IndexName IS NOT NULL
BEGIN
    EXEC('DROP INDEX [' + @IndexName + '] ON [Articles]');
    PRINT 'Dropped index: ' + @IndexName;
END
ELSE
BEGIN
    PRINT 'No index found on Status column';
END
GO

-- Bước 4: Xóa cột Status cũ
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Articles')
    AND name = 'Status'
)
BEGIN
    ALTER TABLE [Articles]
    DROP COLUMN [Status];

    PRINT 'Column Status (int) dropped successfully';
END
GO

-- Bước 5: Đổi tên StatusTemp thành Status
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('Articles')
    AND name = 'StatusTemp'
)
BEGIN
    EXEC sp_rename 'Articles.StatusTemp', 'Status', 'COLUMN';
    PRINT 'Column renamed from StatusTemp to Status';
END
GO

-- Bước 6: Set NOT NULL và default value
ALTER TABLE [Articles]
ALTER COLUMN [Status] NVARCHAR(50) NOT NULL;
GO

ALTER TABLE [Articles]
ADD CONSTRAINT [DF_Articles_Status] DEFAULT ('draft') FOR [Status];
GO

-- Bước 7: Tạo lại index trên cột Status
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('Articles')
    AND name = 'IX_Articles_Status'
)
BEGIN
    CREATE INDEX [IX_Articles_Status] ON [Articles] ([Status]);
    PRINT 'Index IX_Articles_Status created successfully';
END
GO

-- Bước 8: Kiểm tra kết quả
SELECT TOP 5
    Id,
    Title,
    Status,
    DATALENGTH(Status) AS StatusLength
FROM [Articles]
ORDER BY Id DESC;
GO

PRINT 'Migration completed successfully!';
GO

