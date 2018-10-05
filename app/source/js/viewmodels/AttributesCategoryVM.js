/**
 * Let's edit service attributes attached to a listing
 */
import ServiceAttribute from '../models/ServiceAttribute';
import ko from 'knockout';

export default class AttributesCategoryVM {
    constructor(cat, userAtts) {
        var catID = cat.serviceAttributeCategoryID();
        var selectedAttsIds = userAtts.serviceAttributes.getServiceCategoryAttributes(catID);
        this.category = ko.observable(cat);

        // An array of models for visualization from the list of proposed names for addition
        this.proposedServiceAttributes = ko.pureComputed(() => {
            var props = userAtts.proposedServiceAttributes();
            if (props && props[catID] && props[catID].length) {
                return props[catID].map((name) => new ServiceAttribute({ name: name }));
            }
            else {
                return [];
            }
        });

        this.selectedAttributes = ko.pureComputed(() => {
            var atts = cat.serviceAttributes()
            .filter((att) => selectedAttsIds().indexOf(att.serviceAttributeID()) > -1);
            return atts.concat.apply(atts, this.proposedServiceAttributes());
        });

        // Available, not selected, list of attributes
        this.availableAttributes = ko.pureComputed(() => {
            var props = this.proposedServiceAttributes();
            var atts = selectedAttsIds();
            return cat.serviceAttributes().filter((att) => {
                var toInclude = atts.indexOf(att.serviceAttributeID()) === -1;
                if (toInclude === false) return false;
                // Not found in IDs, try with proposed Names:
                return props.every((propAtt) => att.name() !== propAtt.name());
            });
        });

        var foundAttItem = (att, item) => item.name() === att.name;

        this.pushAttributeName = (attName) => {
            var newOne = attName || '';
            var isEmpty = /^\s*$/.test(newOne);
            var wasFound = this.selectedAttributes()
            .some(foundAttItem.bind(null, { name: newOne }));
            if (!isEmpty && !wasFound) {
                userAtts.proposedServiceAttributes.push(catID, newOne);
            }
        };

        this.pushAttribute = (att) => {
            if (att.serviceAttributeID()) {
                userAtts.serviceAttributes.push(catID, att.serviceAttributeID());
            }
        };

        this.removeAttribute = (att) => {
            var id = att.serviceAttributeID();
            if (id) {
                userAtts.serviceAttributes.remove(catID, id);
            }
            else {
                userAtts.proposedServiceAttributes.remove(catID, att.name());
            }
        };
    }
}
