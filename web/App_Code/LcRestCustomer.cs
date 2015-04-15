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
                           @1 is not null AND (dbo.fx_concat(dbo.fx_concat(coalesce(uc.FirstName, ''), coalesce(uc.LastName, ''), ' '), coalesce(uc.SecondLastName, ''), ' ')) like @1
                            OR
                           -- email
                           @2 is not null AND up.Email like @2
                            OR
                           -- Phone
                           @3 is not null AND uc.MobilePhone like @3
                         )
                ",
                excludedFreelancerUserID,
                N.DW(fullName),
                N.DW(email),
                N.DW(phone)
            ).Select(FromDB).ToList();
        }
    }
    #endregion

    #region Create/Update
    /// <summary>
    /// It creates or updates a customer record for the freelancer and
    /// returns the generated/updated ID.
    /// In case the user cannot be created because the email already exists,
    /// the existent user record is used and only the Freelancer fields are set
    /// (automatically select and use the existent customer).
    /// </summary>
    /// <param name="freelancerUserID"></param>
    /// <param name="customer"></param>
    /// <returns></returns>
    public static int SetCustomer(int freelancerUserID, LcRestCustomer customer)
    {
        // If it has ID, we need to read it from database
        // to ensure it can be edited, else only the freelancer fields
        // can be saved.
        if (customer.customerUserID > 0)
        {
            var savedCustomer = GetFreelancerCustomer(freelancerUserID, customer.customerUserID);

            if (savedCustomer == null)
            {
                // Does not exists, return 0 to state user was not found.
                // (a creation ever returns something, so it means ever a non found ID)
                return 0;
            }

            // Only set customer user if editable by the freelancer
            if (savedCustomer.editable)
            {
                // Set Customer User
                SetCustomerUser(freelancerUserID, customer);
            }

            // Set relationship data
            SetFreelancerCustomer(freelancerUserID, customer);
        }
        else
        {
            // Request to create a new customer user,
            // but requires check if a user with that email already exists.
            // Reusing the PublicSearch method with the email only and no freelancerUserID
            var searchCustomer = PublicSearch(0, null, customer.email,  null).FirstOrDefault();
            if (searchCustomer == null)
            {
                // Create new user, getting the generated ID
                customer.customerUserID = SetCustomerUser(freelancerUserID, customer);
                // Create link with freelancer
                SetFreelancerCustomer(freelancerUserID, customer);
            }
            else
            {
                // It exists, cannot create duplicated, but link to freelancer with its info
                // using its ID (the rest data provided by freelancer will be discarded, except
                // freelancer fields).
                customer.customerUserID = searchCustomer.customerUserID;
                SetFreelancerCustomer(freelancerUserID, customer);
            }
        }

        // Return new/updated record
        return customer.customerUserID;
    }

    /// <summary>
    /// Updates or creates a ProviderCustomer record with the given data
    /// </summary>
    /// <param name="freelancerUserID"></param>
    /// <param name="customer"></param>
    private static void SetFreelancerCustomer(int freelancerUserID, LcRestCustomer customer)
    {
        using (var db = Database.Open("sqlloco"))
        {
            db.Execute(@"
                IF EXISTS (SELECT * FROM ProviderCustomer WHERE ProviderUserID = @0 AND CustomerUserID = @1)
                    UPDATE ProviderCustomer SET
                        NotesAboutCustomer = @2,
                        UpdatedDate = getdate()
                    WHERE
                        ProviderUserID = @0
                         AND CustomerUserID = @1
                ELSE
                    INSERT INTO ProviderCustomer (
                        ProviderUserID,
                        CustomerUserID,
                        NotesAboutCustomer,
                        ReferralSourceID,
                        CreatedDate,
                        UpdatedDate,
                        Active
                    ) VALUES (
                        @0, @1, @2,
                        12, -- source: created by freelancer (12:ProviderExistingClient)
                        getdate(),
                        getdate(),
                        1 -- Active
                    )
            ", freelancerUserID,
             customer.customerUserID,
             customer.notesAboutCustomer ?? "");
        }
    }

    /// <summary>
    /// Create or updates a User account for the given customer information.
    /// </summary>
    /// <param name="customer"></param>
    private static int SetCustomerUser(int freelancerUserID, LcRestCustomer customer)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return (int)db.QueryValue(@"
                DECLARE @UserID int
                SET @UserID = @0

                BEGIN TRANSACTION

                IF @UserID > 0 AND EXISTS (SELECT * FROM Users WHERE UserID = @UserID) BEGIN

                    UPDATE Users SET
                        FirstName = @2,
                        LastName = @3,
                        SecondLastName = @4,
                        MobilePhone = @5,
                        CanReceiveSms = @6,
                        BirthMonth = @7,
                        BirthMonthDay = @8,
                        UpdatedDate = getdate()
                    WHERE
                        UserID = @UserID
                        -- Extra check to avoid being edited without right
                         AND AccountStatusID = 6 -- Is editable by freelancer
                         AND ReferredByUserID = @9 -- Is the owner freelancer

                    -- If could be updated
                    IF @@ROWCOUNT = 1 BEGIN
                        -- Update email
                        UPDATE UserProfile SET
                            Email = @1
                        WHERE
                            userID = @UserID
                    END
                
                END ELSE BEGIN

                    -- Create UserProfile record to save email and generate UserID
                    INSERT INTO UserProfile (
                        Email
                    ) VALUES (
                        @1
                    )
                    SET @UserID = @@Identity

                    -- Create user account record, but account disabled
                    INSERT INTO Users (
		                UserID,
		                FirstName,
		                LastName,
		                MiddleIn,
		                SecondLastName,
		                GenderID,
		                IsProvider,
		                IsCustomer,
                        MobilePhone,
                        CanReceiveSms,
                        BirthMonth,
                        BirthMonthDay,
		                CreatedDate,
		                UpdatedDate,
		                ModifiedBy,
		                Active,
                        AccountStatusID,
                        ReferredByUserID
                    ) VALUES (
                        @UserID,
                        @2,
                        @3,
                        '', -- MiddleIn
                        @4,
                        -1, -- GenderID as 'unknow'
                        0, -- No provider
                        1, -- Is customer
                        @5,
                        @6,
                        @7,
                        @8,
                        getdate(),
                        getdate(),
                        'sys',
                        1, -- Active
                        6, -- Is a Freelancer's Client (it means is still editable by the freelancer that create it)
                        @9 -- Freelancer's ID that create this
                    )

                    -- NOTE: since there is no Membership record with password, is not an actual Loconomics User Account
                    -- just what we need on this case
                END

                COMMIT TRANSACTION

                SELECT @UserID
            ",
             customer.customerUserID,
             customer.email,
             customer.firstName,
             customer.lastName,
             customer.secondLastName,
             customer.phone,
             customer.canReceiveSms,
             customer.birthMonth,
             customer.birthMonthDay,
             freelancerUserID);
        }
    }
    #endregion

    #region Delete
    /// <summary>
    /// Delete a freelancer customer, with care of:
    /// - Delete relationship ([ProviderCustomer]) ever
    /// - Delete customer user account only if the record is editable by the Freelancer
    /// - and is not used by other Freelancers, in that case is left 'as is'.
    /// </summary>
    /// <param name="freelancerUserID"></param>
    /// <param name="customerUserID"></param>
    public static void Delete(int freelancerUserID, int customerUserID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            db.Execute(@"
                DELETE FROM ProviderCustomer
                WHERE ProviderUserID = @0
                      AND CustomerUserID = @1

                -- If there is no more providers linked to this customer
                IF 0 = (
                        SELECT count(*) FROM ProviderCustomer WHERE CustomerUserID = @1
                    )
                    -- And freelancer own this user record (is editable for him)
                    AND EXISTS (
                        SELECT * FROM users
                        WHERE UserID = @1 -- The customer
                            AND ReferredByUserID = @0 -- This freelancer
                            AND AccountStatusID = 6 -- In 'editable by freelancer creator' state
                ) BEGIN          
                    -- Try to delete the User record, but only if
                    -- is owned by the freelancer
                    DELETE FROM users
                    WHERE UserID = @1
                        AND ReferredByUserID = @0
                        AND AccountStatusID = 6 -- In 'editable by freelancer creator' state

                    -- Delete the userprofile record
                    DELETE FROM userprofile
                    WHERE UserID = @1
                END
            ",
            freelancerUserID, customerUserID);
        }
    }
    #endregion
}