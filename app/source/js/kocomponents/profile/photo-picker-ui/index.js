/**
 * A presentational component to pick a photo, choose rotation,
 * just meant to be used by other components at this package (profile).
 *
 * @module kocomponents/profile/photo-picker-ui
 */
import '../button-file';
import 'jquery.fileupload-image';
import $ from 'jquery';
import Komponent from '../../helpers/KnockoutComponent';
import { domElementBinding } from 'ko/domElementBinding';
import getObservable from '../utils/getObservable';
import ko from 'knockout';
import photoTools from '../utils/photoTools';
import remote from '../data/drivers/restClient';
import { show as showError } from '../modals/error';
import { show as showNotification } from '../modals/notification';
import template from './template.html';
import { data as user } from '../../data/userProfile';

const TAG_NAME = 'profile-photo-picker-ui';

ko.bindingHandlers.domElement = domElementBinding;

/**
 * The last ID automatically generated. When used, increase and assign to
 * component instance variable, joined to a fixed unique prefix like the TAG_NAME
 * @private {number}
 * @static
 */
let lastAutoId = 0;

/**
 * Component
 */
export default class ProfilePhotoPickerUI extends Komponent {

    static get template() { return template; }

    /**
     * @param {object} params
     */
    constructor(params) {
        super();

        /// Private constants
        const fallbackPhotoUrl = params.fallbackPhotoUrl;

        // Public constants
        this.uploadUrl = remote.baseUrl + params.uploadUrl;
        this.uploadFieldName = params.uploadFieldName;
        this.photoEditRestUrl = params.editUrl;
        const instanceId = (++lastAutoId);
        this.id = TAG_NAME + '-' + instanceId;
        /**
         * Name of the field name from the returned object of the upload/save
         * operation, that contains a remote updated URL of the params.photoUrl
         * @const {string}
         */
        this.returnedFieldName = params.returnedFieldName;
        this.cameraSettings = Object.assign({}, {
            targetWidth: 600,
            targetHeight: 600,
            quality: 90
        }, params.cameraSettings);

        /// Public variables/observables
        this.remotePhotoUrl = getObservable(params.remotePhotoUrl);
        this.localPhotoData = ko.observable();
        this.localPhotoPreview = ko.observable();
        this.takePhotoSupported = ko.observable(photoTools.takePhotoSupported());
        this.previewPhotoUrl = ko.observable('');
        this.localPhotoUrl = ko.observable('');
        this.rotationAngle = ko.observable(0);
        this.isSaving = ko.observable(false);
        this.isServiceProfessional = user.isServiceProfessional;
        this.inputElement = ko.observable();


        /// Public computeds
        this.photoUrl = ko.pureComputed(() => this.remotePhotoUrl() || fallbackPhotoUrl);
        /**
         * Whether there is a preview being displayed currently, independently
         * of the source for it.
         * @member {KnockoutComputed<boolean>}
         */
        this.hasPreview = ko.pureComputed(() => !!(this.localPhotoPreview() || this.previewPhotoUrl()));
        /**
         * Whether the user has picked a photo for upload or has a previously
         * uploaded photo
         * @member {KnockoutComputed<boolean>}
         */
        this.hasPhoto = ko.pureComputed(() => this.hasPreview() || this.remotePhotoUrl());
        /**
         * Text for the 'upload photo' button
         * @member {KnockoutComputed<string>}
         */
        this.uploadButtonText = ko.pureComputed(() => {
            const has = this.hasPhoto();
            return has ? 'Change photo' : 'Upload photo';
        });
        /**
         * CSS style inline value to apply rotation based on current settings.
         * @member {KnockoutComputed<string>}
         */
        this.photoRotationStyle = ko.pureComputed(() => {
            var d = this.rotationAngle() |0;
            return 'transform: rotate(' + d + 'deg);';
        });
    }

    beforeBinding(componentInfo) {
        super.beforeBinding(componentInfo);

        const input = componentInfo.element.querySelector('input');
        // Update the member (needed for the button-file component)
        this.inputElement(input);
        // NOTE: uploader options just for web uploads
        if (!this.takePhotoSupported()) {
            input.subscribe(function(input) {
                if (!input) return;
                var $input = $(input);
                var uploaderOptions = {
                    url: this.uploadUrl,
                    dataType: 'json',
                    type: 'PUT',
                    paramName: this.uploadFieldName,
                    autoUpload: false,
                    acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
                    maxFileSize: 5000000, // 5MB
                    disableImageResize: true,
                    // // Enable image resizing, except for Android and Opera,
                    // // which actually support image resizing, but fail to
                    // // send Blob objects via XHR requests:
                    // disableImageResize: /Android(?!.*Chrome)|Opera/
                    // .test(window.navigator.userAgent),
                    previewMaxWidth: 120,
                    previewMaxHeight: 120,
                    previewCrop: true
                };
                var uploaderEventHandlers = {
                    fileuploadadd: (e, data) => {
                        this.localPhotoData(data);
                        this.rotationAngle(0);
                    },
                    fileuploadprocessalways: (e, data) => {
                        var file = data.files[data.index];
                        if (file.error) {
                            // TODO Show preview error?
                            console.error('Photo Preview', file.error);
                        }
                        else if (file.preview) {
                            this.localPhotoPreview(file.preview);
                        }
                    }
                };
                $input.fileupload(uploaderOptions);
                Object.keys(uploaderEventHandlers)
                .forEach(function(eventName) {
                    $input.on(eventName, uploaderEventHandlers[eventName]);
                });
            }.bind(this));
        }
    }

