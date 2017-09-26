using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace LcRest
{
    /// <summary>
    /// The public part of UserJobTitleServiceAttributes, that instead of just IDs
    /// returns labels (names, descriptions,..) as part of the information to show
    /// to clients, so the use of the API does not requires additional lookups to
    /// other endpoints.
    /// </summary>
    public class Search
    {
        #region Fields
        public IEnumerable<JobTitleSearchResult> jobTitles;
        public IEnumerable<ServiceProfessionalSearchResult> serviceProfessionals;
        public IEnumerable<CategorySearchResult> categories;
        #endregion

        #region Instances
        public Search() { }
        #endregion

        #region Fetch
        public static Search Get(string SearchTerm, decimal origLat, decimal origLong, int SearchDistance, Locale locale)
        {
            var data = new Search();
            data.jobTitles = JobTitleSearchResult.SearchBySearchTerm(SearchTerm, origLat, origLong, SearchDistance, locale);
            data.serviceProfessionals = ServiceProfessionalSearchResult.SearchBySearchTerm(SearchTerm, origLat, origLong, SearchDistance, locale);
            data.categories = CategorySearchResult.SearchBySearchTerm(SearchTerm, origLat, origLong, SearchDistance, locale);
            return data;
        }
        #endregion  
    }
}