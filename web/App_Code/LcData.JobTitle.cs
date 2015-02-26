using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Descripción breve de LcData
/// </summary>
public static partial class LcData
{
	public static class JobTitle
    {
        public static dynamic GetUserJobTitles(int userID, int jobTitleID = -1)
        {
            using (var db = Database.Open("sqlloco"))
            {
                return db.Query(@"
                    SELECT
                        UserID As userID,
                        PositionID As jobTitleID,
                        PositionIntro As intro,
                        StatusID As statusID,
                        CancellationPolicyID As cancellationPolicyID,
                        InstantBooking As instantBooking,
                        CreateDate As createdDate,
                        UpdatedDate As updatedDate
                    FROM
                        userprofilepositions
                    WHERE
                        UserID = @0
                         AND LanguageID = @1
                         AND CountryID = @2
                         AND Active = 1
                         AND StatusID > 0
                         AND (@3 = -1 OR @3 = PositionID)
                ", userID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID(), jobTitleID);
            }
        }

        public static dynamic GetJobTitle(int jobTitleID)
        {
            using (var db = Database.Open("sqlloco"))
            {
                var job = db.QuerySingle(@"
                    SELECT
                        PositionID As jobTitleID,
                        PositionSingular As singularName,
                        PositionPlural As pluralName,
                        Aliases As aliases,
                        PositionDescription As description,
                        PositionSearchDescription As searchDescription,
                        CreatedDate As createdDate,
                        UpdatedDate As updatedDate
                    FROM
                        positions
                    WHERE
                        PositionID = @0
                         AND LanguageID = @1
                         AND CountryID = @2
                         AND Active = 1
                ", jobTitleID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                if (job == null)
                {
                    return null;
                }
                else
                {
                    var pricings = db.Query(@"
                        SELECT
                            PricingTypeID As pricingTypeID,
                            ClientTypeID As clientTypeID,
                            CreatedDate As createdDate,
                            UpdatedDate As updatedDate
                        FROM
                            positionpricingtype
                        WHERE
                            PositionID = @0
                             AND LanguageID = @1
                             AND CountryID = @2
                             AND Active = 1
                    ", jobTitleID, LcData.GetCurrentLanguageID(), LcData.GetCurrentCountryID());

                    // Return an object that includes the collection of pricings
                    return new {
                        jobTitleID = job.jobTitleID,
                        singularName = job.singularName,
                        pluralName = job.pluralName,
                        aliases = job.aliases,
                        description = job.description,
                        searchDescription = job.searchDescription,
                        createdDate = job.createdDate,
                        updatedDate = job.updatedDate,
                        pricingTypes = pricings
                    };
                }
            }
        }
    }
}