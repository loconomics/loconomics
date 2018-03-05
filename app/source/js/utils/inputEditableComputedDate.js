/**
 * Allows to create a Knockout computed wrapping a given observable
 * with the source value (a Date object). It's an editable computed make
 * specifically for user edition of the value through an input[type=date]
 * element, with specific workarounds depending on whether native support
 * for the type 'date' exists or fallback to type 'text'.
 * The computed generated is a 'pure computed'.
 */
import 'browsernizr/test/inputtypes';
import { inputtypes as inputTypesSupport } from 'browsernizr';
import ko from 'knockout';
import moment from 'moment';

/**
 * Whether native input[type=date] is supported or not
 * @const {boolean}
 */
const hasNativeDateInput = inputTypesSupport.date;

export function create(observableSourceDate) {
    return ko.pureComputed({
        read: () => {
            const d = observableSourceDate();
            if (d) {
                // For native date input support, ISO format with date only part must be used to be
                // understood by engines, otherwise the most common user locale format.
                return hasNativeDateInput ? moment(d).format('YYYY-MM-DD') : moment(d).format('L');
            }
            else {
                return '';
            }
        },
        write: (value) => {
            if (value instanceof Date) {
                observableSourceDate(value);
            }
            else {
                // We could check the native support, but actually supporting all formats at once is
                // good enough and makes wider support (just in case copy&paste, autocomplete or anything)
                //const formats = hasNativeDateInput ? ['YYYY-MM-DD'] : ['L', 'l'];
                const formats = ['YYYY-MM-DD', 'L', 'l'];
                // Supported formats: standard ISO date only, as stated by the spec for native date input;
                // for non native date input,
                // the user locale formats are supported (short versions, is not usual to use long ones for this)
                // And we strictly support this formats (last parameter:true), preventing additiona and
                // error prone checks by momentjs.
                const momentDate = moment(value, formats, true);
                // Set value, or null if not valid
                observableSourceDate(momentDate.isValid() ? momentDate.toDate() : null);
            }
        }
    });
}
