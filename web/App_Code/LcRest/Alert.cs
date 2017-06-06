using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// Alerts indicating steps for professionals and clients to complete
    /// </summary>
    public class Alert
    {
        public int alertID;
        public string alertName;
        public bool isRequired;
        public int displayRank;

        private bool isPositionSpecific;
        private int? positionID;

        private static Alert FromDB(dynamic record)
        {
            if (record == null) return null;

            return new Alert
            {
                alertID = record.AlertID,
                alertName = record.AlertName,
                isRequired = record.Required,
                displayRank = record.DisplayRank,
                isPositionSpecific = record.PositionSpecific,
                positionID = record.PositionID
            };
        }

        private const string sqlSelect = @"
                SELECT  A.AlertID,
                        A.AlertName,
                        A.DisplayRank,
                        A.Required,
                        A.PositionSpecific,
                        P.PositionID
                FROM    Alert As A
                INNER JOIN UserAlert As UA ON A.AlertID = UA.AlertID
                LEFT JOIN (
                        Positions As P
                         INNER JOIN
                        UserProfilePositions As UP
                          ON UP.PositionID = P.PositionID
                             AND UP.Active = 1
                             AND UP.StatusID > 0
                             AND UP.LanguageID = P.LanguageID
                             AND UP.CountryID = P.CountryID
                        )
                          ON P.PositionID = UA.PositionID
                             AND P.LanguageID = A.LanguageID
                             AND P.CountryID = A.CountryID
                             AND UP.UserID = UA.UserID
                WHERE AND A.Active = 1 AND UA.UserID = @0
                         AND A.LanguageID = @1 AND A.CountryID = @2
                         AND (UA.PositionID = 0 OR P.PositionID is not null)
                        -- Filtered optionally by position (-1 to not filter by position)
                         AND (UA.PositionID = 0 OR @3 = -1 OR UA.PositionID = @3)
                        AND A.Required = 1
                ORDER BY A.DisplayRank, A.AlertName
        ";

        public static List<Alert> GetActive(int userID, int positionID = -1)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(
                        sqlSelect, userID,
                        LcData.GetCurrentLanguageID(),
                        LcData.GetCurrentCountryID(),
                        positionID)
                .Select(FromDB)
                .ToList();
            }
        }

        /// <summary>
        /// Split a list of alerts into separate lists based on position/job title.
        /// </summary>
        /// <param name="alerts">List of alerts</param>
        /// <returns>Alerts separated by position/job title. The key is the positionID. Each
        /// list of alerts will include alerts specific for that positionID and any alert
        /// that is _not_ specific to a position.
        /// </returns>
        public static Dictionary<int, List<LcRest.Alert>> IndexByPosition(List<Alert> alerts)
        {
            var index = new Dictionary<int, List<LcRest.Alert>>();
            var nonPositionSpecificAlerts = new List<Alert>();

            alerts.ForEach(delegate(Alert alert)
            {
                if (!alert.isPositionSpecific)
                {
                    nonPositionSpecificAlerts.Add(alert);
                }
                else
                {
                    var positionID = alert.positionID.GetValueOrDefault();

                    if (!index.ContainsKey(positionID))
                    {
                        index[positionID] = new List<Alert>();
                    }

                    index[positionID].Add(alert);
                }
            });

            // for each position list, add non-position-specific alerts
            index.Values.ToList().ForEach(delegate(List<Alert> alertsList) 
            {
                alertsList.AddRange(nonPositionSpecificAlerts);
            });

            return index;
        }

        public static int GetActiveRequiredCount(int userID, int positionID = -1)
        {
            int required = 0;
            foreach (var alert in GetActive(userID, positionID))
            {
                if (alert.isRequired)
                    required++;
            }
            return required;
        }
    }
}
