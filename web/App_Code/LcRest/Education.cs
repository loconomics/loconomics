using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

namespace LcRest
{
    /// <summary>
    /// Education
    /// </summary>
    public class Education
    {
        #region Fields
        public int educationID;
        public int userID;
        internal int institutionID;
        public string institutionName;
        public string degreeCertificate;
        public string fieldOfStudy;
        public int? fromYearAttended;
        public int? toYearAttended;
        public DateTime? verifiedDate;
        internal string verifiedBy;
        public DateTime createdDate;
        public DateTime updatedDate;
        #endregion

        #region Instances
        public static Education FromDB(dynamic record)
        {
            if (record == null) return null;
            return new Education
            {
                educationID = record.educationID,
                userID = record.userID,
                institutionID = record.institutionID,
                institutionName = record.institutionName,
                degreeCertificate = record.degreeCertificate,
                fieldOfStudy = record.fieldOfStudy,
                fromYearAttended = (int?)record.fromYearAttended,
                toYearAttended = (int?)record.toYearAttended,
                verifiedDate = record.verifiedDate,
                verifiedBy = record.verifiedBy,
                createdDate = record.createdDate,
                updatedDate = record.updatedDate
            };
        }
        #endregion

        #region SQL
        const string sqlSelect = @"
            SELECT  E.UserEducationId As educationID,
                    E.userID,
                    E.institutionID
                    ,E.degreeCertificate
                    ,E.fieldOfStudy
                    ,E.fromYearAttended
                    ,E.toYearAttended
                    ,I.institutionName
                    ,E.verifiedDate
                    ,E.verifiedBy
                    ,E.createdDate
                    ,E.modifiedDate As updatedDate
            FROM    UserEducation As E
                     INNER JOIN
                    Institution As I
                      ON E.InstitutionID = I.InstitutionID
        ";
        const string sqlWhereUser = @"
            WHERE   UserID = @0
                     AND
                    Active = 1
            ORDER BY ToYearAttended DESC, FromYearAttended DESC
        ";
        const string sqlWhereID = @"
            WHERE   UserID = @0 AND UserEducationID = @1 AND Active = 1
        ";

        const string sqlDelete = @"
            DELETE FROM UserEducation
            WHERE UserEducationID = @0
                    AND UserID = @1

            -- ReCheck Alert
            EXEC TestAlertEducation @1
        ";

        const string sqlGetOrInsertInstitution = @"
            DECLARE @id int
            SELECT @id = InstitutionID
            FROM    Institution
            WHERE   InstitutionName like @0

            IF @id is null BEGIN
                INSERT INTO Institution (
                    InstitutionName
                    ,StateProvinceID
                    ,CountryID
                    ,CreatedDate
                    ,UpdatedDate
                    ,ModifiedBy
                ) VALUES (
                    @0
                    ,@1
                    ,@2
                    ,getdate()
                    ,getdate()
                    ,'UserID' + Cast(@3 as varchar)
                )

                SET @id = @@IDENTITY
            END

            SELECT @id As ID
        ";

        const string sqlSet = @"
            DECLARE @EducationID int
            SET @EducationID = @0

            IF EXISTS (SELECT UserEducationID FROM UserEducation WHERE UserEducationID = @EducationID AND UserID = @1)
                UPDATE UserEducation SET
                    InstitutionID = @2
                    ,DegreeCertificate = @3
                    ,FieldOfStudy = @4
                    ,FromYearAttended = @5
                    ,ToYearAttended = @6
                    ,Active = 1
                    ,ModifiedDate = getdate()
                    ,ModifiedBy = 'UserID:' + Cast(@1 as varchar)
                WHERE UserEducationID = @EducationID AND UserID = @1
            ELSE BEGIN
                INSERT INTO UserEducation (
                    UserID
                    ,InstitutionID
                    ,DegreeCertificate
                    ,FieldOfStudy
                    ,FromYearAttended
                    ,ToYearAttended
                    ,CreatedDate
                    ,ModifiedDate
                    ,ModifiedBy
                    ,Active
                ) VALUES (
                    @1
                    ,@2
                    ,@3
                    ,@4
                    ,@5
                    ,@6
                    ,getdate()
                    ,getdate()
                    ,'UserID:' + Cast(@1 as varchar)
                    ,1
                )
                SET @EducationID = @@IDENTITY
            END

            -- ReCheck Alert
            EXEC TestAlertEducation @1

            SELECT @EducationID As ID
        ";
        #endregion

        #region Fetch
        public static Education Get(int userID, int educationID)
        {
            using (var db = new LcDatabase())
            {
                return FromDB(db.QuerySingle(sqlSelect + sqlWhereID, userID, educationID));
            }
        }

        public static List<Education> GetList(int userID)
        {
            using (var db = new LcDatabase())
            {
                return db.Query(sqlSelect + sqlWhereUser, userID)
                .Select(FromDB)
                .ToList();
            }
        }
        #endregion

        #region Delete
        /// <summary>
        /// Delete an education record.
        /// </summary>
        /// <param name="userID"></param>
        /// <param name="educationID"></param>
        public static void Delete(int userID, int educationID)
        {
            using (var db = new LcDatabase())
            {
                db.Execute(sqlDelete, educationID, userID);
            }
        }
        #endregion

        #region Create/Update
        public static int Set(Education education, Database sharedDb = null)
        {
            using (var db = new LcDatabase(sharedDb))
            {
                // Get the home as reference address to insert the new institution,
                // even if there are lot of chances of error with this assumption, is
                // better than nothing and we need to fill that fields.
                var referenceAddress = Address.GetHomeAddress(education.userID);

                // Gets the ID for 'institution', creating a new one automatically or from
                // existing one.
                education.institutionID = db.QueryValue(sqlGetOrInsertInstitution,
                    education.institutionName,
                    referenceAddress.stateProvinceID,
                    referenceAddress.countryID,
                    education.userID
                );

                return (int)db.QueryValue(sqlSet,
                    education.educationID,
                    education.userID,
                    education.institutionID,
                    education.degreeCertificate,
                    education.fieldOfStudy,
                    education.fromYearAttended,
                    education.toYearAttended
                );
            }
        }
        #endregion
    }
}