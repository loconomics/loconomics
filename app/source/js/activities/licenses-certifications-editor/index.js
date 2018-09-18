/**
 * LicensesCertificationsEditor
 *
 * @module activities/licenses-certifications-editor
 *
 * FIXME: Complete jsdocs, description
 * TODO: Quick460 Must complete refactoring
 */

import 'jquery.fileupload-image';
import '../../kocomponents/button-file';
import * as activities from '../index';
import $ from 'jquery';
import Activity from '../../components/Activity';
import ModelVersion from '../../utils/ModelVersion';
import UserLicenseCertification from '../../models/UserLicenseCertification';
import UserType from '../../enums/UserType';
import jobTitleLicenses from '../../data/jobTitleLicenses';
import ko from 'knockout';
import licenseCertification from '../../data/licenseCertification';
import onboarding from '../../data/onboarding';
import photoTools from '../../utils/photoTools';
import shell from '../../app.shell';
import { show as showConfirm } from '../../modals/confirm';
import { show as showError } from '../../modals/error';
import style from './style.styl';
import template from './template.html';
import userLicensesCertifications from '../../data/userLicensesCertifications';

const ROUTE_NAME = 'licenses-certifications-editor';

export default class LicensesCertificationsEditor extends Activity {

    static get template() { return template; }

    static get style() { return style; }

    constructor($activity, app) {
        super($activity, app);

        this.accessLevel = UserType.serviceProfessional;
        this.navBar = Activity.createSubsectionNavBar('Job Title', {
            backLink: '/listings',
            helpLink: '/help/relatedArticles/201967966-adding-professional-licenses-and-certifications'
        });
        this.defaultNavBarSettings = this.navBar.model.toPlainObject(true);
        this.title('Your credentials');

        this.__defViewProperties();
        this.__defViewMethods();
        this.__connectPhotoUploader();
    }

    __defViewProperties() {
        this.isInOnboarding = onboarding.inProgress;
        this.userLicenseCertificationID = ko.observable(0);
        this.licenseCertificationID = ko.observable(0);
        this.jobTitleID = ko.observable(0);
        this.inputElement = ko.observable();
        this.isLoading = ko.pureComputed(() => userLicensesCertifications.state.isLoading());
        this.isSaving = userLicensesCertifications.state.isSaving;
        this.isSyncing = userLicensesCertifications.state.isSyncing;
        this.isDeleting = userLicensesCertifications.state.isDeleting;
        this.isLocked = ko.pureComputed(() => userLicensesCertifications.state.isLocked());
        this.isReady = ko.pureComputed(() => {
            var it = this.item();
            return !!(it && (it.localTempFilePath() || it.localTempFileData()));
        });
        this.takePhotoSupported = ko.observable(photoTools.takePhotoSupported());
        this.submitText = ko.pureComputed(() => {
            if (this.isLoading() || this.isSyncing()) {
                return 'Loading..';
             }
             else {
                return this.isSaving() ?
                    'Saving..' :
                    this.isDeleting() ?
                    'Deleting..' :
                    'Save';
             }
        });
        this.isNew = ko.pureComputed(() => !this.userLicenseCertificationID());
        this.version = ko.observable(null);
        this.item = ko.pureComputed(() => {
            var v = this.version();
            if (v) {
                return v.version;
            }
            return null;
        });
        this.unsavedChanges = ko.pureComputed(() => {
            var v = this.version();
            return v && v.areDifferent();
        });
        this.deleteText = ko.pureComputed(() => this.isDeleting() && 'Deleting...' || 'Delete');
    }

