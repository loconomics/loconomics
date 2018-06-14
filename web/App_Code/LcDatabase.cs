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
        isShared = db != null;
        if (isShared)
        {
            this.db = db.db;
        }
        else
        {
            this.db = Database.Open("sqlloco");
        }
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

    #region Extras
    /// <summary>
    /// Utility to replace a parameter in a SQL template with a list of values rather
    /// than a single value (something not supported natively).
    /// Example: having "SELECT * FROM T WHERE id IN (@0)" as sql, 0 as parameterIndex
    /// and new int[] { 1, 2, 3 } as values, result is "SELECT * FROM T WHERE id IN (1,2,3)"
    /// REMEMBER! The parameter index will get replaced and will not exist in the resulting SQL, but since
    /// others indexes get untouched you still need to provide a placeholder (null or anything) that will not get used
    /// except to compute properly the index of other values in a Query/Execute method.
    /// </summary>
    /// <param name="sql"></param>
    /// <param name="parameterIndex"></param>
    /// <param name="values">Only integers are valid right now, making it straightforward to prevent SQL injection</param>
    /// <param name="defaultWhenEmpty">When there are no elements in the list, this text value is used 'as is'. Take care
    /// that a SQL syntax like 'id IN ()' is not valid, so the default should include a well-know non existent value.
    /// Sometimes, you may want to check for this before and prevent running the query at all if is expected will not
    /// return results because of this (there are still legitimate cases when the query need to be executed anyway because
    /// other conditions matters and results are still posible)</param>
    /// <returns></returns>
    public string UseListInSqlParameter(string sql, int parameterIndex, IEnumerable<int> values, string defaultWhenEmpty)
    {
        var preparedValues = string.Join(",", values);
        if (preparedValues == "")
        {
            preparedValues = defaultWhenEmpty;
        }
        return sql.Replace("@" + parameterIndex, preparedValues);
    }
    #endregion
}
