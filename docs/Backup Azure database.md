# Backup Azure Database

Our hosting, Azure, performs some automatic backups of the databases that can be restored as a new hosted database. But at this document we cover when an offline (or local) database backup is wanted, for proposals like backup database inmediately before apply upgrade scripts, or to create a local database based on *dev* database to start backend development.

There are several approaches to get a copy of an Azure Database, as [can be found here](http://stackoverflow.com/questions/5475306/how-do-i-copy-sql-azure-database-to-my-local-development-server#5481143).

Next steps describe the SSIS method from the link, also know as using "Microsoft SQL Server Management Studio" (SSMS), with extra details for problems we found.

- Open SSMS as administrator.
- Create local empty database, SQL 2008 or newer, strictly with collation *SQL_Latin1_General_CP1_CI_AS* (see Note 1).
- Right-click database -> Tasks -> Import data.
- For source, choose ".Net Provider for SQL Server" and set the Azure connection string to the hosted database. This includes the following fields: 
  - Authentication: SqlPassword
  - Password 
  - User ID
  - Data Source
  - Initial Catalog: Dev
- For destination, choose "SQL Server Native Client 11" and choose the local server and our empty database.
- Continue the process, choose all "dbo." objects (usually all excluding one starting by "sys." and the views, "dbo.vw*"), do not edit mappings.
- Finish the process.

**Note 1:** a database created with a different collation than the source will lead to warnings about conversions between varchar columns (different size required for same data), and potentially an error in the process. The indicated collation is the default at Azure DB, but in case was manually changed check it running "SELECT DATABASEPROPERTYEX('TestDB', 'Collation')" (change TestDB by the database name).

**Note 2:** if any error appear, review the log messages clicking the link provided by SSMS and go to the last lines (more of the lines are just informative of successful sub-tasks). A well know error is one that happened with varchar/nvarchar columns that have a size bigger than 4000, that is the limit; on that cases, keep the window open, open an issue to request change the size of that columns to 4000 (since bigger of that makes no sense, is a mistake), then go back in process at the import window, edit the mappings changing the affected column to a size of 4000, re-create local database (process will fail if some data was already copied), and continue the process.
