using System;
using System.Web;
using WebMatrix.WebData;
using System.Web.WebPages;
using System.Linq;

public class RestUserJobProfile : RestWebPage
{
    /// <summary>
    /// Retrieve the full list of job titles or one by jobTitleID
    /// </summary>
    /// <returns></returns>
    public override dynamic Get()
    {
        RequiresUser(LcData.UserInfo.UserType.ServiceProfessional);
        // Parameters
        int userId = WebSecurity.CurrentUserId;

        // Item ID
        if (UrlData.Count == 1 && UrlData[0].IsInt())
        {
            var jobTitleID = UrlData[0].AsInt(0);
            var item = LcRest.UserJobTitle.GetItem(userId, jobTitleID);

            if(item != null)
            {
                return item;
            }

            throw new HttpException(404, "Job Title not found.");
        }
        else if (UrlData.Count == 1)
        {
            throw new HttpException(400, "The Job Title ID has bad format (must be an integer number)");
        }
        else if (UrlData.Count > 1)
        {
            throw new HttpException(404, "Not Found");
        }

        return LcRest.UserJobTitle.GetAllByUser(userId);
    }

    private dynamic PerformAction()
    {
        RequiresUser(LcData.UserInfo.UserType.ServiceProfessional);

        // Two segments:
        // - jobTitleID
        // - actionName to execute
        if (UrlData.Count == 2)
        {
            if (UrlData[0].IsInt())
            {

                // Response must be OK if goes fine (by default for POST is 'Created'
                // it does not apply on this case)
                WebPage.Response.StatusCode = 200;

                // Parameters
                int userID = WebSecurity.CurrentUserId;
                var jobTitleID = UrlData[0].AsInt();

                // Result holders
                var done = false;

                switch (UrlData[1].ToLower())
                {
                    case "deactivate":
                        done = LcRest.UserJobTitle.Deactivate(userID, jobTitleID);
                        // It cannot be done if record not exists, notify:
                        if (!done)
                        {
                            throw new HttpException(404, "Not found");
                        }
                        else
                        {
                            // Return an updated item
                            return LcRest.UserJobTitle.GetItem(userID, jobTitleID);
                        }

                    case "reactivate":

                        // Double check if item exists
                        if (LcRest.UserJobTitle.GetItem(userID, jobTitleID) == null)
                        {
                            throw new HttpException(404, "Not found");
                        }
                        else
                        {
                            done = LcRest.UserJobTitle.Reactivate(userID, jobTitleID);

                            if (!done)
                            {
                                // It cannot be done, since we already know
                                // that the record exists, the problem only can
                                // be that constraints for 'active profile' were not
                                // fullfilled to allow manual activation.
                                // Notify about pending steps:
                                var alertsMsg = "You must complete another {0} steps to activate this profile.";
                                var alerts = LcRest.Alert.GetActiveRequiredCount(userID, jobTitleID);
                                throw new HttpException(400, String.Format(alertsMsg, alerts));
                            }
                            else
                            {
                                // Return an updated item
                                return LcRest.UserJobTitle.GetItem(userID, jobTitleID);
                            }
                        }

                    default:
                        throw new HttpException(404, "Not found");
                }
            }
            else
            {
                throw new HttpException(400, "Invalid Job Title ID");
            }
        }

        throw new HttpException(404, "Not found");
    }

    /// <summary>
    /// Add a new job title to the profile.
    /// Or execute some actions on specific sub-URLs applied to 
    /// a jobTitleID URL.
    /// </summary>
    /// <returns></returns>
    public override dynamic Post()
    {
        if (UrlData.Count == 0)
        {
            // Parameters
            int userID = WebSecurity.CurrentUserId;
            var jobTitleID = Request["jobTitleID"].AsInt(0);
            var jobTitleName = GetValidatedJobTitleName(Request.Form["jobTitleName"]);
            return Create(userID, jobTitleID, jobTitleName);
        }
        else
        {
            return PerformAction();
        }
    }

    /// <summary>
    /// The value given for job title name must be normalized 
    /// and be almost 3 characters to be valid.
    /// The result is returned, or null if no value or not enought lenght
    /// </summary>
    /// <param name="rawJobTitleName"></param>
    /// <returns></returns>
    public string GetValidatedJobTitleName(string rawJobTitleName)
    {
        if (String.IsNullOrEmpty(rawJobTitleName)) return null;
        var jobTitleName = rawJobTitleName.Trim().CollapseSpaces().ToTitleCase();
        return jobTitleName.Length < 4 ? null : jobTitleName;
    }

