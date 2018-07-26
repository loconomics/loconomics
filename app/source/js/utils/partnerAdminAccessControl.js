/**
 * Provides implementations of access control for administrative access
 * to partner specific pages, and related utils.
 * NOTE: Has specific stuff for 'CCC' partnership, but expects to contain
 * more generic logic in a future or supporting other specific partnerships.
 */
import CccUserType from '../enums/CccUserType';
import ko from 'knockout';
import { data as user } from '../data/userProfile';

/**
 * List of allowed CCC user types to access this activity
 * @const {Array<string>}
 */
const ALLOWED_CCC_TYPES = [CccUserType.admin, CccUserType.collegeAdmin];

/**
 * Whether the current user is a partner 'college admin' user type.
 * @returns {boolean}
 */
export const amIPartnerAdmin = ko.pureComputed(() => user.partner() && ALLOWED_CCC_TYPES.includes(user.partnerUserType()));

/**
 * Whether the current user is a partner 'college admin' user type.
 * @returns {boolean}
 */
export const amICollegeAdmin = ko.pureComputed(() => user.partner() && user.partnerUserType() === CccUserType.collegeAdmin);

/**
 * Custom management of access control, by checking the user partner and
 * type to match 'ccc' and 'admin'/'collegeAdmin'
 * @returns {Object} Failed access description or null if allowed
 */
export function accessControl() {
    return amIPartnerAdmin() ? null : {
        message: 'Not allowed'
    };
}
