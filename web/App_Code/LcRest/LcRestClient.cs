using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebMatrix.Data;

/// <summary>
/// Access to client info through the REST API
/// </summary>
public class LcRestClient
{
    #region Fields
    public int clientUserID;
    public string email;
    public string firstName;
    public string lastName;
    public string secondLastName;
    public string phone;
    public bool canReceiveSms;
    public int? birthMonthDay;
    public int? birthMonth;
    public string notesAboutClient;
    public DateTime? createdDate;
    public DateTime? updatedDate;
    /// <summary>
    /// Editable is a special computed value, is true only
    /// when the client account status is 6:ServiceProfessional's Client (AKA 'client created and managed by a service professional')
    /// and the client's user.ReferredByUserID is the service professional querying
    /// the data.
    /// </summary>
    public bool editable;
    #endregion

    #region Tools
    /// <summary>
    /// Only for internal checks
    /// </summary>
    /// <returns></returns>
    private string GetFullName()
    {
        var f = this.firstName;
        var l = this.lastName;
        var s = this.secondLastName;
        var r = "";
        
        if (!String.IsNullOrWhiteSpace(f))
            r += f;
        
        if (!String.IsNullOrWhiteSpace(l))
            r += (String.IsNullOrEmpty(r) ? "" : " ") + l;
        
        if (!String.IsNullOrWhiteSpace(s))
            r += (String.IsNullOrEmpty(r) ? "" : " ") + s;

        return r;
    }

    private const string EmptyEmailPrefix = "EMPTY:";
    private static string GetEmailForDb(string email)
    {
        if (String.IsNullOrWhiteSpace(email))
        {
            // Generate fake email, because database requires ever
            // an email, and must be non a duplicated
            return EmptyEmailPrefix + Guid.NewGuid().ToString();
        }
        else
        {
            return email;
        }
    }
    public static string GetEmailFromDb(string email)
    {
        if (email == null)
            return "";
        else if (email.StartsWith(EmptyEmailPrefix))
            return "";
        else
            return email;
    }
    #endregion

