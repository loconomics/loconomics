using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// Descripción breve de LcRest.Feedback
    /// </summary>
    public class Feedback
    {
        #region Public Fields
        public int feedbackID;
        public int vocExperienceCategoryID;
        public int userID;
        public string message;
        public int vocElementID;
        public bool becomeACollaborator;
        public string userDevice;
        #endregion

        #region Create
        public static void PostFeedback(Feedback feedback)
        {
            using (var db = Database.Open("sqlloco"))
            {
                feedback.feedbackID = (int)db.QueryValue(@"
                INSERT INTO VOCFeedback (
                    VOCElementID,
                    VOCExperienceCategoryID,
                    UserID,
                    Feedback,
                    UserDevice,
                    CreatedDate,
                    UpdatedDate,
                    ModifiedBy
                ) VALUES (
                    @0, @1, @2, @3, @4,
                    getdate(),
                    getdate(),
                    'sys'
                )
                SELECT @@Identity
            ",
                 feedback.vocElementID,
                 feedback.vocExperienceCategoryID,
                 feedback.userID,
                 feedback.message,
                 feedback.userDevice);
            }
        }
        #endregion
    }
}