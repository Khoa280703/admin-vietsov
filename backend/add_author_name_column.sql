-- ============================================
-- Script: Thêm cột AuthorName vào bảng Articles
-- ============================================

USE test_post;
GO

-- Kiểm tra và thêm cột AuthorName nếu chưa tồn tại
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('Articles') 
    AND name = 'AuthorName'
)
BEGIN
    ALTER TABLE [Articles]
    ADD [AuthorName] NVARCHAR(255) NULL;
    
    PRINT 'Column AuthorName added successfully to Articles table';
END
ELSE
BEGIN
    PRINT 'Column AuthorName already exists in Articles table';
END
GO

-- Kiểm tra kết quả
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Articles'
AND COLUMN_NAME = 'AuthorName';
GO