    #region Static Constructors
    public static LcRestClient FromDB(dynamic record)
    {
        if (record == null) return null;
        return new LcRestClient {
            clientUserID = record.clientUserID,
            email = GetEmailFromDb(record.email),
            firstName = record.firstName,
            lastName = record.lastName,
            secondLastName = record.secondLastName,
            phone = record.phone,
            canReceiveSms = record.canReceiveSms,
            birthMonthDay = record.birthMonthDay,
            birthMonth = record.birthMonth,
            notesAboutClient = record.notesAboutClient,
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
                pc.ClientUserID as clientUserID
                ,up.Email as email
                ,uc.FirstName as firstName
                ,uc.LastName as lastName
                ,uc.SecondLastName as secondLastName
                ,uc.MobilePhone as phone
                ,uc.CanReceiveSms as canReceiveSms
                ,uc.BirthMonthDay as birthMonthDay
                ,uc.BirthMonth as birthMonth
                ,pc.NotesAboutClient as notesAboutClient
                ,pc.CreatedDate as createdDate
                ,pc.UpdatedDate as updatedDate
                ,(CASE WHEN uc.AccountStatusID = 6 AND uc.ReferredByUserID = @0 THEN Cast(1 as bit) ELSE Cast(0 as bit) END) as editable
        FROM    ProviderClient As pc
                 INNER JOIN
                Users As uc
                  ON uc.UserID = pc.ClientUserID
                 INNER JOIN
                UserProfile As up
                  ON up.UserID = uc.UserID
        WHERE   pc.Active = 1
                 AND uc.Active = 1
                 AND pc.ProviderUserID = @0
    ";
    private const string sqlAndClientUserID = @"
        AND pc.ClientUserID = @1
    ";
    #endregion

    #region Fetch
    public static List<LcRestClient> GetServiceProfessionalClients(int serviceProfessionalUserID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(sqlSelect + sqlFields,
                serviceProfessionalUserID)
                .Select(FromDB)
                .ToList();
        }
    }

    public static LcRestClient GetServiceProfessionalClient(int serviceProfessionalUserID, int clientUserID)
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
                sqlSelectOne + sqlFields + sqlAndClientUserID,
                serviceProfessionalUserID,
                clientUserID
            ));
        }
    }

    private static LcRestClient GetSingleFrom(IEnumerable<dynamic> dbRecords)
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

    #region Search and Checks
    /// <summary>
    /// A public search performs a search in all the database/marketplace users
    /// for an exact match of full name OR email OR phone. Only if one of them
    /// matches completely, the record is included in the results.
    /// The given serviceProfessionalUserID is used to exclude results: if the match is
    /// already a service professional's client, is excluded. The proposal of the search
    /// if to look for people out of the service professional agenda that are know by the
    /// service professional by a good identifier.
    /// The LcRestClient class is used for the returned data,
    /// and since the client is not in the service professional agend that means that
    /// there is no data from [ProviderClient] table so some fields comes
    /// with values as null/default, with the special Editable:false because
    /// serviceProfessional will clearly not be able to edit the record. The control
    /// fields (createdDate, updatedDate) as null clearly state that the record
    /// does not exists in the ServiceProfessional clients agenda.
    /// </summary>
    /// <param name="fullName"></param>
    /// <param name="email"></param>
    /// <param name="phone"></param>
    /// <returns></returns>
    public static List<LcRestClient> PublicSearch(int excludedServiceProfessionalUserID, string fullName, string email, string phone)
    {
        using (var db = Database.Open("sqlloco"))
        {
            return db.Query(@"
                SELECT
                        uc.UserID as clientUserID
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
                        ,null as notesAboutClient
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
                        -- left join relation only to exclude the ones already related to the serviceProfessional
                        ProviderClient As pc
                          ON uc.UserID = pc.ClientUserID
                            AND pc.ProviderUserID = @0
                WHERE   uc.Active = 1
                         -- Exclude the serviceProfessional user
                         AND uc.UserID <> @0
                         -- Exclude users related to the serviceProfessional
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
                excludedServiceProfessionalUserID,
                N.DW(fullName),
                N.DW(email),
                N.DW(phone)
            ).Select(FromDB).ToList();
        }
    }

    /// <summary>
    /// Checks if an email is available and returns the userID that has already that email
    /// or 0 in case the email is unused and so available.
    /// It optionally allows to exclude from the check the userID passed as second optional parameter,
    /// this allows to avoid false positive because the email to check is owned by the user that ask
    /// for the check (important in data updates).
    /// </summary>
    /// <param name="email"></param>
    /// <param name="excludeUserID"></param>
    /// <returns></returns>
    public static int CheckEmailAvailability(string email, int excludeUserID = 0)
    {
        using (var db = Database.Open("sqlloco"))
        {
            var v = db.QueryValue(@"
                SELECT
                        up.UserID
                FROM    UserProfile As up
                WHERE   up.email like @0
                        -- Exclude the user:
                         AND up.UserID <> @1
                ",
                N.DW(email),
                excludeUserID
            );

            return DataTypes.GetTypedValue<int>(v, 0);
        }
    }
    #endregion

    #region Create/Update
    /// <summary>
    /// It creates or updates a client record for the serviceProfessional and
    /// returns the generated/updated ID.
    /// In case the user cannot be created because the email already exists,
    /// the existent user record is used and only the ServiceProfessional fields are set
    /// (automatically select and use the existent client).
    /// </summary>
    /// <param name="serviceProfessionalUserID"></param>
    /// <param name="client"></param>
    /// <returns></returns>
    public static int SetClient(int serviceProfessionalUserID, LcRestClient client)
    {
        // If it has ID, we need to read it from database
        // to ensure it can be edited, else only the serviceProfessional fields
        // can be saved.
        if (client.clientUserID > 0)
        {
            var savedClient = GetServiceProfessionalClient(serviceProfessionalUserID, client.clientUserID);

            if (savedClient == null)
            {
                // DOUBLE CHECK: If the client was not found by ID for the given serviceProfessional,
                // can be a situation of client added from a marketplace user, so
                // perform a search by the given identificable data, confirming the ID in the
                // results (if any), and create them the link with the provider
                // On any other case, it's just a fake ID and must return 'not found'
                var searchedClient = PublicSearch(serviceProfessionalUserID, client.GetFullName(), client.email, client.phone);
                if (searchedClient.Count > 0)
                {
                    // Get the one that matches the given ID.
                    savedClient = searchedClient.Find(cust => cust.clientUserID == client.clientUserID);

                    // If was found, just set the link with the serviceProfessional and that's all!!
                    SetServiceProfessionalClient(serviceProfessionalUserID, client);
                    return client.clientUserID;
                }

                // Does not exists, return 0 to state user was not found.
                // (a creation ever returns something, so it means ever a non found ID)
                return 0;
            }

            // Only set client user if editable by the serviceProfessional
            if (savedClient.editable)
            {
                // Check first if the email to set is available
                // (excluding the own client record for false positives)
                var emailOwnerID = CheckEmailAvailability(client.email, client.clientUserID);

                if (emailOwnerID > 0)
                {
                    // Notify error
                    throw new ValidationException("The given e-mail already exists for other client at loconomics.com and cannot be saved." +
                        " You can perform a search by that email and add it as your client.", "email", "client");
                }

                // Set Client User
                SetClientUser(serviceProfessionalUserID, client);
            }

            // Set relationship data
            SetServiceProfessionalClient(serviceProfessionalUserID, client);
        }
        else
        {
            // Request to create a new client user,
            // but requires check if a user with that email already exists.
            var emailOwnerID = CheckEmailAvailability(client.email);
            if (emailOwnerID == 0)
            {
                // Create new user, getting the generated ID
                client.clientUserID = SetClientUser(serviceProfessionalUserID, client);
                // Create link with serviceProfessional
                SetServiceProfessionalClient(serviceProfessionalUserID, client);
            }
            else
            {
                // It exists, cannot create duplicated, but link to serviceProfessional with its info
                // using its ID (the rest data provided by serviceProfessional will be discarded, except
                // serviceProfessional fields).
                client.clientUserID = emailOwnerID;
                SetServiceProfessionalClient(serviceProfessionalUserID, client);
            }
        }

        // Return new/updated record
        return client.clientUserID;
    }

    /// <summary>
    /// Updates or creates a ProviderClient record with the given data
    /// </summary>
    /// <param name="serviceProfessionalUserID"></param>
    /// <param name="client"></param>
    private static void SetServiceProfessionalClient(int serviceProfessionalUserID, LcRestClient client)
    {
        using (var db = Database.Open("sqlloco"))
        {
            db.Execute(@"
                IF EXISTS (SELECT * FROM ProviderClient WHERE ProviderUserID = @0 AND ClientUserID = @1)
                    UPDATE ProviderClient SET
                        NotesAboutClient = @2,
                        UpdatedDate = getdate()
                    WHERE
                        ProviderUserID = @0
                         AND ClientUserID = @1
                ELSE
                    INSERT INTO ProviderClient (
                        ProviderUserID,
                        ClientUserID,
                        NotesAboutClient,
                        ReferralSourceID,
                        CreatedDate,
                        UpdatedDate,
                        Active
                    ) VALUES (
                        @0, @1, @2,
                        12, -- source: created by serviceProfessional (12:ProviderExistingClient)
                        getdate(),
                        getdate(),
                        1 -- Active
                    )
            ", serviceProfessionalUserID,
             client.clientUserID,
             client.notesAboutClient ?? "");
        }
    }

    /// <summary>
    /// Create or updates a User account for the given client information.
    /// </summary>
    /// <param name="client"></param>
    private static int SetClientUser(int serviceProfessionalUserID, LcRestClient client)
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
                         AND AccountStatusID = 6 -- Is editable by serviceProfessional
                         AND ReferredByUserID = @9 -- Is the owner serviceProfessional

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
		                IsClient,
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
                        1, -- Is client
                        @5,
                        @6,
                        @7,
                        @8,
                        getdate(),
                        getdate(),
                        'sys',
                        1, -- Active
                        6, -- Is a ServiceProfessional's Client (it means is still editable by the serviceProfessional that create it)
                        @9 -- ServiceProfessional's ID that create this
                    )

                    -- NOTE: since there is no Membership record with password, is not an actual Loconomics User Account
                    -- just what we need on this case
                END

                COMMIT TRANSACTION

                SELECT @UserID
            ",
             client.clientUserID,
             GetEmailForDb(client.email),
             client.firstName,
             client.lastName,
             client.secondLastName,
             client.phone,
             client.canReceiveSms,
             client.birthMonth,
             client.birthMonthDay,
             serviceProfessionalUserID);
        }
    }
    #endregion

    #region Delete
    /// <summary>
    /// Delete a serviceProfessional client, with care of:
    /// - Delete relationship ([ProviderClient]) ever
    /// - Delete client user account only if the record is editable by the ServiceProfessional
    /// - and is not used by other ServiceProfessionals, in that case is left 'as is'.
    /// </summary>
    /// <param name="serviceProfessionalUserID"></param>
    /// <param name="clientUserID"></param>
    public static void Delete(int serviceProfessionalUserID, int clientUserID)
    {
        using (var db = Database.Open("sqlloco"))
        {
            db.Execute(@"
                DELETE FROM ProviderClient
                WHERE ProviderUserID = @0
                      AND ClientUserID = @1

                -- If there is no more providers linked to this client
                IF 0 = (
                        SELECT count(*) FROM ProviderClient WHERE ClientUserID = @1
                    )
                    -- And serviceProfessional own this user record (is editable for him)
                    AND EXISTS (
                        SELECT * FROM users
                        WHERE UserID = @1 -- The client
                            AND ReferredByUserID = @0 -- This serviceProfessional
                            AND AccountStatusID = 6 -- In 'editable by serviceProfessional creator' state
                ) BEGIN          
                    -- Try to delete the User record, but only if
                    -- is owned by the serviceProfessional
                    DELETE FROM users
                    WHERE UserID = @1
                        AND ReferredByUserID = @0
                        AND AccountStatusID = 6 -- In 'editable by serviceProfessional creator' state

                    -- Delete the userprofile record
                    DELETE FROM userprofile
                    WHERE UserID = @1
                END
            ",
            serviceProfessionalUserID, clientUserID);
        }
    }
    #endregion
}