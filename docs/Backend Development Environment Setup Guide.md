# Backend Development Environment Setup Guide
Our backend is an ASP.NET WebPages2 website with MS-SQL Server database.

## Minimum software requirements
- [Microsoft .NET Framework 4](https://www.microsoft.com/en-us/download/details.aspx?id=17851)
- [Visual Studio 2010](https://msdn.microsoft.com/en-us/library/dd831853) or above
- [MS SQL Express 2008 R2](https://www.microsoft.com/en-us/sql-server/sql-server-editions-express) or above

## Recommended operating system(s)
Microsoft Windows 7 SP1, Windows 10.

## Setting up a database
Discuss with [@iagosrl](mailto:iagosrl@gmail.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com) if you should connect to the dev database or create a local copy.

If creating a local database:
- use MS SQL Express 2008 R2 or above
- name your database loconomics (allows you to keep the default web.config settings).
- use "Integrated Security=SSPI": just add the Windows IIS user as owner of the loconomics database (named "IISUSR", "IIS APPPOOL\DefaultAppPool" or similar).

## IIS configuration
Register an asp.net app (name 'loconomics', for example) pointing to your project directory (subdirectory /web), that will result in the address: http://localhost/loconomics.
Set the app at an AppPool that uses ASP.NET 4.0.

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
You should only need FTP access if you're doing backend dev work on a Mac where you need to update server files. Otherwise, all testing can be done from your local machine. If you feel you need this for testing reasons, please contact [@iagosrl](mailto:iagosrl@gmail.com) or [@joshdanielson](mailto:joshua.danielson@loconomics.com). 