    __defViewMethods() {
        this.save = () => {
            var data = this.item().model.toPlainObject(true);
            userLicensesCertifications
            .setItem(data)
            .then((serverData) => {
                // Update version with server data.
                this.item().model.updateWith(serverData);
                // Push version so it appears as saved
                this.version().push({ evenIfObsolete: true });
                // Cache of licenses info for the user and job title is dirty, clean up so is updated later
                jobTitleLicenses.clearCache();
                userLicensesCertifications.clearCache();
                // Go out
                if (onboarding.inProgress()) {
                    shell.goBack();
                }
                else {
                    this.app.successSave();
                }
            })
            .catch((err) => {
                showError({
                    title: 'Unable to save.',
                    error: err
                });
            });
        };
        this.confirmRemoval = () => {
            // L18N
            showConfirm({
                title: 'Delete',
                message: 'Are you sure? This cannot be undone.',
                yes: 'Delete',
                no: 'Keep'
            })
            .then(() => {
                this.remove();
            });
        };
        this.remove = () => {
            userLicensesCertifications
            .delItem(this.jobTitleID(), this.userLicenseCertificationID())
            .then(() => {
                // Go out
                shell.goBack();
            })
            .catch((err) => {
                showError({
                    title: 'Unable to delete.',
                    error: err
                });
            });
        };
        const addNew = (fromCamera) => {
            var settings = {
                sourceType: fromCamera ?
                    window.Camera && window.Camera.PictureSourceType.CAMERA :
                    window.Camera && window.Camera.PictureSourceType.PHOTOLIBRARY
            };
            if (photoTools.takePhotoSupported()) {
                photoTools.cameraGetPicture(settings)
                .then((imgLocalUrl) => {
                    this.item().localTempFilePath(imgLocalUrl);
                    this.item().localTempPhotoPreviewUrl(photoTools.getPreviewPhotoUrl(imgLocalUrl));
                })
                .catch((err) => {
                    // A user abort gives no error or 'no image selected' on iOS 9/9.1
                    if (err && err !== 'no image selected' && err !== 'has no access to camera') {
                        showError({ error: err, title: 'Error selecting photo.' });
                    }
                });
            }
            else {
                showError({ error: 'This feature is currently only available on mobile devices' });
            }
        };
        this.takePhotoForNew = () => addNew(true);
        this.pickPhotoForNew = () => addNew(false);
    }

    __connectPhotoUploader() {
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
                    acceptFileTypes: /(\.|\/)(png|gif|tiff|pdf|jpe?g)$/i,
                    maxFileSize: 20000000, // 20MB
                    disableImageResize: true,
                    // // Enable image resizing, except for Android and Opera,
                    // // which actually support image resizing, but fail to
                    // // send Blob objects via XHR requests:
                    // disableImageResize: /Android(?!.*Chrome)|Opera/
                    // .test(window.navigator.userAgent),
                    previewMaxWidth: PHOTO_WIDTH,
                    previewMaxHeight: PHOTO_HEIGHT,
                    previewCrop: true
                })
                .on('fileuploadadd', (e, data) => {
                    this.item().localTempFileData(data);
                    if (!data.originalFiles.length ||
                        !/^image\//.test(data.originalFiles[0].type)) {
                        this.item().localTempPhotoPreview(null);
                    }
                    this.item()
                    .localTempFileName(data.originalFiles[0] && data.originalFiles[0].name);
                })
                .on('fileuploadprocessalways', (e, data) => {
                    var file = data.files[data.index];
                    if (file.error) {
                        // TODO Show preview error?
                        this.item().localTempPhotoPreview(null);
                        console.error('Photo Preview', file.error);
                    }
                    else if (file.preview) {
                        //this.item().localTempFileData(data);
                        this.item().localTempPhotoPreview(file.preview);
                    }
                });
            });
        }
    }

    loadData() {
        if (!this.isNew()) {
            userLicensesCertifications
            .getItem(this.jobTitleID(), this.userLicenseCertificationID())
            .then((data) => {
                this.version(new ModelVersion(new UserLicenseCertification(data)));
            })
            .catch((err) => {
                showError({
                    title: 'There was an error while loading.',
                    error: err
                })
                .then(() => {
                    // On close modal, go back
                    shell.goBack();
                });
            });
        }
        else {
            licenseCertification
            .getItem(this.licenseCertificationID())
            .then((data) => {
                var item = new UserLicenseCertification({
                    jobTitleID: this.jobTitleID(),
                    licenseCertificationID: this.licenseCertificationID()
                });
                item.licenseCertification().model.updateWith(data);
                this.version(new ModelVersion(item));
            })
            .catch((err) => {
                showError({
                    title: 'There was an error while loading.',
                    error: err
                })
                .then(() => {
                    // On close modal, go back
                    shell.goBack();
                });
            });
        }
    }

    updateNavBarState() {
        var link = this.requestData.cancelLink || '/licenses-certifications/';

        if (this.isNew()) {
            this.convertToCancelAction(this.navBar.leftAction(), link);
        }
        else {
            this.navBar.model.updateWith(this.defaultNavBarSettings, true);
        }
    }

    show(state) {
        super.show(state);

        // Reset
        this.version(null);

        // Params
        var params = state.route.segments || [];
        var query = state.route.query || {};

        this.jobTitleID(params[0] |0);
        this.userLicenseCertificationID(params[1] |0);
        this.licenseCertificationID(query.licenseCertificationID |0);

        this.updateNavBarState();
        this.loadData();
    }
}

activities.register(ROUTE_NAME, LicensesCertificationsEditor);
