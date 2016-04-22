# Verifying licenses and certifications of service professionals

This document outlines the process for verifying required and optional licenses and certifications uploaded by service professionals.

## Objective
- We want clients to konw that professionals listed on Loconomics have the licenses or certifications required in the area they are offering services. 
- We want to make it easy for service professionals to know whats's required of them and a user-friendly experience to upload what we need to verify their documentation. 
- Loconomics wants to do our best in ensuring a safe experience for all users.
- Please refer to the Loconomics Background Check and License Verification Policy for full details.

### Communicating what's required to service professionals for their job title
- An API call to job-title-licenses will return: 
  - any required licenses for that job title we show in our database for serviceaddresses in their profile (there will be none available until we build a database of licenses)
  - an option for adding any unlisted required licenses
  - an additional option for adding any supplemental certifications
- This information is shown to the service professional under job title certifications/licenses in their job title's marketplace profile (markeplaceJobtitles)

### Process for service professionals to upload documentation
- Service professionals click on "Job title certifications/licenses"
- They click on any required licenses or "Add a required certification/license +" to upload a photo or pdf (future feature) of their license
- They can click on "Add a supplemental certification +" to upload a photo or pdf (future feature) of their license

### Process for service professionals to view/edit licenses/certifications:
- Licenses and certifications will be mapped to a municipality, county, state, or country and be listed under each section
- They can click on the license they want to view or edit
- They can submit a new photo for the selected license

### Viewing a service professional's licenses/certifications:
- An api call to api/v1/en-us/users/publicuserlicenseverification will list all publicly available info for each license a service professional has submitted with a "Confirmed" verification status.
