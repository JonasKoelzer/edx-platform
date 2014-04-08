define(["jquery", "underscore", "gettext", "js/views/modals/base_modal", "jquery.form"],
    function($, _, gettext, BaseModal) {
        var UploadDialog = BaseModal.extend({
            events: {
                "change input[type=file]": "selectFile",
                "click .action-upload": "upload"
            },

            options: $.extend({}, BaseModal.prototype.options, {
                modalName: 'assetupload',
                modalSize: 'med',
                successMessageTimeout: 2000 // 2 seconds
            }),

            initialize: function() {
                BaseModal.prototype.initialize.call(this);
                this.events = _.extend({}, BaseModal.prototype.events, this.events);
                this.template = this.loadTemplate("upload-dialog");
                this.listenTo(this.model, "change", this.renderContents);
                this.options.title = this.model.get('title');
            },

            addActionButtons: function() {
                this.addActionButton('upload', gettext("Upload"), true);
                BaseModal.prototype.addActionButtons.call(this);
            },

            renderContents: function() {
                var isValid = this.model.isValid(),
                    selectedFile = this.model.get('selectedFile'),
                    oldInput = this.$("input[type=file]").get(0);
                BaseModal.prototype.renderContents.call(this);
                // Ideally, we'd like to tell the browser to pre-populate the
                // <input type="file"> with the selectedFile if we have one -- but
                // browser security prohibits that. So instead, we'll swap out the
                // new input (that has no file selected) with the old input (that
                // already has the selectedFile selected). However, we only want to do
                // this if the selected file is valid: if it isn't, we want to render
                // a blank input to prompt the user to upload a different (valid) file.
                if (selectedFile && isValid) {
                    $(oldInput).removeClass("error");
                    this.$('input[type=file]').replaceWith(oldInput);
                    this.$('.action-upload').removeClass('disabled');
                } else {
                    this.$('.action-upload').addClass('disabled');
                }
                return this;
            },

            getContentHtml: function() {
                return this.template({
                    url: this.options.url || CMS.URL.UPLOAD_ASSET,
                    message: this.model.escape('message'),
                    selectedFile: this.model.get('selectedFile'),
                    uploading: this.model.get('uploading'),
                    uploadedBytes: this.model.get('uploadedBytes'),
                    totalBytes: this.model.get('totalBytes'),
                    finished: this.model.get('finished'),
                    error: this.model.validationError
                });
            },

            selectFile: function(e) {
                this.model.set({
                    selectedFile: e.target.files[0] || null
                });
            },

            upload: function(e) {
                if (e && e.preventDefault) { e.preventDefault(); }
                this.model.set('uploading', true);
                this.$("form").ajaxSubmit({
                    success: _.bind(this.success, this),
                    error: _.bind(this.error, this),
                    uploadProgress: _.bind(this.progress, this),
                    data: {
                        // don't show the generic error notification; we're in a modal,
                        // and we're better off modifying it instead.
                        notifyOnError: false
                    }
                });
            },

            progress: function(event, position, total) {
                this.model.set({
                    "uploadedBytes": position,
                    "totalBytes": total
                });
            },

            success: function(response, statusText, xhr, form) {
                this.model.set({
                    uploading: false,
                    finished: true
                });
                if (this.options.onSuccess) {
                    this.options.onSuccess(response, statusText, xhr, form);
                }
                var that = this;
                this.removalTimeout = setTimeout(function() {
                    that.hide();
                }, this.options.successMessageTimeout);
            },

            error: function() {
                this.model.set({
                    "uploading": false,
                    "uploadedBytes": 0,
                    "title": gettext("We're sorry, there was an error")
                });
            }
        });
        return UploadDialog;
    }); // end define()
