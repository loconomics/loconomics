using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;

/// <summary>
/// Wrapper for list that lets us return null or default(T) for non existant items of the list.
/// Based on UrlDataList (its internal).
/// 
/// Its read-only, items must be populated on constructor.
/// </summary>
public class OptionalItemsList<T> : IList<T>
{
    private List<T> _data;

    /// <summary>
    /// Since is read-only, an empty constructor has only sense on private
    /// </summary>
    private OptionalItemsList()
    {
        _data = new List<T>();
    }

    public OptionalItemsList(IEnumerable<T> list)
    {
        _data = list.ToList<T>();
    }

    public static OptionalItemsList<string> FromUrlPath(string pathInfo)
    {
        if (String.IsNullOrEmpty(pathInfo))
        {
            return new OptionalItemsList<string>();
        }
        else
        {
            return new OptionalItemsList<string>(pathInfo.Split(new char[] { '/' }).ToList());
        }
    }

    public int Count
    {
        get { return _data.Count; }
    }

    public bool IsReadOnly
    {
        get { return true; }
    }

    public T this[int index]
    {
        get
        {
            // NOTE: Fixed < 0 cases, passing default too
            if (index >= _data.Count || index < 0)
            {
                return default(T);
            }
            return _data[index];
        }
        set { throw new NotSupportedException("Read Only"); }
    }

    public int IndexOf(T item)
    {
        return _data.IndexOf(item);
    }

    public void Insert(int index, T item)
    {
        throw new NotSupportedException("Read Only");
    }

    public void RemoveAt(int index)
    {
        throw new NotSupportedException("Read Only");
    }

    public void Add(T item)
    {
        throw new NotSupportedException("Read Only");
    }

    public void Clear()
    {
        throw new NotSupportedException("Read Only");
    }

    public bool Contains(T item)
    {
        return _data.Contains(item);
    }

    public void CopyTo(T[] array, int arrayIndex)
    {
        _data.CopyTo(array, arrayIndex);
    }

    public bool Remove(T item)
    {
        throw new NotSupportedException("Read Only");
    }

    public IEnumerator<T> GetEnumerator()
    {
        return _data.GetEnumerator();
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return _data.GetEnumerator();
    }
}