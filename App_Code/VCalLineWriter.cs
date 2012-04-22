using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace LcCommonLib
{   
    /// <summary>
    ///Calendar lines cannot exceed 76 characters, when they do they
    ///must be wrapped an indented with a space character
    ///the purpose of this class is to provide a string writer that will ensure
    ///these two conditios are met when generating an "ics file"
    ///<example>
    ///     usage:
    ///     
    ///     to create the following desired output ICAL snippet- 
    ///            DTSTART:20120319T180000Z
    ///            DTEND:20120319T190000Z
    ///            DTSTAMP:20120320T140751Z
    ///            UID:c2hbn5fflsjahpth0cehj5shug@google.com
    ///            ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=
    ///             TRUE;CN=coelho.patricka@gmail.com;X-NUM-GUESTS=0:mailto:coelho.patricka@gma
    ///             il.com
    ///     
    ///     VCalLineWriter cw = new VCalLineWriter();
    ///     cw.WriteLine(string.Format("DTSTART:", EventDetail.ServiceStartDate.ToUniversalTime().ToString(calDateFormat)));
    ///     cw.WriteLine(string.Format("DTEND:", EndTime.ToUniversalTime().ToString(calDateFormat)));
    ///     cw.WriteLine(string.Format("DTSTAMP:", DateTime.Now.ToUniversalTime().ToString("yyyyMMddTHHmmssZ")));
    ///     cw.WriteLine(string.Format("UID:{0}@google.com", Guid.NewGuid().ToString("N")));
    ///     cw.BufferedWrite("ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;");
    ///     cw.BufferedWrite(string.Format("X-NUM-GUESTS=0:mailto:{0};", EventDetail.ProviderEmail));
    ///     ...
    ///     string CalendarEventBody = cw.ToString();
    /// </example>
    /// </summary>
    public class VCalLineWriter
    {       
        /// <summary>
        ///rather than in heriting and overriding all the methods, we'll just wrap 
        ///the stringwriter class and restrict it
        /// </summary>
        StringWriter _sw = null;
        private const int MAX_LINE_LENGTH = 76;
        private const string SPACE = " ";
        private StringWriter buffer;
        private Int32 bufferLineLength = 0;
        private bool IsLineOne;

        public VCalLineWriter()
        {
            _sw = new StringWriter();
            buffer = new StringWriter();
        }

        /// <summary>
        /// The write method will ensure that only MAX_LINE_LENGTH characters are written to a line,
        /// if the MAX_LINE_LENGTH limit is exceeded, a new line followed by a space will be inserted.
        /// Note all content is written to an internal buffer.
        /// you must call "BufferedWriteEnd()" to write the buffer content to the main stringwriter
        /// or it will not appear in the final output.
        /// </summary>
        /// <param name="content">string</param>
        public void BufferedWrite(string content)
        {
            while(bufferLineLength + content.Length > MAX_LINE_LENGTH)
            {
                //Calculate the number of characters that can be added to the current line
                int carryoverCount = -1 * ( MAX_LINE_LENGTH - (bufferLineLength + content.Length)); //need to flip the number to positive
                int usableCount = content.Length - carryoverCount;

                //Write that number of characters to the current line
                buffer.WriteLine(content.Substring(0, usableCount));
                buffer.Write(SPACE);
                bufferLineLength = SPACE.Length; //reset for next line
               
                //Write the remaining characters
                content = content.Substring(usableCount); //reset content to the remaining string
                if (content.Length > 0)
                {
                    IsLineOne = false; //a line was just written, all following lines cannot be line 1
                }
            }

            if(content.Length > 0 )
            {
                bufferLineLength += content.Length;
                if(!IsLineOne)
                    buffer.Write(SPACE);
                buffer.Write(content);
            }
        }

        /// <summary>
        /// Writes to buffered stringwriter content to the main stringwriter for output
        /// </summary>
        public void BufferedWriteEnd()
        {
            buffer.Flush();
            _sw.WriteLine(buffer.ToString());

            //reinitialize buffer
            buffer = new StringWriter();
            bufferLineLength = 0;
            IsLineOne = true;
        }

        /// <summary>
        /// The writeline method will act like a normal writeline, however, it will ensure 
        /// that only MAX_LINE_LENGTH characters are written to a line, if the MAX_LINE_LENGTH
        /// limit is exceeded, a new line followed by a space will be inserted.
        /// </summary>
        /// <param name="content">string</param>
        public void WriteLine(string Line)
        {
            if (Line.Length > MAX_LINE_LENGTH)
            {
                BufferedWrite(Line);
                BufferedWriteEnd();
            }
            else
            {
                _sw.WriteLine(Line);
            }
        }
        
        /// <summary>
        /// This method is used to retrieve the contents of the writer
        /// </summary>
        /// <returns>string</returns>
        public override string ToString()
        {
            _sw.Flush();
            return _sw.ToString();
        }
        
    }
}
