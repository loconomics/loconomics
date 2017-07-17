using Newtonsoft.Json;
using System;

namespace LcRest
{
    public class OwnerAcknowledgment
    {
        #region Fields
        public int userID;
        public DateTimeOffset dateAcknowledged;
        public string acknowledgedFromIP;
        [JsonIgnore]
        public string detectedIPs;
        public DateTimeOffset createdDate;
        public DateTimeOffset updatedDate;
        #endregion

        #region Instance
        public static OwnerAcknowledgment FromDB(dynamic record)
        {
            if (record == null) return null;

            return new OwnerAcknowledgment
            {
                userID = record.userID,
                dateAcknowledged = record.dateAcknowledged,
                acknowledgedFromIP = record.acknowledgedFromIP,
                detectedIPs = record.detectedIPs,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region Fetch
        const string sqlGet = @"
            SELECT
                o.userID,
                o.dateAcknowledged,
                o.acknowledgedFromIP,
                o.detectedIPs,
                o.createdDate,
                o.updatedDate
            FROM    OwnerAcknowledgment As o
            WHERE   o.userID = @0
        ";

        /// <summary>
        /// Get the record by user
        /// </summary>
        /// <param name="userDI"></param>
        /// <returns></returns>
        public static OwnerAcknowledgment Get(int userID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlGet, userID));
            }
        }
        #endregion

        #region Persist on DB
        /// <summary>
        /// Insert or Update SQL.
        /// </summary>
        const string sqlSet = @"
            UPDATE OwnerAcknowledgment SET
                dateAcknowledged = @1,
                acknowledgedFromIP = @2,
                detectedIPs = @3,
                updatedDate = SYSDATETIMEOFFSET()
            WHERE
                userID = @0

            IF @@rowcount = 0 BEGIN
                INSERT INTO OwnerAcknowledgment(
                    userID,
                    dateAcknowledged, acknowledgedFromIP,
                    detectedIPs,
                    createdDate, updatedDate
                ) VALUES (
                    @0,
                    @1, @2,
                    @3,
                    SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET()
                )
            END
        ";
        public static void Set(OwnerAcknowledgment data)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlSet,
                    data.userID,
                    data.dateAcknowledged,
                    data.acknowledgedFromIP,
                    data.detectedIPs
                );
            }
        }
        #endregion

        #region Utilities
        /// <summary>
        /// Automatically detects the IP of the user from the Request object
        /// filling the acknowledgedFromIP field, and detectedIPs with
        /// all the ones detected with name (because there are several sources
        /// of the IP, and at some cases the one that looks 'the best' may not
        /// be the correct one, so we still store everything we know.
        /// 
        /// More info: https://stackoverflow.com/questions/735350/how-to-get-a-users-client-ip-address-in-asp-net
        /// </summary>
        public void DetectIP(System.Web.HttpRequestBase request)
        {
            // Is the same as request.ServerVariables["REMOTE_ADDR"]
            // and means the client that reaches this server; but may
            // be a proxy and not the original source
            var directClientIP = N.DW(request.UserHostAddress);

            // List of IPs as result of proxies forwarding the request
            string forwardedIPs = request.ServerVariables["HTTP_X_FORWARDED_FOR"];
            // The first one is the client, others are just proxies
            string forwardedClientIP = null;
            if (!string.IsNullOrEmpty(forwardedIPs))
            {
                forwardedClientIP = N.DW(forwardedIPs.Split(',')[0]);
            }

            // Noticed by a cluster
            var insideClusterIP = N.DW(request.ServerVariables["HTTP_X_CLUSTER_CLIENT_IP"]);

            // Storing all of them
            detectedIPs = "Remote_addr=" + directClientIP + ", Cluster=" + insideClusterIP + ", Forwarded=" + forwardedIPs;

            // Get the best guess
            acknowledgedFromIP = insideClusterIP ?? forwardedClientIP ?? directClientIP;
        }
        #endregion

        public static bool MeetsOwnsershipRequirement(int userID)
        {
            var sql = @"
            DECLARE @UserID = @0
            DECLARE @hasAcknowledgment bit = 0

			IF EXISTS (
				SELECT *
				FROM OwnerAcknowledgment
				WHERE UserID = @UserID
					AND DateAcknowledged is not null
			)
			BEGIN
				SET @hasAcknowledgment = 1
			END

            SELECT @hasAcknowledgment
            ";
            using (var db = new LcDatabase())
            {
                return (bool)db.QueryValue(sql, userID);
            }
        }
    }
}
