using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// It manages a connection to the Loconomics database, through the WebMatrix.Data.Database API.
/// On instantiation, it creates a new connection, that its released on Dispose,
/// or allows to receive optionally a Database object for an already opened connection, 
/// that will be used instead of create a new one, and will NOT be released when calling
/// Dispose, because that responsability goes to the code that have instantiated the original
/// database connection. This makes easy to reuse opened connection without breaking other
/// code by disposing too soon while still makes use of 'using' C# keyboard for auto disposing
/// even on exceptions.
/// It works well too for tasks that can be executed individually or as part of a transaction
/// that could be started and committed by a parent task.
/// </summary>
public class LcDatabase : IDisposable
{
    WebMatrix.Data.Database db;
    private bool isShared;

    public Database Db
    {
        get
        {
            return db;
        }
    }

    public LcDatabase(Database db = null)
    {
        isShared = db != null;
        if (isShared)
            this.db = db;
        else
            this.db = Database.Open("sqlloco");
    }

    public LcDatabase(LcDatabase db)
    {
        // Reuse internal connection directly
        // (if null is passed in, the other method overload manage it :-)
        this.db = db.db;
        isShared = true;
    }

    public System.Data.Common.DbConnection Connection
    {
        get
        {
            return db.Connection;
        }
    }

    public void Close()
    {
        db.Close();
    }

    public void Dispose()
    {
        if (!isShared)
            db.Dispose();
    }

    public int Execute(string commandText, params object[] args)
    {
        return db.Execute(commandText, args);
    }

    public dynamic GetLastInsertId()
    {
        return db.GetLastInsertId();
    }

    public IEnumerable<dynamic> Query(string commandText, params object[] parameters)
    {
        return db.Query(commandText, parameters);
    }

    public dynamic QuerySingle(string commandText, params object[] args)
    {
        return db.QuerySingle(commandText, args);
    }

    public dynamic QueryValue(string commandText, params object[] args)
    {
        return db.QueryValue(commandText, args);
    }
}
