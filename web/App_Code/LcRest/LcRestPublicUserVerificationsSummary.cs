using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

public class LcRestPublicUserVerificationsGroup
{
    public int verificationsCount;
    public string groupName;
    public string groupID;
    
    public static LcRestPublicUserVerificationsGroup FromDB(dynamic record)
    {
        if (record == null) return null;
        return new LcRestPublicUserVerificationsGroup {
            verificationsCount = record.verificationsCount,
            groupName = record.groupName,
            groupID = record.groupID
        };
    }
}

/// <summary>
/// Public User Rating stats/average
/// </summary>
public class LcRestPublicUserVerificationsSummary
{
    #region Fields
    public int total;
    public Dictionary<string, LcRestPublicUserVerificationsGroup> groups;
    #endregion

    #region SQL
    // @params: @0:UserID,@1:PositionID. PositionID special values: -1=global-rating, 0=client-rating, -2=freelance-jobprofile-rating
    private const string sqlSelect = @"
        SELECT  count(UV.UserID) As verificationsCount, V.SummaryGroup as groupName, V.Icon as groupID
        FROM    UserVerification As UV
                 RIGHT JOIN
                Verification As V
                  ON UV.VerificationID = V.VerificationID
                    AND UV.Active = 1
                    AND V.Active = 1
                    AND UV.VerificationStatusID = 1 -- Confirmed

        WHERE   UV.UserID = @0
                 AND
                (UV.PositionID = @1 
                    OR @1 = -1
                    OR (@1 = -2 AND UV.PositionID > 0))
                    
        GROUP BY V.SummaryGroup, V.Icon
        HAVING V.SummaryGroup is not null AND V.Icon is not null
            -- AND count(*) > 0
    ";
    #endregion
    
    #region Fetch
    /// <summary>
    /// 
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="jobTitleID">An specific ID or a special value from: -1=global-rating, 0=client-rating, -2=freelance-jobprofile-rating</param>
    /// <returns></returns>
    public static LcRestPublicUserVerificationsSummary Get(int userID, int jobTitleID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            var list = db.Query(sqlSelect, userID, jobTitleID)
            .Select(LcRestPublicUserVerificationsGroup.FromDB)
            .GroupBy(x => x.groupID)
            .ToDictionary(gdc => gdc.Key, gdc => gdc.FirstOrDefault());

            var count = 0;
            foreach(var g in list) {
                count += g.Value.verificationsCount;
            }
            
            return new LcRestPublicUserVerificationsSummary {
                total = count,
                groups = list
            };
        }
    }
    #endregion
}
