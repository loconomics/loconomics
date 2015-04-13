using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Descripción breve de LcRestCustomer
/// </summary>
public class LcRestCustomer
{
    #region Fields
    public int customerUserID;
    public string email;
    public string firstName;
    public string lastName;
    public string secondLastName;
    public string phone;
    public bool canReceiveSms;
    public int? birthMonthDay;
    public int? birthMonth;
    public string notesAboutCustomer;
    public DateTime? createdDate;
    public DateTime? updatedDate;
    /// <summary>
    /// Editable is a special computed value, is true only
    /// when the customer account status is 6:Freelancer's Client (AKA 'client created and managed by a freelancer')
    /// and the customer's user.ReferredByUserID is the freelancer querying
    /// the data.
    /// </summary>
    public bool editable;
    #endregion

    #region Static Constructors
    public static LcRestCustomer FromDB(dynamic record)
    {
        if (record == null) return null;
        return new LcRestCustomer {
            customerUserID = record.customerUserID,
            email = record.email,
            firstName = record.firstName,
            lastName = record.lastName,
            secondLastName = record.secondLastName,
            phone = record.phone,
            canReceiveSms = record.canReceiveSms,
            birthMonthDay = record.birthMonthDay,
            birthMonth = record.birthMonth,
            notesAboutCustomer = record.notesAboutCustomer,
            createdDate = record.createdDate,
            updatedDate = record.updatedDate,
            editable = record.editable
        };
    }
    #endregion

    #region SQL
    private const string sqlSelect = @"SELECT ";
    private const string sqlSelectOne = @"SELECT TOP 1 ";
    private const string sqlFields = @"
                pc.CustomerUserID as customerUserID
                ,up.Email as email
                ,uc.FirstName as firstName
                ,uc.LastName as lastName
                ,uc.SecondLastName as secondLastName
                ,uc.MobilePhone as phone
                ,uc.CanReceiveSms as canReceiveSms
                ,uc.BirthMonthDay as birthMonthDay
                ,uc.BirthMonth as birthMonth
                ,pc.NotesAboutCustomer as notesAboutCustomer
                ,pc.CreatedDate as createdDate
                ,pc.UpdatedDate as updatedDate
                ,(CASE WHEN uc.AccountStatusID = 6 AND uc.ReferredByUserID = @0 THEN Cast(1 as bit) ELSE Cast(0 as bit) END) as editable
        FROM    ProviderCustomer As pc
                 INNER JOIN
                Users As uc
                  ON uc.UserID = pc.CustomerUserID
                 INNER JOIN
                UserProfile As up
                  ON up.UserID = uc.UserID
        WHERE   pc.Active = 1
                 AND uc.Active = 1
                 AND pc.ProviderUserID = @0
    ";
    private const string sqlAndCustomerUserID = @"
        AND pc.CustomerUserID = @1
    ";
    #endregion

    #region Fetch
    public static List<LcRestCustomer> GetFreelancerCustomers(int freelancerUserID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(sqlSelect + sqlFields,
                freelancerUserID)
                .Select(FromDB)
                .ToList();
        }
    }

    public static LcRestCustomer GetFreelancerCustomer(int freelancerUserID, int customerUserID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            // Parameter jobTitleID needs to be specified as 0 to avoid to join
            // the service-address table
            // Null value as 3th parameter since that placeholder is reserved for addressID
            // NOTE: Home address must exists ever, created on sign-up (GetSingleFrom
            // takes care to return null if not exists, but on this case is not possible
            // --or must not if not corrupted user profile)
            return GetSingleFrom(db.Query(
                sqlSelectOne + sqlFields + sqlAndCustomerUserID,
                freelancerUserID,
                customerUserID
            ));
        }
    }

    private static LcRestCustomer GetSingleFrom(IEnumerable<dynamic> dbRecords)
    {
        var add = dbRecords
            .Select(FromDB)
            .ToList();

        if (add.Count == 0)
            return null;
        else
            return add[0];
    }
    #endregion

    #region Search
    /// <summary>
    /// A public search performs a search in all the database/marketplace users
    /// for an exact match of full name OR email OR phone. Only if one of them
    /// matches completely, the record is included in the results.
    /// The given freelancerUserID is used to exclude results: if the match is
    /// already a freelancer's customer, is excluded. The proposal of the search
    /// if to look for people out of the freelancers agenda that are know by the
    /// freelancer by a good identifier.
    /// The LcRestCustomer class is used for the returned data,
    /// and since the customer is not in the freelancer agend that means that
    /// there is no data from [ProviderCustomer] table so some fields comes
    /// with values as null/default, with the special Editable:false because
    /// freelancer will clearly not be able to edit the record. The control
    /// fields (createdDate, updatedDate) as null clearly state that the record
    /// does not exists in the Freelancer customers agenda.
    /// </summary>
    /// <param name="fullName"></param>
    /// <param name="email"></param>
    /// <param name="phone"></param>
    /// <returns></returns>
    public static List<LcRestCustomer> PublicSearch(int excludedFreelancerUserID, string fullName, string email, string phone)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(@"
                SELECT
                        uc.UserID as customerUserID
                        ,up.Email as email
                        ,uc.FirstName as firstName
                        ,uc.LastName as lastName
                        ,uc.SecondLastName as secondLastName
                        ,uc.MobilePhone as phone
                        ,uc.CanReceiveSms as canReceiveSms
                        ,uc.BirthMonthDay as birthMonthDay
                        ,uc.BirthMonth as birthMonth
                        -- Next ones will be null on matches
                        -- so avoid processing the with fixed null
                        -- except for CreatedDate that is used to filter
                        -- existant records
                        ,null as notesAboutCustomer
                        ,pc.CreatedDate as createdDate
                        ,null as updatedDate
                        -- All records are no editable, because the editable ones will get
                        -- filtered out on the Where
                        ,cast(0 as bit) as editable
                FROM    Users As uc
                         INNER JOIN
                        UserProfile As up
                          ON up.UserID = uc.UserID
                         LEFT JOIN
                        -- left join relation only to exclude the ones already related to the freelancer
                        ProviderCustomer As pc
                          ON uc.UserID = pc.CustomerUserID
                            AND pc.ProviderUserID = @0
                WHERE   uc.Active = 1
                         -- Exclude the freelancer user
                         AND uc.UserID <> @0
                         -- Exclude users related to the freelancer
                         AND PC.createdDate is null
                         -- Search by
                         AND (
                           -- Full name
                           (dbo.fx_concat(dbo.fx_concat(coalesce(uc.FirstName, ''), coalesce(uc.LastName, ''), ' '), coalesce(uc.SecondLastName, ''), ' ')) like @1
                            OR
                           -- email
                           up.Email like @2
                            OR
                           -- Phone
                           uc.MobilePhone like @3
                         )
                ",
                excludedFreelancerUserID,
                fullName,
                email,
                phone
            ).Select(FromDB).ToList();
        }
    }
    #endregion
}