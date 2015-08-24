using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Public User profile information from a subset of [users] table
/// for the REST API when accessed by other users (public fields are
/// more limited than ones the owner user can see),
/// and static methods for database operations.
/// Some fields are empty/null because of level of rights, exposed
/// only to requester users that has a relationship with the requested
/// user profile (thats, there is a ProviderCustomer record for the pair).
/// Records are not returned if profile is not enabled
/// </summary>
public class LcRestPublicUserProfile
{
    #region Fields
    public int userID;
    public string firstName;
    public string lastName;
    public string secondLastName;
    public string businessName;
    
    /// Fields protected, empty/null except for users that has a relationship together
    public string email;
    public string phone;
   
    public bool isFreelancer;
    public bool isCustomer;
    // TODO To decide if expose this publicly
    //public bool isMember;

    public DateTime updatedDate;
    #endregion

    public static LcRestPublicUserProfile FromDB(dynamic record)
    {
        if (record == null) return null;
        return new LcRestPublicUserProfile {
            userID = record.userID,
            email = record.email,

            firstName = record.firstName,
            lastName = record.lastName,
            secondLastName = record.secondLastName,
            businessName = record.businessName,

            phone = record.phone,

            isFreelancer = record.isFreelancer,
            isCustomer = record.isCustomer,
            //isMember = record.isMember,

            updatedDate = record.updatedDate
        };
    }

    #region SQL
    private const string sqlSelectProfile = @"
        SELECT TOP 1
            -- ID
            Users.userID

            -- Name
            ,firstName
            ,lastName
            ,secondLastName
            ,businessName

            -- User Type
            ,isProvider as isFreelancer
            ,isCustomer
            ,isMember

            ,CASE WHEN PC.Active = 1 THEN UP.email ELSE null END as Email
            ,CASE WHEN PC.Active = 1 THEN Users.MobilePhone ELSE null END As phone

            ,Users.updatedDate

        FROM Users
                INNER JOIN
            UserProfile As UP
                ON UP.UserID = Users.UserID
                LEFT JOIN
            ProviderCustomer As PC
                ON
                (   PC.ProviderUserID = @0 AND PC.CustomerUserID = @1
                 OR PC.ProviderUserID = @1 AND PC.CustomerUserID = @0 )
        WHERE Users.UserID = @0
          AND Users.Active = 1
    ";
    #endregion

    #region Fetch
    public static LcRestPublicUserProfile Get(int userID, int requesterUserID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return FromDB(db.QuerySingle(sqlSelectProfile, userID, requesterUserID));
        }
    }
    #endregion
}
