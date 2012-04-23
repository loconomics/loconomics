using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;

namespace LcCommonLib
{
    /// <summary>
    /// Summary description for MailMessageTemplate
    /// </summary>
    public class MailMessageTemplate
    {
        const string NEWLINE = "\r\n";
        StringWriter _headerText;
        StringWriter _footerText;
        StringWriter _bodyText;
        string _messageText = string.Empty;

        StringWriter _headerHTML;
        StringWriter _footerHTML;
        StringWriter _bodyHTML;
        string _messageHTML = string.Empty;
        List<string> _relativeURIs;

        public List<string> RelativeURIs
        {
            get { return _relativeURIs; }
       }
        
        public string Greeting { get; set; }
        public string From { get; set; }
        public string FromDescription { get; set; }
        public string Subject { get; set; }
        public string BodyText
        {
            get
            {
                if (_messageText == string.Empty)
                {
                    StringWriter sw = new StringWriter();
                    sw.WriteLine(Greeting);
                    sw.WriteLine(_headerText.ToString());
                    sw.WriteLine(_bodyText.ToString());
                    sw.WriteLine(_footerText.ToString());
                     _messageText = sw.ToString();
                }
                return _messageText; 
            }
        }

        public string BodyHTML
        {
            get
            {
                if (_messageHTML == string.Empty)
                {
                    StringWriter sw = new StringWriter();
                    sw.WriteLine(string.Format("<p>{0}</p>{1}", Greeting, NEWLINE));
                    sw.WriteLine(string.Format("<p>{0}</p>{1}", _headerHTML.ToString(), NEWLINE));
                    sw.WriteLine(string.Format("<p>{0}</p>{1}", _bodyHTML.ToString(), NEWLINE));
                    sw.WriteLine(string.Format("<p>{0}</p>{1}", _footerHTML.ToString(), NEWLINE));
                    sw.WriteLine(NEWLINE);
                    _messageHTML = sw.ToString();
                }
                return _messageHTML;
            }
        }

        public MailMessageTemplate()
        {
            this._headerText = new StringWriter();
            this._bodyText = new StringWriter();
            this._footerText = new StringWriter();
            this._headerHTML = new StringWriter();
            this._bodyHTML = new StringWriter();
            this._footerHTML = new StringWriter();
            this._relativeURIs = new List<string>();
        }

        public void AddLink(string URL, string DisplayText)
        {
            AddLink(URL, DisplayText, string.Empty);
        }

        public void AddLink(string URL, string DisplayText, string HtmlButtonText)
        {
            //AddBodyText(string.Format(@"<a href='{0}'>{1}</a>", URL, DisplayText));
            Uri myUri = new Uri(URL);
            _relativeURIs.Add(myUri.PathAndQuery); //removes the BaseUri from the URL

            this._bodyText.WriteLine();
            this._bodyText.WriteLine(DisplayText);
            this._bodyText.WriteLine(URL);
            this._bodyText.WriteLine();

            string format = "{0}&nbsp;<a href='{1}'>{2}</a><br/>";
            string pretext = string.Empty;

            if (HtmlButtonText == string.Empty)
                HtmlButtonText = DisplayText;
            else
                pretext = DisplayText;

            this._bodyHTML.WriteLine(string.Format(format, pretext, URL, HtmlButtonText));
        }

        public void AddBodyText(string text)
        {
            this._bodyText.WriteLine(text);
            this._bodyHTML.WriteLine(string.Format("{0}<br>{1}", text,NEWLINE));
        }

        public void AddHeader(string text) 
        {
            this._headerText.WriteLine(text);
            this._headerHTML.WriteLine(string.Format("{0}<br>{1}", text, NEWLINE));
        }

        public void AddFooter(string text)
        {
            this._footerText.WriteLine(text);
            this._footerHTML.WriteLine(string.Format("{0}<br>{1}", text, NEWLINE));
        }
        
    }
}