    rotatePhoto() {
        var d = this.rotationAngle() |0;
        this.rotationAngle((d + 90) % 360);
    }

    /**
     * Sends rotationAngle value to server (if different than zero)
     * asking to rotate the photo already there
     * (the 'remote photo').
     *
     * This is used only when there is no new file to upload, because
     * that code already includes this editing.
     *
     * TODO: implement cropping, taking care of the exception.
     */
    editRemotePhoto() {
        var r = this.rotationAngle();
        if (r === 0) return Promise.resolve(null);

        return remote.post(this.photoEditRestUrl, {
            rotationAngle: r
        });
    }

    uploadPhoto() {
        if (photoTools.takePhotoSupported()) {
            return nativeUploadPhoto({
                localPhotoUrl: this.localPhotoUrl(),
                photoUploadUrl: this.uploadUrl(),
                photoUploadFieldName: this.uploadFieldName,
                rotationAngle: this.rotationAngle(),
                fallback: this.editRemotePhoto.bind(this)
            });
        }
        else {
            return webUploadPhoto({
                localPhotoData: this.localPhotoData(),
                rotationAngle: this.rotationAngle(),
                fallback: this.editRemotePhoto.bind(this)
            });
        }
    }

    takePhoto() {
        takePickPhoto({
            fromCamera: true,
            cameraSettings: this.cameraSettings,
            localPhotoUrlObservable: this.localPhotoUrl,
            previewPhotoUrlObservable: this.previewPhotoUrl,
            rotationAngle: this.rotationAngle
        });
    }

    pickPhoto() {
        takePickPhoto({
            fromCamera: true,
            cameraSettings: this.cameraSettings,
            localPhotoUrlObservable: this.localPhotoUrl,
            previewPhotoUrlObservable: this.previewPhotoUrl,
            rotationAngle: this.rotationAngle
        });
    }

    save() {
        if (this.isSaving()) return Promise.reject();
        this.isSaving(true);
        return this.uploadPhoto()
        .then((data) => {
            this.isSaving(false);
            if (data) {
                // Use the returned update URL
                const url = data[this.returnedFieldName];
                this.remotePhotoUrl(url);
                // Request the photo from remote to force cache to refresh
                $.get(url);
            }
        })
        .catch((err) => {
            this.isSaving(false);
            // re-throw
            throw err;
        });
    }
}

ko.components.register(TAG_NAME, ProfilePhotoPickerUI);

function nativeUploadPhoto(options) {
    const {
        localPhotoUrl,
        photoUploadUrl,
        photoUploadFieldName,
        rotationAngle,
        fallback
    } = options;

    if (!localPhotoUrl) return fallback();
    var uploadSettings = {
        fileKey: photoUploadFieldName,
        mimeType: 'image/jpeg',
        httpMethod: 'PUT',
        headers: $.extend(true, {}, remote.extraHeaders),
        params: {
            rotationAngle: rotationAngle
        }
    };
    return photoTools.uploadLocalFileJson(
        localPhotoUrl,
        photoUploadUrl,
        uploadSettings
    );
}

function webUploadPhoto(options) {
    const {
        localPhotoData,
        rotationAngle,
        fallback
    } = options;

    if (!localPhotoData) return fallback();
    // NOTE: If URL needs update before upload: localPhotoData.url = ..;
    localPhotoData.headers = $.extend(true, {}, remote.extraHeaders);
    localPhotoData.formData = [{
        name: 'rotationAngle',
        value: rotationAngle
    }];
    return Promise.resolve(localPhotoData.submit());
}

function takePickPhoto(options) {
    const {
        fromCamera,
        cameraSettings,
        localPhotoUrlObservable,
        previewPhotoUrlObservable,
        rotationAngleObservable
    } = options;

    const settings = $.extend({}, cameraSettings, {
        sourceType: fromCamera ?
            window.Camera && window.Camera.PictureSourceType.CAMERA :
            window.Camera && window.Camera.PictureSourceType.PHOTOLIBRARY
    });
    if (photoTools.takePhotoSupported()) {
        photoTools.cameraGetPicture(settings)
        .then(function(imgLocalUrl) {
            localPhotoUrlObservable(imgLocalUrl);
            previewPhotoUrlObservable(photoTools.getPreviewPhotoUrl(imgLocalUrl));
            rotationAngleObservable(0);
        }.bind(this))
        .catch(function(err) {
            // A user abort gives no error or 'no image selected' on iOS 9/9.1
            if (err && err !== 'no image selected' && err !== 'has no access to camera') {
                showError({ error: err, title: 'Error getting photo.' });
            }
        });
    }
    else {
        showNotification({
            message: 'Take photo is not supported on the web right now'
        });
    }
}
