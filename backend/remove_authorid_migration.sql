-- Migration Script: Remove AuthorId column from Articles table
-- WARNING: This will remove the AuthorId column. Make sure you have a backup!
-- AuthorId is currently used to track article authors. Consider keeping it.

USE test_post;
GO

-- Step 1: Drop foreign key constraint
IF EXISTS (
    SELECT * FROM sys.foreign_keys 
    WHERE name = 'FK_Articles_Users_AuthorId'
)
BEGIN
    ALTER TABLE [Articles] DROP CONSTRAINT [FK_Articles_Users_AuthorId];
    PRINT 'Dropped foreign key constraint FK_Articles_Users_AuthorId';
END
GO

-- Step 2: Drop index on AuthorId
IF EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_Articles_AuthorId' AND object_id = OBJECT_ID('Articles')
)
BEGIN
    DROP INDEX [IX_Articles_AuthorId] ON [Articles];
    PRINT 'Dropped index IX_Articles_AuthorId';
END
GO

-- Step 3: Drop AuthorId column
IF EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Articles') AND name = 'AuthorId'
)
BEGIN
    ALTER TABLE [Articles] DROP COLUMN [AuthorId];
    PRINT 'Dropped column AuthorId from Articles table';
END
ELSE
BEGIN
    PRINT 'Column AuthorId does not exist in Articles table';
END
GO

PRINT 'Migration completed successfully!';
GO

