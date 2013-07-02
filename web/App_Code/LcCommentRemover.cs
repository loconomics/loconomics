using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Text;

/// <summary>
/// Remove comments from a source code string.
/// Based on project https://cnbthcommentremover.codeplex.com,
/// Andrey Mikhaylin (Cenobith), 2008
/// Adapted as utility instead of console program that works
/// both with strings and files with intermiadate streams,
/// comments translated and added some more, more versatil methods
/// and 'sql' specific ones.
/// IagoSRL @ Loconomics 2013
/// 
/// TODO:
/// It does NOT manage cases for comment marks inside literal text.
/// </summary>
public static class LcCommentRemover
{
    /// <summary>
    /// Remove comments from a Sql source, returning the new, clean string.
    /// </summary>
    /// <param name="source"></param>
    /// <returns></returns>
    public static string Sql(string source)
    {
        // Pass string as stream
        byte[] byteArray = Encoding.ASCII.GetBytes( source );
        var output = new MemoryStream();
        using (StreamReader srd = new StreamReader(new MemoryStream( byteArray )))
        using (StreamWriter swr = new StreamWriter(output)) {
            // Remove comments
            Remove("plsql", srd, swr);

            // Returns stream as string
            using (var sout = new StreamReader(output))
                return sout.ReadToEnd();
        }
    }
    /// <summary>
    /// Remove comments from a Sql file at path @sourcefile and write
    /// it to @outputFile
    /// </summary>
    /// <param name="sourceFile"></param>
    /// <param name="outputFile"></param>
    public static void Sql(string sourceFile, string outputFile) {
        using (StreamReader srd = new StreamReader(sourceFile, Encoding.Default))
        using (StreamWriter swr = new StreamWriter(outputFile, false, Encoding.Default))
            Remove("plsql", srd, swr);
    }
    /// <summary>
    /// Remove comments for different source languages, from a stream to another strean
    /// </summary>
    /// <param name="language">Allowed: "c", "plsql", "delphi"</param>
    /// <param name="srd"></param>
    /// <param name="swr"></param>
    private static void Remove(string language, StreamReader srd, StreamWriter swr)
    {
        string sl="";
        string mlstart="";
        string mlstop="";

        switch (language)
        {
            case "c":
                sl = "//";
                mlstart = "/*";
                mlstop = "*/";
                break;
            case "plsql":
                sl = "--";
                mlstart = "/*";
                mlstop = "*/";
                break;
            case "delphi":
                sl = "//";
                mlstart = "{";
                mlstop = "}";
                break;
        }

        int ss = 0; //Number of single line comments removed
        int ms = 0; //Number of multi line comments removed
        string s; // Line string        

        // Iterate each line from source reader
        bool mlc = false; // Marks when we are inside a multi line comment
        while (!srd.EndOfStream)
        {
            s = srd.ReadLine();
            StringBuilder ts = new StringBuilder();
            int t;
            if (!mlc)
            {
                t = s.IndexOf(mlstart);
                if (t != -1) // Found multi-line comment begin.
                {
                    ms++;
                    ts.Append(s.Substring(0, t));
                    int f = s.IndexOf(mlstop);
                    if (f != -1) // Found multi-line comment stop, inside the same line that the begin.
                    {
                        if (f != s.Length - 1)
                            ts.Append(s.Substring(f+mlstop.Length, s.Length - (f+mlstop.Length)));
                        mlc = false;
                    }
                    else
                        mlc = true;
                }
                else
                {
                    t = s.IndexOf(sl);
                    if (t != -1) // Found single-line comment
                    {
                        ts.Append(s.Substring(0, t));
                        ss++;
                    }
                    else
                        ts.Append(s);
                }
            }
            else
            {
                t = s.IndexOf(mlstop);
                if (t != -1) // Found multi-line comment stop, in a different line from the begin.
                {
                    ts.Append(s.Substring(t+mlstop.Length, s.Length-(t+mlstop.Length)));
                    mlc = false;
                }
            }
            if (ts.ToString()!="")
                swr.WriteLine(ts.ToString());
        }
        // Debug
        //Console.WriteLine("Singleline comments removed: {0}", ss);
        //Console.WriteLine("Multiline comments removed: {0}", ms);
    }
}