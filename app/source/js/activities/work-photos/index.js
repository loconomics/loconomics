/**
 * WorkPhotos
 *
 * @module activities/work-photos
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import 'jquery.fileupload-image';
import '../../kocomponents/button-file';
import * as activities from '../index';
import $ from 'jquery';
import Activity from '../../components/Activity';
import UserType from '../../enums/UserType';
import WorkPhoto from '../../models/WorkPhoto';
import ko from 'knockout';
import photoTools from '../../utils/photoTools';
import { show as showError } from '../../modals/error';
import template from './template.html';
import workPhotos from '../../data/workPhotos';

const ROUTE_NAME = 'work-photos';

// IMPORTANT: Size like the server 'original' photo, that's the 'visible size on screen' multiply
// by the scale for the original used to create hidpi versions and to crop with quality.
const cameraSettings = {
    targetWidth: 442 * 3,
    targetHeight: 332 * 3,
    correctOrientation: true
};

export default class WorkPhotos extends Activity {

    static get template() { return template; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.helpLink = '/help/relatedArticles/201964193-showcase-your-work-with-photos';
        this.navBar = Activity.createSubsectionNavBar('Job Title', {
            backLink: '/listings',
            helpLink: this.helpLink
        });
        this.title = 'Your work photos';

        this.__defViewProperties();
        this.__defViewMethods();
        this.__connectFileUploader();
    }

    __defViewProperties() {
        this.jobTitleID = ko.observable(0);
        this.list = ko.observableArray([]);
        this.removedItems = ko.observableArray([]);
        this.takePhotoSupported = ko.observable(photoTools.takePhotoSupported());
        this.state = workPhotos.state;
        this.inputElement = ko.observable();
        this.saveBtnText = ko.pureComputed(() => {
            const r =
            this.state.isSaving() ?
            'Saving..' :
            this.state.isLoading() ?
            'Loading..' :
            this.state.isDeleting() ?
            'Deleting..' :
            //else/default
            'Save';
            return r;
        });
    }

    __defViewMethods() {
        var addNew = (fromCamera) => {
            // Pick a new photo
            this.openPhotoPicker(fromCamera)
            .then((data) => {
                var newItem = new WorkPhoto({
                    workPhotoID: 0,
                    jobTitleID: this.jobTitleID(),
                    url: data.previewUrl,
                    localTempFilePath: data.localUrl,
                    caption: ''
                });
                this.list.push(newItem);
            })
            .catch((err) => {
                // A user abort gives no error or 'no image selected' on iOS 9/9.1
                if (err && err !== 'no image selected' && err !== 'has no access to camera') {
                    showError({
                        title: 'Error getting photo.',
                        error: err
                    });
                }
            });
        };
        this.takePhotoForNew = () => {
            addNew(true);
        };
        this.pickPhotoForNew = () => {
            addNew(false);
        };
        this.removeImg = (item) => {
            this.removedItems.push(item);
            this.list.remove(item);
        };
        this.rotateImg = (item) => {
            var d = item.rotationAngle() |0;
            item.rotationAngle((d + 90) % 360);
        };
        this.openPhotoPicker = (fromCamera) => {
            var settings = $.extend({}, cameraSettings, {
                sourceType: fromCamera ?
                    window.Camera && window.Camera.PictureSourceType.CAMERA :
                    window.Camera && window.Camera.PictureSourceType.PHOTOLIBRARY
            });
            if (photoTools.takePhotoSupported()) {
                return photoTools.cameraGetPicture(settings)
                .then((imgLocalUrl) => ({
                    localUrl: imgLocalUrl,
                    previewUrl: photoTools.getPreviewPhotoUrl(imgLocalUrl)
                }));
            }
            else {
                return Promise.reject('Take photo is not supported on the web right now');
            }
        };
        /**
         * Process an asynchronous task for each item in a list in serial
         * (each task only runs when previous one ended successfully, rejects
         * on first error; as opossed to doing a map and Promise.all, that would
         * be concurrent)
         * @param {Array} items
         * @param {Function<Object,Promise>} cb Task to execute receiving an item as parameter
         * and returning a Promise
         * @returns {Promise}
         */
        const serialTasks = (items, cb) => items.reduce((cur, next) => cur.then(() => cb(next)), Promise.resolve());
        // Delete on remote REST API all the registered items for deletion
        var remoteDeleteFlaggedItems = () => {
            const delPhoto = (photo) => workPhotos.delItem(photo.jobTitleID(), photo.workPhotoID());
            return serialTasks(this.removedItems(), delPhoto);
        };
        // Upload to remote REST API every photo or data in sequence
        var uploadAllItems = () => {
            const setPhoto = (photo) => workPhotos.setItem(photo.model.toPlainObject(true));
            return serialTasks(this.list(), setPhoto);
        };
        this.save = () => {
            remoteDeleteFlaggedItems()
            .then(uploadAllItems)
            .then((/*updatedWorkPhotos*/) => {
                // all executed
                this.app.successSave();
                this.removedItems.removeAll();
            })
            .catch((error) => {
                showError({
                    title: 'Error saving your photos',
                    error
                });
            });
        };
    }

    __connectFileUploader() {
        if (!photoTools.takePhotoSupported()) {
            // Web version to pick a photo/file
            this.inputElement.subscribe((input) => {
                if (!input) return;
                var $input = $(input);
                // Constant size: is the maximum as defined in the CSS and server processing.
                var PHOTO_WIDTH = 442;
                var PHOTO_HEIGHT = 332;
                $input.fileupload({
                    // Asigned per file uploaded:
                    //url: 'assigned per file uploaded',
                    //type: 'PUT',
                    //paramName: 'file',
                    dataType: 'json',
                    autoUpload: false,
                    acceptFileTypes: /(\.|\/)(jpe?g)$/i,
                    maxFileSize: 5000000, // 5MB
                    disableImageResize: true,
                    // // Enable image resizing, except for Android and Opera,
                    // // which actually support image resizing, but fail to
                    // // send Blob objects via XHR requests:
                    // disableImageResize: /Android(?!.*Chrome)|Opera/
                    // .test(window.navigator.userAgent),
                    previewMaxWidth: PHOTO_WIDTH,
                    previewMaxHeight: PHOTO_HEIGHT,
                    previewCrop: false
                })
                .on('fileuploadprocessalways', (e, data) => {
                    var file = data.files[data.index];
                    if (file.error) {
                        // TODO Show preview error?
                        console.error('Photo Preview', file.error);
                    }
                    else if (file.preview) {
                        //this.viewModel.list()[data.index].localTempPhotoPreview(file.preview);
                        var newItem = new WorkPhoto({
                            workPhotoID: 0,
                            jobTitleID: this.jobTitleID(),
                            url: null,
                            localTempFileData: data,
                            localTempPhotoPreview: file.preview,
                            caption: ''
                        });
                        this.list.push(newItem);

                        // Usability/accessibility: after add a new item, move focus
                        // to it's caption textbox.
                        // Give a moment to allow DOM processing using a timeout
                        setTimeout(() => {
                            this.$activity
                            .find('.WorkPhotos > li:last-child input[type=text]')
                            .focus();
                        });
                    }
                });
            });
        }
    }

    __connectJobTitle(jobTitleID) {
        this.jobTitleID(jobTitleID);
        if (jobTitleID) {
            // Get data for the Job title ID
            workPhotos.getList(jobTitleID)
            .then((list) => {
                // Save for use in the view
                this.list(workPhotos.asModel(list));
            })
            .catch((error) => {
                showError({
                    title: 'There was an error while loading.',
                    error
                });
            });
        }
        else {
            this.list([]);
        }
    }

    /**
     * Managed route: /{jobTitleID}
     * @param {Object} state
     * @param {Object} state.route
     * @param {Array<string>} state.route.segments First segments indicates the
     * jobTitleID as a string that represents a number
     */
    show(state) {
        super.show(state);

        // Reset
        this.list.removeAll();
        this.removedItems.removeAll();
        this.jobTitleID(0);

        const jobTitleID = state.route.segments[0] |0;
        this.__connectJobTitle(jobTitleID);
    }
}

activities.register(ROUTE_NAME, WorkPhotos);
