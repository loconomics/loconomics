# Backend Development Environment Setup Guide
Our backend is an ASP.NET WebPages2 website with MS-SQL Server database.

## Minimum software requirements
- [Microsoft .NET Framework 4.6.2](https://www.microsoft.com/en-us/download/details.aspx?id=48130)
  - Version 4.6.2 of .NET Framework is an in-place update to the versions 4/4.5/4.5.1/4.5.2/4.6/4.6.1. That means that, after install the update to 4.6.2 succesfully, at some points the system will still notice that the installed version is '4.0' (like IIS under Windows 7, or the system folder); [follow this instructions to verify the installed version](https://msdn.microsoft.com/en-us/library/hh925568(v=vs.110).aspx). Note to that Windows 10 comes with version 4.6 pre-installed and it updates with system updates, being the 4.6.2 included with the Anniversary Update.
- [Visual Studio 2010](https://msdn.microsoft.com/en-us/library/dd831853) or above
  - *Recommended:* [Microsoft Visual Studio Community 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48146) (it's free and complete).
- [MS SQL Server Express 2008 R2](https://www.microsoft.com/en-us/sql-server/sql-server-editions-express) or above
  - At the server we use Azure DB v12, that is highly compatible with, but not identical, MS SQL Server. T-SQL is *almost fully* compatible, but some details as system tables, system procedures or rarely used server features are not, [check the official list](https://docs.microsoft.com/en-us/azure/sql-database/sql-database-features); Azure DB keeps updating and increasing compatibility.

## Recommended operating system(s)
Microsoft Windows 7 SP1, Windows 10.

## Connecting to our dev database
Discuss with [@iagosrl](mailto:iagosrl@gmail.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com) if you should connect to the dev database or create a local copy.

If connecting to our dev database:
- Email [@iagosrl](mailto:iagosrl@gmail.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com) with:
  - Your Microsoft Live account email address.
  - The IP address(es) you'll be accessing the database from.

If creating a local database:
- use MS SQL Express 2008 R2 or above
- name your database loconomics (allows you to keep the default web.config settings).
- use "Integrated Security=SSPI": just add the Windows IIS user as owner of the loconomics database (named "IISUSR", "IIS APPPOOL\DefaultAppPool" or similar).
- to get the database contents, you will need a copy of the *dev* database, ask for an up-to-date one or temporary access in order [to perform a copy following this instructions](Backup Azure database.md).

## IIS configuration
Register an asp.net app (name 'loconomics', for example) pointing to your project directory (subdirectory /web), that will result in the address: http://localhost/loconomics.
Set the app at an AppPool that uses ASP.NET 4.0 (even on a system with 4.6.2 installed, the name may appear as '4.0' at IIS).

Follow the detailed instructions below if you need further clarification.

### Windows 7 users
- First install [url-rewrite](https://www.iis.net/downloads/microsoft/url-rewrite).
- Open the IIS management tools
- Go to your machine on the left menu and click "Places"
- Right click "Default Web Site" and "Add application"
- Set "loconomics" as an alias with a path pointing to the /web directory at your repository copy 
- Select an app pool that uses Microsoft .NET Framework 4
- Check the web.config file and ensure that you set-up your SQL database with the same settings (using the database name 'loconomics' and "Integrated Security") 
- If you have an error connecting, ensure the IIS Windows user has rights on the database
- The Visual Studio project (for VS 2010 or later) should work "as is", just open and compile 
- If any errors occur, please email [@iagosrl](mailto:iagosrl@gmail.com) with the errors you're experience and versions you're using.

#### About URL-Rewrite
[URL-Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite) is a module for IIS-7 and above that enables routing of URLs through the web.config files in a similar fashion than the popular Apache Rewrite rules (Apache mod_rewrite).
It is not included by default on Windows 7 so you must install it (it's free and from Microsoft). Newer versions of IIS *may* be included by default, and it's usually available from hosting providers.

## Set the new database as the source on your local host using Chrome/Firefox

If you set up your local asp.net server at http://localhost/loconomics, run the next line on your Browser console and refresh the page after:
```
localStorage["LoconomicsApp/config"] = '{"siteUrl":"http://localhost/loconomics"}';
```
If you have it set up directly under your localhost (without the virtual directory) enter:
```
localStorage["LoconomicsApp/config"] = '{"siteUrl":"http://localhost"}'; 
```
**Note:** When the app doesn't know the URL for the REST service, it will try with the URL from where it's being served the file, but the one used by 'grunt atwork' is localhost:8811, not your local asp.net server, so there is a need to tell the app to connect to the correct one.
To define the REST URL there are several ways, the one commented previously for development and another at file level: the html tag for the generated bundle has a data-site-url attribute, it allows to set-up the URL when deploying the app to mobile (since the mobile app runs locally and needs to work against our servers). Exception is the 'webapp' bundled, doesn't need that because it's served from the server and URL where the REST service is.

**In summary:** At start-up, the app looks for a siteUrl in the config key at localStorage, if it doesn't find one it then reads the html attribute data-site-url, if it doesn't find one there then it uses the document base URL.

## Testing Links
Requires API access. Request access from [@iagosrl](mailto:iagosrl@gmail.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com).

### API
http://dev.loconomics.com/tests/testrest

### Email Communications
http://dev.loconomics.com/tests/testmessaging 

### Pages (for testing db changes)
http://dev.loconomics.com/tests/TestAny 

## FTP Access
You should only need FTP access if you're doing backend dev work on a Mac where you need to update server files. Otherwise, all testing can be done from your local machine. 

If you feel you need this for testing reasons, follow these steps:
- Contact [@iagosrl](mailto:iagosrl@gmail.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com) describing the need.
  - If you don't already have a Microsoft Live account set up, [create one](https://signup.live.com/signup?wa=wsignin1.0&rpsnv=13&ct=1481762801&rver=6.7.6643.0&wp=MBI&wreply=https%3a%2f%2fwww.microsoft.com%2fen-us%2f&id=74335&aadredir=1&contextid=3FDDD7E6F0CF61A7&bk=1481762801&uiflavor=web&uaid=340040afa2a74692918de40df6f7e66c&mkt=EN-US&lc=1033&lic=1)
  - Email [@iagosrl](mailto:iagosrl@gmail.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com) with your Microsoft Live account email address.
- After [@iagosrl](mailto:iagosrl@gmail.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com) has confirmed you're added as a contributor, complete the following steps:
  - Log in into the [Azure Portal](https://portal.azure.com) using your Microsoft Live account email address
  - Ensure that you are in the correct directory (azureloconomics):
  ![screen shot 2016-12-14 at 4 56 22 pm](https://cloud.githubusercontent.com/assets/1202838/21208325/3fd0c6ac-c222-11e6-91cf-3e360e4f41d6.png)
  - Select "dev" from the resources dashboard and select "Deployment Credentials":
  ![screen shot 2016-12-14 at 5 14 32 pm](https://cloud.githubusercontent.com/assets/1202838/21208357/70f0162a-c222-11e6-84e8-575844643253.png)
  - Create an FTP/deployment username and password (at least one lowercase letter, one uppercase letter, a symbol, and a number)
  - Use the connection strings listed in Overview using your FTP software, e.g., [FileZilla](https://filezilla-project.org):
    - FTP/deployment username
    - FTP hostname
    - Password is the one you just created
    - Directory for app is: /site/wwwroot
    ![screen shot 2016-12-14 at 5 29 17 pm](https://cloud.githubusercontent.com/assets/1202838/21208487/1d00c46e-c223-11e6-906f-4a12c7e12ec6.png)
  