    /// <summary>
    /// Process a request to create a user job title given a jobTitleID with
    /// a validated and sanitized jobTitleName (pass in GetValidatedJobTitleName result)
    /// as a custom listing title.
    /// </summary>
    /// <param name="userID"></param>
    /// <param name="jobTitleID"></param>
    /// <param name="jobTitleName"></param>
    /// <returns></returns>
    public dynamic Create(int userID, int jobTitleID, string jobTitleName)
    {
        if (jobTitleID == 0 || jobTitleID == LcRest.UserJobTitle.UserGeneratedJobTitleID)
        {
            // new-job-title version: it's possible that the user wrotes a 
            // job title name without pick-up one from the list, on that case
            // the user generated job title is assigned and the given title name is
            // used as listing title

            // Name for the job title is required
            if (String.IsNullOrWhiteSpace(jobTitleName))
            {
                throw new HttpException(400, "A Job Title is required");
            }

            // Search: we try an exact match, just in case we have already the job title (singular or plural) and
            // user didn't select it from the list
            var locale = LcRest.Locale.Current;
            var jobTitle = LcRest.JobTitle.FindExactName(jobTitleName, locale.languageID, locale.countryID);
            if (jobTitle.HasValue)
            {
                // Use the first one
                jobTitleID = jobTitle.Value;
            }
            else
            {
                //  Create a new job-title based on the given name #650
                jobTitleID = LcRest.UserJobTitle.UserGeneratedJobTitleID;
            }
        }
        // Double check that the job title exists
        else
        {
            var existentTitle = LcRest.PublicJobTitle.Get(jobTitleID, LcRest.Locale.Current);
            if (existentTitle == null)
            {
                throw new HttpException(404, "Job Title not found or disapproved");
            }
            // If exists, we use the user given title, with fallback to the one we have for the given jobTitleID
            else if (String.IsNullOrWhiteSpace(jobTitleName))
            {
                jobTitleName = existentTitle.singularName;
            }
        }

        // Read data; It stops on not valid:
        var data = GetValidatedItemBodyInput();

        LcRest.UserJobTitle.Create(new LcRest.UserJobTitle
        {
            userID = userID,
            jobTitleID = jobTitleID,
            title = jobTitleName,
            intro = data.intro,
            cancellationPolicyID = data.policyID,
            collectPaymentAtBookMeButton = data.collectPaymentAtBookMeButton,
            instantBooking = data.instantBooking
        });

        // If user is just a client, needs to become a professional
        var user = LcRest.UserProfile.Get(userID);
        if (!user.isServiceProfessional)
        {
            LcAuth.BecomeProvider(userID);
            // Set onboarding step as done for 'add job title' to avoid display that screen again to the user:
            LcData.UserInfo.SetOnboardingStep(userID, "addJobTitle");
            // Send email as provider
            LcMessaging.SendWelcomeProvider(userID, WebSecurity.CurrentUserName);
        }

        return LcRest.UserJobTitle.GetItem(userID, jobTitleID);
    }

    /// <summary>
    /// Checks that there is a valid itemID in the URL,
    /// emiting errors on fail and double checking that 
    /// the item exists.
    /// Returns the itemID on success.
    /// </summary>
    /// <returns></returns>
    private int CheckAndGetItemID()
    {
        // Item ID
        var itemID = 0;
        if (UrlData[0].IsInt())
        {
            itemID = UrlData[0].AsInt(0);
        }
        else if (UrlData.Count == 1)
        {
            throw new HttpException(400, "Invalid Job Title ID");
        }
        else
        {
            throw new HttpException(404, "Not Found");
        }
        int userID = WebSecurity.CurrentUserId;
        // Check that the item exists
        if (LcRest.UserJobTitle.GetItem(userID, itemID) == null)
        {
            throw new HttpException(404, "Job Title not found");
        }

        return itemID;
    }

    /// <summary>
    /// Runs validation against the 'body' fields of an item, that is the editable
    /// fields without the primary key.
    /// It throws HttpException if error, returns an object with the
    /// data or defaults on success.
    /// </summary>
    private dynamic GetValidatedItemBodyInput()
    {
        // Validation rules
        Validation.Add("intro", Validator.StringLength(2000, 0, "Job title introduction must be fewer than 2000 characters"));
        Validation.Add("cancellationPolicyID", Validator.Integer("Invalid cancellation policy"));
        if (!Request["instantBooking"].IsEmpty() && !Request["instantBooking"].IsBool())
        {
            ModelState.AddError("instantBooking", "The scheduling option must be a boolean (true for instant booking)");
        }

        if (!Validation.IsValid() || !ModelState.IsValid)
        {
            throw new HttpException(400, LcRessources.ValidationSummaryTitle);
        }

        return new
        {
            intro = Request["intro"] ?? null,
            policyID = Request["cancellationPolicyID"].AsInt(LcRest.CancellationPolicy.DefaultCancellationPolicyID),
            // False as default
            instantBooking = Request["instantBooking"].AsBool(false),
            collectPaymentAtBookMeButton = Request["collectPaymentAtBookMeButton"].AsBool(true)
        };
    }

    /// <summary>
    /// Update editable fields for the job title:
    /// - intro
    /// - cancellationPolicyID
    /// - instantBooking
    /// </summary>
    /// <returns></returns>
    public override dynamic Put()
    {
        RequiresUser(LcData.UserInfo.UserType.ServiceProfessional);

        // Item ID
        var itemID = CheckAndGetItemID();

        // Parameters
        int userID = WebSecurity.CurrentUserId;
        var jobTitleID = itemID;

        // Stop on not valid:
        var data = GetValidatedItemBodyInput();

        // Updating
        LcRest.UserJobTitle.Update(new LcRest.UserJobTitle
        {
            userID = userID,
            jobTitleID = jobTitleID,
            cancellationPolicyID = data.policyID,
            intro = data.intro,
            instantBooking = data.instantBooking,
            collectPaymentAtBookMeButton = data.collectPaymentAtBookMeButton
        });

        // Return the updated item
        return LcRest.UserJobTitle.GetItem(userID, itemID);
    }

    /// <summary>
    /// Soft removal of a job title from the profile.
    /// It is internally disabled but appears as deleted for the user,
    /// could be enabled by re-adding the job title to the profile.
    /// </summary>
    /// <returns></returns>
    public override dynamic Delete()
    {
        RequiresUser(LcData.UserInfo.UserType.ServiceProfessional);

        // Item ID
        var itemID = CheckAndGetItemID();

        int userID = WebSecurity.CurrentUserId;
        // Get item to be deleted.
        // It already throws 'not found' 
        // if doesn't exists
        var item = LcRest.UserJobTitle.GetItem(userID, itemID);

        // Parameters
        var jobTitleID = itemID;

        // Delete
        LcRest.UserJobTitle.Delete(userID, jobTitleID);

        // Return 'deleted' item (internal updated info cannot be fetched)
        return item;
    }
}
