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
            //data.serviceProfessionals = ServiceProfessionalSearchResult.SearchBySearchTerm(SearchTerm, origLat, origLong, SearchDistance, locale);
            //data.categories = CategorySearchResult.SearchBySearchTerm(SearchTerm, origLat, origLong, SearchDistance, locale);
            return data;
        }
        #endregion

        #region Defaults (front-end code has a copy of this)
        public const decimal DEFAULT_LOCATION_LAT = 37.788479M;
        public const decimal DEFAULT_LOCATION_LNG = -122.40297199999998M;
        public const int DEFAULT_LOCATION_SEARCH_DISTANCE = 30;
        // TODO: set config value
        public const string DEFAULT_LOCATION_CITY = "San Francisco, CA USA";
        #endregion
    }
}
