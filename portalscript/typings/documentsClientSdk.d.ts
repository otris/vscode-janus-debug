declare namespace documents {
    namespace sdk {
        class DocumentsContext {
            /**
             * The universal interface for user-exits, gentable and gadgets. It includes opening of dialogs and navigation
             * to folders, files, the extended search other etc. Additional interfaces are available via the
             * {@link UserContext},
             * {@link FileContext},
             * {@link GadgetContext} and the
             * {@link GentableContext}.
             */
            constructor();

            /**
             * Returns the <code>UserContext</code> of the current system user.
             * @returns The UserContext
             */
            getUserContext(): UserContext;

            /**
             * Returns a [`FileContext`]{@link FileContext}.
             * @returns The FileContext
             */
            getFileContext(): FileContext;

            /**
             * Returns an [`ExtendedSearchContext`]{@link ExtendedSearchContext}.
             * @returns The ExtendedSearchContext
             */
            getExtendedSearchContext(): ExtendedSearchContext;

            /**
             * Returns a [`GentableContext`]{@link GentableContext}.
             * @returns The GentableContext
             */
            getGentableContext(): GentableContext;

            /**
             * Returns a [`GadgetContext`]{@link GadgetContext}.
             * @returns The GadgetContext
             */
            getGadgetContext(): GadgetContext;

            /**
             * Returns an [`I18nContext`]{@link I18nContext}.
             * @returns The I18nContext
             */
            getI18nContext(): I18nContext;

            /**
             * Changes the current view to the start screen view.
             * Caution: This function will not process any actions if the user is currently in edit mode.
             */
            openHomeView(): void;

            /**
             * Opens the outbar with the given name.
             * @param options
             * @param options.name Possible values:
             *        *OutbarPublicFolder*  //The outbar for public folders (Documents Manager - Settings - Documents (display) - Combined folder tree not checked)
             *        *OutbarPrivateFolder*  //The outbar for private folders (Documents Manager - Settings - Documents (display) - Combined folder tree not checked)
             *        *OutbarCombinedFolder*  //The outbar for a combination of public and private folders (Documents Manager - Settings - Documents (display) - Combined folder tree checked)
             *        *OutbarHitTree*  //The outbar for a hit tree (Documents Manager - Settings - Global Settings - Hit tree checked)
             *        User defined outbars can be accessed by their name (Documents Manager - settings - Outbars).
             */
            openOutbar(options: openOutbar_options): void;

            /**
             * Changes the current view to a folder view. It is allowed to navigate to any private or public folder.
             * Caution: This function will not process any actions if the user is currently in edit mode.
             * @param folderId the id of the folder
             */
            openFolderView(folderId: String): void;

            /**
             * Changes the current view to a file view. It is allowed to navigate to a file (cover), to a register or to a document.
             * Caution: This function will not process any actions if the user is currently in edit mode.
             * @param fileId the id of the file
             * @param registerId the id of the file register
             * @param documentId the id of the file document
             * @param options
             * @param options.autoOpenDocumentMode , default: true
             * @param options.checkConstraints if constraints should be checked or not, default: true
             * @param options.startFileEditMode if file edit mode should be started or not, default: false
             * @param options.registerBarState "open", "min", "closed", default :
             */
            openFileView(fileId: String, registerId?: String, documentId?: String, options?: openFileView_options): void;

            /**
             * Updates the current file view.
             * In file edit mode, this operation automatically stores the values of all visible file fields while ignoring any constraints.
             */
            updateFileView(): void;

            /**
             * Changes the current view to the extended search view.
             * Caution: This function will not process any actions if the user is currently in edit mode.
             */
            openExtendedSearchView(): void;

            /**
             * Displays a dialog window that requests the current system user for confirmation.
             * The dialog window is displayed in front of the main window and system users always have to interact with it before they can return to the main window.
             * Note that unlike a <code>window.prompt()</code> dialog, the execution of the current program flow is <i>not</i> paused until the user cancels or confirms the dialog.
             * @param title the title of the dialog window
             * @param message the confirmation message text
             * @param onOk a function that is executed if the user clicks "OK"
             * @param onCancel a function that is executed if the user clicks "Cancel"
             * @param onClose a function that is executed if the user clicks "OK", "Cancel" or "X". The function is executed after the onOk or onCancel function.
             * @see [closeDialog]{@link DocumentsContext#closeDialog}
             */
            openConfirmationDialog(title: String, message: String, onOk: Function, onCancel: Function, onClose: Function): void;

            /**
             * Creates and returns a documents application servlet url by a defined type. Optional parameters must be provided in some cases.
             * @param type the type of the servlet url that should be returned<br>
             *        <code>annotation</code> (<code>options</code>: <code>fileId</code>, <code>documentId</code>) URL to access the annotations of a pdf/tif file
             *        <code>controlSheet</code> (<code>options</code>: <code>fileId</code>, <code>registerId</code>) URL for a control sheet
             *        <code>gadget</code> URL for a gadget
             *        <code>docDownload</code> URL to download a file (<code>options</code>: <code>fileId</code>, <code>documentId</code>, <code>attachmentType</code>, <code>versionId</code>, <code>attachmentMode</code>)
             *        <code>pdfjsViewer</code> URL to access the pdfjs viewer
             *        <code>otrisViewer</code> URL to access the otris viewer
             *        <code>report</code> URL for a report
             *        <code>docUpload</code> URL to access the upload servlet
             *        <code>userLogin</code> URL to login the current user
             *        <code>userLogout</code> URL to logout the current user
             * @param options additional options needed for some types
             * @param options.absolute default false, if true the function will return an absolute url, otherwise a relative url
             * @param options.fileId the id of the file
             * @param options.documentId the id of the file document
             * @param options.registerId the id of the file register
             * @param options.filename the file name of a file document
             * @param options.attachmentMode
             * @param options.attachmentType
             * @param options.versionId the id of a file document version
             */
            getURL(type: String, options?: getURL_options): String;

            /**
             * Displays a message dialog window.
             * The dialog window is displayed in front of the main window and system users always have to interact with it before they can return to the main window.
             * Note that unlike a <code>window.alert()</code> dialog, the execution of the current program flow is <i>not</i> paused until the user cancels or confirms the dialog.
             * @param title the title of the dialog window
             * @param message the message text
             * @param onOk a function that is executed if the user clicks "OK"
             * @param onClose a function that is executed if the user clicks "OK" or "X". The function is executed after the onOk function.
             * @see [closeDialog]{@link DocumentsContext#closeDialog}
             */
            openMessageDialog(title: String, message: String, onOk: Function, onClose: Function): void;

            /**
             * Displays a html dialog window.
             * The dialog window is displayed in front of the main window and system users always have to interact with it before they can return to the main window.
             * Note that unlike a <code>window.alert()</code> dialog, the execution of the current program flow is <i>not</i> paused until the user cancels or confirms the dialog.
             * @param title the title of the dialog window
             * @param html the inner html content source
             * @param onOk a function that is executed if the user clicks "OK"
             * @param onClose a function that is executed if the user clicks "OK" or "X". The function is executed after the onOk function.
             * @see [closeDialog]{@link DocumentsContext#closeDialog}
             */
            openHtmlDialog(title: String, html: String, onOk: Function, onClose: Function): void;

            /**
             * Displays a dialog with an embedded iframe.
             * @param title the title of the dialog window
             * @param frameSrc the url of the embedded iframe
             * @param options
             * @param options.width the width of the dialog, default: 400
             * @param options.height the height of the dialog, default: 300
             * @param options.top the distance from the top of the window
             * @param options.left the distance from the left of the window
             * @param options.frameStyles the styles of the dialog
             * @param options.frameStyleClasses the classes of the dialog
             * @param options.onClose function to execute when close is clicked
             * @param options.onOk function to execute when ok is clicked
             * @param options.onCancel function to execute when cancel is clicked
             */
            openFrameDialog(title: String, frameSrc: String, options?: openFrameDialog_options): void;

            /**
             * Closes any dialog that is currently displayed.
             */
            closeDialog(): void;

            /**
             * Opens a dedicated dialog for the tabledata plugin.
             * Basically, there are two different dialog types available, one (internal) iframe dialog (default) and another (external) popup window dialog.
             * The internal iframe dialog appears like an ordinary DOCUMENTS 5 dialog, the external popup window dialog is the more traditional way.
             * This function supports fully automatic setting of file field data, gentable row data or email dialog recipient data on a tabledata row selection.
             * Alternatively, a custom handler function can be implemented which will be executed on tabledata row selection.
             * If the automatic field setting should be used, the <code>exitOptions</code> option must be specified. Otherwise, if a custom row selection handler should be used, the the <code>onSelect</code> option must be specified.
             * If both options are set by accident, <code>onSelect</code> option overrides the <code>exitOptions</code> option and also any automatic data setting.
             * See the examples below for recommended implementations of <code>detail.jsp</code>. Legacy D5 implementations of <code>detail.jsp</code> are fully supported so updating the code is not mandatory in most cases.
             * @param title the title of the dialog window
             * @param url the url of the <code>table.jsp</code>
             * @param options
             * @param options.onSelect custom handler function that is executed after the selection of a tabledata row entry, the selected data is available as a function parameter.
             *        Notice: If this option is set, none of the fields will be set automatically.
             * @param options.exitOptions the <code>options</code> object of the registered exit callback function, see examples below for details.
             *        Should be provided if <code>options.onSelect</code> option is not set.
             * @param options.popupWin <code>true</code>, if an (external) popup window should be used to display the tabledata, otherwise an (internal) iframe dialog is used (default)
             * @param options.width the width of the dialog, default: 400
             * @param options.height the height of the dialog, default: 300
             * @param options.top the top position of the dialog
             * @param options.left the left position of the dialog
             * @param options.onClose custom handler function that is executed when the dialog is closed, not available if <code>popupWin: true</code> is set
             * @param options.sortColumn the column that sorts the tabledata, add '+' or '-' at the end of the column name to set the sort order. Default: '+'
             * @param options.searchText the default search text, tabledata is searched on opening
             * @param options.searchColumn the column to search the searchText in
             * @param options.params additional parameter that will be added to the url
             */
            openTableDataDialog(title: String, url: String, options?: openTableDataDialog_options): void;

            /**
             * Returns a transient session web storage by its key. If the key is omitted, a "custom" session storage is returned by default.
             * @param key the key of the storage
             */
            getSessionStorage(key: String): SessionStorage;

            /**
             * Returns a persistent local web storage by its key. If the key is omitted, a "custom" local storage is returned by default.
             * @param key the key of the storage
             */
            getLocalStorage(key: String): LocalStorage;

            /**
             * Closes a gadget. Currently only useful when the gadget is used in a popup dialog.
             */
            closeGadget(): void;

            /**
             * Executes a server-side global script by its name. Any defined script parameters can be transmitted alike.
             * The script can either be called <i>synchronous</i> (default) or <i>asynchronous</i> (via options parameter).
             * If the script result has a defined <code>returnType</code> (defined by context.returnType in the portal script) the
             * function has <strong>no return value</strong> and the output depends on the returnType.
             * With the option <code>dispatch</code> it is possible to always retrieve the script result even if a returnType is defined.
             * options.dispatch must be set to <strong>false</strong> (defaults to true) to use the script result as return value.
             * With <code>option.async = true</code> the function always returns a Promise object. If this option is set it is also
             * possible to input script parameters defined in the Documents Manager via a dialog. Script parameters added via dialog
             * will override duplicate <code>scriptParams</code> keys.
             * @param scriptName - the name of the script
             * @param scriptParams - the input parameters for the script
             * @param options - additional options
             * @param options.dispatch default true, if false scriptResult is returned even if the script has a returnType
             * @param options.async default false, if true the script will be executed asynchronous and will return a promise
             * @param options.useScriptParameterDialog default false, if true a script parameter dialog will always be displayed if the script has defined parameter, only works if options.async = true
             * @param options.dialogTitle the title of the script parameter dialog
             */
            executeScript(scriptName: String, scriptParams?: Object, options?: executeScript_options): Promise | String | undefined;

            /**
             * Encodes an URL by adding the <code>jsessionid</code> and the <code>cnvid</code> to it. A <code>jsessionid</code> is provided if cookies are disabled only.
             * URLs must be encoded always if calling custom servlets or jsps and access to the tomcat server session is required.
             * @param url the url to be encoded
             * @see [getBaseParams]{@link DocumentsContext#getBaseParams}
             * @see [getBaseParamsQueryString]{@link DocumentsContext#getBaseParamsQueryString}
             */
            encodeURL(url: String): String;

            /**
             * Returns all documents application related base parameters as object. It includes both the principal (<code>pri</code>) and the language (<code>lang</code>) parameter.
             * @see [encodeURL]{@link DocumentsContext#encodeURL}
             * @see [getBaseParamsQueryString]{@link DocumentsContext#getBaseParamsQueryString}
             */
            getBaseParams(): Object;

            /**
             * Returns the query string of all documents application related base parameters as query string. It includes both the principal (<code>pri</code>) and the language (<code>lang</code>) parameter.
             * @see [encodeURL]{@link DocumentsContext#encodeURL}
             * @see [getBaseParams]{@link DocumentsContext#getBaseParams}
             */
            getBaseParamsQueryString(): String;

            /**
             * This function locks a defined view for the current user by a view identifier.
             * Valid view identifiers are <code>Workspace</code>, <code>MainTree</code>, <code>MainList</code>, <code>MainFile</code>, <code>MainFileGentable</code>.
             * @param view the identifier of the view that is to be locked
             * @see [stopBusyPanel]{@link DocumentsContext#stopBusyPanel}
             */
            startBusyPanel(view: String): void;

            /**
             * This function unlocks a defined view for the current user by a view identifier.
             * Valid view identifiers are <code>Workspace</code>, <code>MainTree</code>, <code>MainList</code>, <code>MainFile</code>, <code>MainFileGentable</code>.
             * @param view the identifier of the view that is to be unlocked
             * @see [startBusyPanel]{@link DocumentsContext#startBusyPanel}
             */
            stopBusyPanel(view: String): void;

        }

        namespace exitRegistry {
            /**
             * Registers a callback function that can be attached to a file related exit event.
             * @param fileTypeName the technical name(s) of the file type(s), each separated by <code>,</code> or <code>*</code> for any file type name
             * @param event the exit event name, i.e. one of the valid event identifiers listed below<br><br>
             *        <code>File.afterSetModelData</code><br>
             *        <code>File.beforeFileRender</code><br>
             *        <code>File.afterFileRender</code><br>
             *        <code>File.afterFileOpen</code><br>
             *        <code>File.beforeFileEditStart</code> (optionally cancels the file edit start action if callback `fn` returns `false`)<br>
             *        <code>File.afterFileEditStart</code><br>
             *        <code>File.beforeFileEditCancel</code> (optionally cancels the file edit cancel action if callback `fn` returns `false`)<br>
             *        <code>File.afterFileEditCancel</code><br>
             *        <code>File.beforeFileEditCommit</code> (optionally cancels the file edit commit action if callback `fn` returns `false`)<br>
             *        <code>File.afterFileEditCommit</code><br>
             *        <code>File.beforeFileCustomAction</code> (optionally cancels the file custom action if callback `fn` returns `false`)<br>
             *        <code>File.afterFileCustomAction</code><br>
             *        <code>File.beforeFileWorkflowAction</code> (optionally cancels the file workflow action if callback `fn` returns `false`)<br>
             *        <code>File.afterFileWorkflowAction</code><br>
             *        <code>File.beforeFileAction</code><br>
             *        <code>File.afterFileAction</code><br>
             *        <code>FileEmail.recipients</code> (file action dialog "send file as email")<br>
             * @param fn the function (or callback) that will be called if the exit event occurs<br>Notice: Any callback will be executed according to the function signature listed below.
             * @see [DocumentsContext]{@link DocumentsContext}
             * @see [FileContext]{@link FileContext}
             */
            function registerFileExitCallback(fileTypeName: String, event: String, fn: fileExitCallback): void;

            /**
             * Returns all callback functions that are registered to a file related exit event.
             * @param fileTypeName the technical name of the file type
             * @param event the exit event name
             * @see [registerFileExitCallback]{@link documents.sdk.exitRegistry#registerFileExitCallback}
             */
            function getFileExitCallbacks(fileTypeName: String, event: String): function()[];

            /**
             * Registers a callback function that can be attached to a search related exit event.
             * @param event the exit event name, i.e. one of the valid event identifiers listed below<br><br>
             *        <code>ExtendedSearch.afterSetModelData</code><br>
             *        <code>ExtendedSearch.beforeRenderSearchForm</code><br>
             *        <code>ExtendedSearch.afterRenderSearchForm</code><br>
             *        <code>ExtendedSearch.beforeRenderSearchSourceTree</code><br>
             *        <code>ExtendedSearch.afterRenderSearchSourceTree</code><br>
             *        <code>ExtendedSearch.beforeExecuteSearch</code> (optionally cancels the search action if callback `fn` returns `false`)<br>
             *        <code>ExtendedSearch.afterExecuteSearch</code><br>
             *        <code>ExtendedSearch.beforeClearSearchForm</code><br>
             *        <code>ExtendedSearch.afterClearSearchForm</code><br>
             *        <code>ExtendedSearch.beforeToggleSearchSource</code><br>
             *        <code>ExtendedSearch.afterToggleSearchSource</code><br>
             *        <code>ExtendedSearch.beforeToggleMainSearchSource</code><br>
             *        <code>ExtendedSearch.afterToggleMainSearchSource</code><br>
             *        <code>ExtendedSearch.beforeToggleSearchMask</code><br>
             *        <code>ExtendedSearch.afterToggleSearchMask</code><br>
             *        <code>ExtendedSearch.beforeToggleHitListMask</code><br>
             *        <code>ExtendedSearch.afterToggleHitListMask</code><br>
             *        <code>DefaultSearch.beforeExecuteSearch</code> (optionally cancels the search action if callback `fn` returns `false`)<br>
             *        <code>DefaultSearch.afterExecuteSearch</code><br>
             * @param fn the function (or callback) that will be called if the exit event occurs<br>Notice: Any callback will be executed according to the function signature listed below.
             * @see [DocumentsContext]{@link DocumentsContext}
             * @see [ExtendedSearchContext]{@link ExtendedSearchContext}
             */
            function registerSearchExitCallback(event: String, fn: searchExitCallback): void;

            /**
             * Returns all callback functions that are registered to a search related exit event.
             * @param event the exit event name
             * @see [registerSearchExitCallback]{@link documents.sdk.exitRegistry#registerSearchExitCallback}
             */
            function getSearchExitCallbacks(event: String): function()[];

            /**
             * Registers a callback function that can be attached to a search field related exit event.
             * @param fieldName the technical name(s) of the search field(s), each separated by <code>,</code> or <code>*</code> for any search field name
             * @param fn the function (or callback) that will be called if the exit event occurs<br>Notice: Any callback will be executed according to the function signature listed below.
             * @see [DocumentsContext]{@link DocumentsContext}
             * @see [ExtendedSearchContext]{@link ExtendedSearchContext}
             */
            function registerSearchFieldExitCallback(fieldName: String, fn: searchFieldExitCallback): void;

            /**
             * Returns all callback functions that are registered to a search field related exit event.
             * @param fieldName the fields name
             * @see [registerSearchFieldExitCallback]{@link documents.sdk.exitRegistry#registerSearchFieldExitCallback}
             */
            function getSearchFieldExitCallbacks(fieldName: String): function()[];

            /**
             * Registers a callback function that can be attached to a file field related exit event.
             * @param fileTypeName the technical name(s) of the file type(s), each separated by <code>,</code> or <code>*</code> for any file type name
             * @param fieldName the technical name(s) of the file field(s), each separated by <code>,</code> or <code>*</code> for any file field name
             * @param fn the function (or callback) that will be called if the exit event occurs<br>Notice: Any callback will be executed according to the function signature listed below.
             * @see [DocumentsContext]{@link DocumentsContext}
             * @see [FileContext]{@link FileContext}
             */
            function registerFileFieldExitCallback(fileTypeName: String, fieldName: String, fn: fileFieldExitCallback): void;

            /**
             * Returns all callback functions that are registered to a file field related exit event.
             * @param fileTypeName the technical name of the file type
             * @param fieldName the technical name of the file field
             * @see [registerFileFieldExitCallback]{@link documents.sdk.exitRegistry#registerFileFieldExitCallback}
             */
            function getFileFieldExitCallbacks(fileTypeName: String, fieldName: String): function()[];

            /**
             * Registers a callback function that can be attached to a scriptParameter related exit event.
             * @param scriptName the name(s) of the script configered in the manager, each separated by <code>,</code> or <code>*</code> for any scriptname
             * @param event the exit event name, i.e. one of the valid event identifiers listed below<br><br>
             *        <code>ScriptParameter.afterSetModelData</code><br>
             *        <code>ScriptParameter.beforeRender</code><br>
             *        <code>ScriptParameter.afterRender</code><br>
             *        <code>ScriptParameter.beforeExecuteScript</code> (optionally cancels the script action if callback `fn` returns `false`)<br>
             * @param fn the function (or callback) that will be called if the exit event occurs<br>Notice: Any callback will be executed according to the function signature listed below.
             * @see [DocumentsContext]{@link DocumentsContext}
             */
            function registerScriptParameterExitCallback(scriptName: String, event: String, fn: scriptParameterExitCallback): void;

            /**
             * Returns all callback functions that are registered to a ScriptParameter related exit event.
             * @param scriptName the name(s) of the script configered in the manager
             * @param event the exit event name, i.e. one of the valid event identifiers listed in {@link registerScriptParameterExitCallback}<br><br>
             * @see [registerScriptParameterExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterExitCallback}
             */
            function getScriptParameterExitCallbacks(scriptName: String, event: String): function()[];

            /**
             * Registers a callback function that can be attached to a ScriptParameterField related exit event.
             * @param scriptName the name(s) of the script configered in the manager, each separated by <code>,</code> or <code>*</code> for any scriptname
             * @param fieldName the exit field name, i.e. the name of a parameter of the script<br><br>
             * @param fn the function (or callback) that will be called if the exit event occurs<br>Notice: Any callback will be executed according to the function signature listed below.
             * @see [DocumentsContext]{@link DocumentsContext}
             */
            function registerScriptParameterFieldExitCallback(scriptName: String, fieldName: String, fn: scriptParameterFieldExitCallback): void;

            /**
             * Returns all callback functions that are registered to a ScriptParameterField related exit event.
             * @param scriptName the name(s) of the script configered in the manager
             * @param fieldName the exit field name, i.e. the name of a parameter of the script<br><br>
             * @see [registerScriptParameterFieldExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterFieldExitCallback}
             */
            function getScriptParameterFieldExitCallbacks(scriptName: String, fieldName: String): function()[];

        }

        class ExtendedSearchContext {
            /**
             * The ExtendedSearchContext provides access to the Extended Search Dialog
             * and gives access to various GUI functions like get/set field values,
             * change the color of fields, change the focus to a specific field etc.
             */
            constructor();

            /**
             * Returns the DOM element of the entire search form view.
             * @returns the DOM element of the search form view
             */
            getSearchFormViewEl(): Element;

            /**
             * Returns the jQuery object of the entire search form view.
             * @returns the jQuery object of the search form view
             */
            getSearchFormView$El(): JQuery;

            /**
             * Returns the DOM element of a search field's input field by its name.
             * @param fieldName the name of the field
             * @returns the DOM element of the input field
             */
            getSearchFieldEl(fieldName: String): Element;

            /**
             * Returns the jQuery object of a search field's input field by its name.
             * @param fieldName the name of the field
             * @returns the jQuery object of the input field
             */
            getSearchField$El(fieldName: String): JQuery;

            /**
             * Returns the jQuery object of a search field's label by its name.
             * @param fieldName the name of the field
             * @returns the jQuery object of the label
             */
            getSearchFieldLabel$El(fieldName: String): JQuery;

            /**
             * Gets the value of a search field by its name.
             * @param fieldName the search field name
             */
            getSearchFieldValue(fieldName: String): String;

            /**
             * Gets the values for an array of search fields by their names.
             * @param fieldNames the search field names
             */
            getSearchFieldValues(fieldNames: String[]): Object;

            /**
             * Gets the value of a search field as a Number. If the parameters decimalSeparator and
             * groupingSeparator are not set the method will use localized values.
             * @param fieldName - the file field name
             * @param decimalSeparator the decimal separator
             * @param groupingSeparator the grouping separator
             */
            getSearchFieldNumberValue(fieldName: String, decimalSeparator?: String, groupingSeparator?: String): Number;

            /**
             * Sets the value of a search field to the specified value by its name.
             * @param fieldName the search field name
             * @param value the new value of the search field
             */
            setSearchFieldValue(fieldName: String, value: String): String;

            /**
             * Sets the value of multiple search fields to the specified value by its name.
             * @param fieldValues
             */
            setSearchFieldValues(fieldValues: Object): void;

            /**
             * Sets the options for a select menu.
             * @param fieldName the name of the select field
             * @param value the values for the select field
             * @param options keepSelected === true: the previously selected value will be kept even if not inside the value String (default),
             *        false: the previously selected value will be removed except when inside the value String
             */
            setSearchFieldOptions(fieldName: String, value: String | String[] | Object, options: Object): void;

            /**
             * Checks if a search field is currently displayed or not.
             * @param fieldName the name of the field
             */
            isSearchFieldVisible(fieldName: String): Boolean;

            /**
             * Sets the focus to a search field by its name.
             * @param fieldName the name of the field
             */
            setSearchFieldFocus(fieldName: String): void;

            /**
             * Sets the text-color of a search field by its name.
             * @param fieldName the name of the field
             * @param color the new color
             */
            setSearchFieldColor(fieldName: String, color: String): void;

            /**
             * Sets the background-color of a search field by its name.
             * @param fieldName the name of the field
             * @param color the new color
             */
            setSearchFieldBgColor(fieldName: String, color: String): void;

            /**
             * Sets the border-color of a search field by its name.
             * @param fieldName the name of the field
             * @param color the new color
             */
            setSearchFieldBorderColor(fieldName: String, color: String): void;

            /**
             * Sets the text-color of a search field label by its name.
             * @param fieldName the name of the field
             * @param color the new color
             */
            setSearchFieldLabelColor(fieldName: String, color: String): void;

            /**
             * Returns a shallow array of all currently available search source items.
             * Each item contains (at least) the attributes <code>id</code>, <code>name</code>, <code>type</code>, <code>label</code>, <code>selected</code> and <code>opened</code>.
             * @param options
             * @param options.filter a filter
             */
            getSearchSources(options?: getSearchSources_options): void;

            /**
             * Returns a shallow array of all currently selected search source items.
             * Each item contains (at least) the attributes <code>id</code>, <code>name</code>, <code>type</code>, <code>label</code>, <code>selected</code> and <code>opened</code>.
             * @param options
             * @param options.filter a filter
             */
            getSelectedSearchSources(options?: getSelectedSearchSources_options): void;

            /**
             * Returns a shallow array of all currently available search source names.
             * @param options
             * @param options.filter a filter
             */
            getSearchSourceNames(options?: getSearchSourceNames_options): void;

            /**
             * Returns a shallow array of all currently selected search source names.
             * @param options
             * @param options.filter a filter
             */
            getSelectedSearchSourceNames(options?: getSelectedSearchSourceNames_options): void;

            /**
             * Returns the extended search form model.
             * @returns the extended search form model
             */
            getSearchFormModel(): ExtendedSearchFormModel;

        }

        class FileContext {
            /**
             * The FileContext provides general information about a document, the possibility to execute scripts, control the edit mode
             * and gives access to various GUI functions like get/set field values, change the color of fields, change the focus to a
             * specific field etc.
             */
            constructor();

            /**
             * Returns the current value of a file field by its name.
             * If, for any reason, the field is currently not visible, the field value will be retrieved from the file instance on the server. This default fallback behaviour can be disabled by the `serverMode` option.
             * @param fieldName the technical file field name
             * @param options
             * @param options.serverMode if true (default) and the field is currently not visible, gets the field value from the server
             */
            getFileFieldValue(fieldName: String, options?: getFileFieldValue_options): String;

            /**
             * Returns the current value of a file field as a number by its name.
             * If, for any reason, the field is currently not visible, the field value will be retrieved from the file instance on the server. This default fallback behaviour can be disabled by the `serverMode` option.
             * If any of the optional `decimalSeparator` or `groupingSeparator` parameters is not set, this function will automatically use the default value of the current user locale configured in the Documents Manager.
             * @param fieldName the technical file field name
             * @param decimalSeparator the decimal separator character
             * @param groupingSeparator the grouping separator character
             * @param options
             * @param options.serverMode if true (default) and the field is currently not visible, gets the field value from the server
             */
            getFileFieldNumberValue(fieldName: String, decimalSeparator?: String, groupingSeparator?: String, options?: getFileFieldNumberValue_options): Number;

            /**
             * Gets all available options of a select menu or a double list.
             * @param fieldName - the file field name
             */
            getFileFieldOptions(fieldName: String): Object;

            /**
             * Gets the values for an array of file fields by their names.
             * @param fieldNames the file field names
             * @param options
             * @param options.serverMode get the field value from the server if the field is not visible, default true
             */
            getFileFieldValues(fieldNames: String[], options?: getFileFieldValues_options): Object;

            /**
             * Returns the file form model.
             * @returns the file form model
             */
            getFileFormModel(): FileFormModel;

            /**
             * Sets the value of a file field to the specified value by its name.
             * Caution: This function will work correctly only if the current file is already in edit mode.
             * If, for any reason, the field is currently not visible, the field value will be set to the file instance on the server. This default fallback behaviour can be disabled by the `serverMode` option.
             * @param fieldName the technical file field name
             * @param value the new value of the file field, can be an array if used with a multi-value field type
             * @param options
             * @param options.serverMode if true (default) and the field is currently not visible, sets the field value to the server
             */
            setFileFieldValue(fieldName: String, value?: String | String[], options?: setFileFieldValue_options): String;

            /**
             * Sets the value of multiple file fields to the specified value by its name.
             * Caution: This function will work only if the user is already in edit mode.
             * @param fieldValues
             * @param options
             * @param options.serverMode set the field value on the server if the field is not visible, default true
             */
            setFileFieldValues(fieldValues: Object, options?: setFileFieldValues_options): void;

            /**
             * Sets the options for a select menu or the doublelist. This method does not work if the file is not in edit mode.
             * @param fieldName the name of the select/doublelist field
             * @param values the values for the select/doublelist field
             * @param options keepSelected === true: the previously selected value will be kept even if not inside the value String (default),
             *        false: the previously selected value will be removed except when inside the value String
             */
            setFileFieldOptions(fieldName: String, values: String | String[] | Object, options: Object): void;

            /**
             * Sets a file reference.
             * Removing the file reference can be achieved by passing <code>null</code> or <code>""</code> in referenceFileId.
             * @param fieldName the name of the field
             * @param referenceFileId the id of the reference file, <code>null</code> or <code>""</code> to reset
             */
            setFileFieldReference(fieldName: String, referenceFileId: String): void;

            /**
             * Returns if the file is currently in edit mode or not.
             */
            isFileEditMode(): Boolean;

            /**
             * Starts the file edit mode.
             * This function will work only if the user is not already in edit mode.
             */
            startFileEditMode(): void;

            /**
             * Aborts the file edit mode. Any modifications in the file will be discarded.
             * This function will work only if the user is already in edit mode.
             */
            cancelFileEditMode(): void;

            /**
             * Stops the file edit mode. Any modifications in the file will be commited.
             * This function will work only if the user is already in edit mode.
             */
            commitFileEditMode(): void;

            /**
             * Checks if a file field is currently displayed or not.
             * @param fieldName the name of the field
             */
            isFileFieldVisible(fieldName: String): Boolean;

            /**
             * Returns the id of a file field by its name.
             * @param fieldName the name of the field
             */
            getFileFieldId(fieldName: String): String;

            /**
             * Returns the DOM element id of a file field's input field by its name.
             * @param fieldName the name of the field
             */
            getFileFieldElId(fieldName: String): String;

            /**
             * Returns the DOM element of a file field's input field by its name.
             * @param fieldName the name of the field
             * @returns the DOM element of the input field
             */
            getFileFieldEl(fieldName: String): Element;

            /**
             * Returns the jQuery object of a file field's input field by its name.
             * @param fieldName the name of the field
             * @returns the jQuery object of the input field
             */
            getFileField$El(fieldName: String): JQuery;

            /**
             * Returns the jQuery object of a file field's label by its name.
             * @param fieldName the name of the field
             * @returns the jQuery object of the label
             */
            getFileFieldLabel$El(fieldName: String): JQuery;

            /**
             * Sets the text-color of a file field by its name.
             * @param fieldName the name of the field
             * @param color the new color
             */
            setFileFieldColor(fieldName: String, color: String): void;

            /**
             * Sets the background-color of a file field by its name.
             * @param fieldName the name of the field
             * @param color the new color
             */
            setFileFieldBgColor(fieldName: String, color: String): void;

            /**
             * Sets the border-color of a file field by its name.
             * @param fieldName the name of the field
             * @param color the new color
             */
            setFileFieldBorderColor(fieldName: String, color: String): void;

            /**
             * Sets the text-color of a file field label by its name.
             * @param fieldName the name of the field
             * @param color the new color
             */
            setFileFieldLabelColor(fieldName: String, color: String): void;

            /**
             * Sets the focus to a file field by its name.
             * @param fieldName the name of the field
             */
            setFileFieldFocus(fieldName: String): void;

            /**
             * Returns the current vertical scroll position from the top.
             */
            getScrollPositionTop(): Number;

            /**
             * Returns the current horizontal scroll position from the left.
             */
            getScrollPositionLeft(): Number;

            /**
             * Sets the vertical scroll position from the top.
             * @param value the new vertical scroll position
             */
            setScrollPositionTop(value: Number): void;

            /**
             * Sets the horizontal scroll position from the left.
             * @param value the new horizontal scroll position
             */
            setScrollPositionLeft(value: Number): void;

            /**
             * Returns the file property for the given key.
             * @param key the key of the property
             */
            getFileProperty(key: String): String;

            /**
             * Returns the file register property for the given key.
             * @param key the key of the property
             */
            getFileRegisterProperty(key: String): String;

            /**
             * Executes a server-side file script by its name. Any defined script parameters can be transmitted alike.
             * The script can either be called <i>synchronous</i> (default) or <i>asynchronous</i> (via options parameter).
             * If the script result has a defined <code>returnType</code> (defined by context.returnType in the portal script) the
             * function has <strong>no return value</strong> and the output depends on the returnType.
             * With the option <code>dispatch</code> it is possible to always retrieve the script result even if a returnType is defined.
             * options.dispatch must be set to <strong>false</strong> (defaults to true) to use the script result as return value.
             * With <code>option.async = true</code> the function always returns a Promise object. If this option is set it is also
             * possible to input script parameters defined in the Documents Manager via a dialog. Script parameters added via dialog
             * will override duplicate <code>scriptParams</code> keys.
             * @param scriptName - the name of the script
             * @param scriptParams - the input parameters for the script
             * @param options - additional options
             * @param options.dispatch default true, if false scriptResult is returned even if the script has a returnType
             * @param options.async default false, if true the script will be executed asynchronous and will return a promise
             * @param options.useScriptParameterDialog default false, if true a script parameter dialog will always be displayed if the script has defined parameter, only works if options.async = true
             * @param options.dialogTitle the title of the script parameter dialog
             */
            executeScript(scriptName: String, scriptParams?: Object, options?: executeScript_options): Promise | String | undefined;

            /**
             * Returns the id of the current file.
             */
            getFileId(): String;

            /**
             * Returns the id of the current register.
             */
            getRegisterId(): String;

            /**
             * Returns the id of the current document.
             */
            getDocumentId(): String;

            /**
             * Returns the file type name of the current file.
             */
            getFileTypeName(): String;

            /**
             * Returns the type of the current register.
             */
            getRegisterType(): String;

            /**
             * Returns the title of the current file.
             */
            getFileTitle(): String;

            /**
             * Returns the title of the current register.
             */
            getRegisterTitle(): String;

            /**
             * Returns the title of the current document.
             */
            getDocumentTitle(): String;

            /**
             * Returns the current file task.
             */
            getFileTask(): String;

            /**
             * Opens or closes the file registerbar view.
             * @param action {String} action the action that should be performed, permitted values: `open`, `close`
             * @param options
             * @param options.animate {boolean} `true` (default) if the open or close action should be animated, `false` otherwise
             */
            toggleRegisterbarView(action: String, options?: toggleRegisterbarView_options): void;

            /**
             * Opens or closes the file monitor view.
             * @param action {String} action the action that should be performed, permitted values: `open`, `close`
             * @param options
             * @param options.animate {boolean} `true` (default) if the open or close action should be animated, `false` otherwise
             */
            toggleMonitorView(action: String, options?: toggleMonitorView_options): void;

        }

        abstract class FieldModel {
            /**
             * The FieldModel is the abstract model for form fields. It provides various methods to inspect and manipulate the field model data.
             * Every FieldModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
             * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
             */
            constructor();

            /**
             * Returns the id of the field.
             * @returns the field id
             */
            getId(): String;

            /**
             * Returns the technical name of the field.
             * @returns the technical field name
             */
            getName(): String;

            /**
             * Sets the technical name of the field.
             * @param name the technical field name
             */
            setName(name: String): void;

            /**
             * Returns the label of the field.
             * @returns the field label
             */
            getLabel(): String;

            /**
             * Sets the label of the field.
             * @param label the field label
             */
            setLabel(label: String): void;

            /**
             * Returns the type of the field.
             * @returns the field type
             * @see
             */
            getType(): String;

            /**
             * Sets the type of the field.
             * In case of changing a field into a checkbox or a radio-group, the displayed options will be set to a default value. If you want to change them, please use the method {@link documents.sdk.FieldModel#setEnumValues|setEnumValues}.
             * @param type the field type
             * @see
             * @see
             */
            setType(type: FieldModel.Types): void;

            /**
             * Returns if the field is readonly or not.
             * @returns <code>true</code> if the field is readonly, <code>false</code> otherwise
             * @see
             */
            isReadonly(): Boolean;

            /**
             * Sets the field to readonly.
             * @param readonly <code>true</code> for readonly,  <code>false</code> otherwise
             * @see
             */
            setReadonly(readonly: Boolean): void;

            /**
             * Returns if the field is gui readonly or not.
             * @returns <code>true</code> if the field is gui readonly, <code>false</code> otherwise
             * @see
             */
            isGuiReadonly(): Boolean;

            /**
             * Sets the field to gui readonly.
             * @param guiReadonly <code>true</code> for gui readonly,  <code>false</code> otherwise
             * @see
             */
            setGuiReadonly(guiReadonly: Boolean): void;

            /**
             * Returns if the field is mandatory or not.
             * @returns <code>true</code> if the field is mandatory, <code>false</code> otherwise
             */
            isMandatory(): Boolean;

            /**
             * Returns the value(s) of the field.
             * @returns the field value
             * @see
             */
            getValue(): String | String[] | Boolean;

            /**
             * Sets the value(s) of the field.
             * Any matching enum values will be updated automatically.
             * @param value the field value
             * @param options
             * @param options.silent When  <code>true</code> the silent mode is active, no backbone events will be triggered, if the  model changes
             * @see
             */
            setValue(value: String | String[] | Boolean, options?: setValue_options): void;

            /**
             * Returns the optional enum values of the field.
             * @returns the field enum values
             */
            getEnumValues(): Object[];

            /**
             * Sets the optional enum values of the field. Supported input-formats can be viewed in the examples.
             * @param enumValues the field enum values
             * @param options the options passed
             * @param options.keepSelected {Boolean} `true` if the current selected entry should be set as the next selected entry. If it is not included within the enumValues it will be added. Default is `false`.
             * @param options.addEmptyEntry {Boolean} `true` if an empty entry should be added to the enumValues. Default is `false`
             */
            setEnumValues(enumValues: Object | Object[] | String | String[], options?: setEnumValues_options): void;

            /**
             * Returns if the field is in the same line as the preceding field or not.
             * @returns <code>true</code> if the field is in the same line as the preceding field, <code>false</code> otherwise
             */
            isSameLine(): Boolean;

            /**
             * Sets the field to the same line as the preceding field.
             * @param sameLine <code>true</code> for same line as the preceding field,  <code>false</code> otherwise
             */
            setSameLine(sameLine: Boolean): void;

            /**
             * Sets an exit configuration of the field.
             * A trigger type of the exit must always be set. Valid types are <code>focusin</code>, <code>focusout</code>, <code>change</code> and <code>button</code>.
             * If an exit configuration is set, a corresponding field exit callback must be registered in the [exitRegistry]{@link documents.sdk.exitRegistry}.
             * @param options {Object} the exit configuration options
             * @param options.type {String} the exit trigger type
             * @param options.image {String} the exit button image, if the <code>type</code> equals <code>button</code>
             * @param options.tooltip {String} the exit button image tooltip, if the <code>type</code> equals <code>button</code>
             * @see [exitRegistry.registerFileFieldExitCallback]{@link documents.sdk.exitRegistry#registerFileFieldExitCallback}
             * @see [exitRegistry.registerSearchFieldExitCallback]{@link documents.sdk.exitRegistry#registerSearchFieldExitCallback}
             * @see [exitRegistry.registerScriptParameterFieldExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterFieldExitCallback}
             */
            setExit(options?: setExit_options): void;

            /**
             * Adds autocomplete to a field. Only works for STRING fields.
             * @param options {Object} the autocomplete config
             * @param options.scriptName {String} the name of the script
             * @param options.minQueryChars {Number} amount of letters after which autocomplete starts
             * @param options.queryDelay {Number} time interval, after which autocomplete starts
             * @param options.maxResults {Number} max amount of autocomplete entries
             * @param options.autoFocusResult {Boolean} focus on the first autocomplete entry
             */
            setAutoComplete(options?: setAutoComplete_options): void;

            /**
             * Returns the tooltip of the field.
             * @returns the field tooltip
             */
            getTooltip(): String;

            /**
             * Sets the tooltip of the field.
             * @param tooltip the field tooltip
             */
            setTooltip(tooltip: String): void;

            /**
             * Returns the font color of the field.
             * @returns the field font color
             */
            getColor(): String;

            /**
             * Sets the font color of the field.
             * @param color the field font color. All color definitions available in CSS3 are supported as parameters.
             */
            setColor(color: String): void;

            /**
             * Returns the background color of the field.
             * @returns the field background color
             */
            getBgColor(): String;

            /**
             * Sets the background color of the field.
             * @param color the field background color. All color definitions available in CSS3 are supported as parameters.
             */
            setBgColor(color: String): void;

            /**
             * Returns the border color of the field.
             * @returns the field border color
             */
            getBorderColor(): String;

            /**
             * Sets the border color of the field.
             * @param color the field border color. All color definitions available in CSS3 are supported as parameters.
             */
            setBorderColor(color: String): void;

            /**
             * Returns the font color of the fields label.
             * @returns the font color of the fields label
             */
            getLabelColor(): String;

            /**
             * Sets the font color of the fields label.
             * @param color the font color of the fields label. All color definitions available in CSS3 are supported as parameters.
             */
            setLabelColor(color: String): void;


        }

        class FileFieldModel {
            /**
             * The FileFieldModel represents a file field in a file form and provides various methods to inspect and manipulate the field model data.
             * Every FileFieldModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
             * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
             */
            constructor();

            /**
             * Returns the width of a field.
             * @returns the fields width
             */
            getWidth(): String;

            /**
             * Sets the width of a field.
             * @param width the fields width
             */
            setWidth(width: String): void;

            /**
             * Returns the height of a field.
             * @returns the fields height
             */
            getHeight(): String;

            /**
             * Sets the height of a field.
             * @param height the fields height
             */
            setHeight(height: String): void;

            /**
             * Returns the maximum length of a field.
             * @returns the fields maximum length
             */
            getMaxLength(): String;

            /**
             * Sets the maximum length of a field.
             * @param maxLength the fields maximum length
             */
            setMaxLength(maxLength: String): void;

            /**
             * Returns the id of the field.
             * @returns the field id
             */
            getId(): String;

            /**
             * Returns the technical name of the field.
             * @returns the technical field name
             */
            getName(): String;

            /**
             * Sets the technical name of the field.
             * @param name the technical field name
             */
            setName(name: String): void;

            /**
             * Returns the label of the field.
             * @returns the field label
             */
            getLabel(): String;

            /**
             * Sets the label of the field.
             * @param label the field label
             */
            setLabel(label: String): void;

            /**
             * Returns the type of the field.
             * @returns the field type
             * @see
             */
            getType(): String;

            /**
             * Sets the type of the field.
             * In case of changing a field into a checkbox or a radio-group, the displayed options will be set to a default value. If you want to change them, please use the method {@link documents.sdk.FieldModel#setEnumValues|setEnumValues}.
             * @param type the field type
             * @see
             * @see
             */
            setType(type: FieldModel.Types): void;

            /**
             * Returns if the field is readonly or not.
             * @returns <code>true</code> if the field is readonly, <code>false</code> otherwise
             * @see
             */
            isReadonly(): Boolean;

            /**
             * Sets the field to readonly.
             * @param readonly <code>true</code> for readonly,  <code>false</code> otherwise
             * @see
             */
            setReadonly(readonly: Boolean): void;

            /**
             * Returns if the field is gui readonly or not.
             * @returns <code>true</code> if the field is gui readonly, <code>false</code> otherwise
             * @see
             */
            isGuiReadonly(): Boolean;

            /**
             * Sets the field to gui readonly.
             * @param guiReadonly <code>true</code> for gui readonly,  <code>false</code> otherwise
             * @see
             */
            setGuiReadonly(guiReadonly: Boolean): void;

            /**
             * Returns if the field is mandatory or not.
             * @returns <code>true</code> if the field is mandatory, <code>false</code> otherwise
             */
            isMandatory(): Boolean;

            /**
             * Returns the value(s) of the field.
             * @returns the field value
             * @see
             */
            getValue(): String | String[] | Boolean;

            /**
             * Sets the value(s) of the field.
             * Any matching enum values will be updated automatically.
             * @param value the field value
             * @param options
             * @param options.silent When  <code>true</code> the silent mode is active, no backbone events will be triggered, if the  model changes
             * @see
             */
            setValue(value: String | String[] | Boolean, options?: setValue_options): void;

            /**
             * Returns the optional enum values of the field.
             * @returns the field enum values
             */
            getEnumValues(): Object[];

            /**
             * Sets the optional enum values of the field. Supported input-formats can be viewed in the examples.
             * @param enumValues the field enum values
             * @param options the options passed
             * @param options.keepSelected {Boolean} `true` if the current selected entry should be set as the next selected entry. If it is not included within the enumValues it will be added. Default is `false`.
             * @param options.addEmptyEntry {Boolean} `true` if an empty entry should be added to the enumValues. Default is `false`
             */
            setEnumValues(enumValues: Object | Object[] | String | String[], options?: setEnumValues_options): void;

            /**
             * Returns if the field is in the same line as the preceding field or not.
             * @returns <code>true</code> if the field is in the same line as the preceding field, <code>false</code> otherwise
             */
            isSameLine(): Boolean;

            /**
             * Sets the field to the same line as the preceding field.
             * @param sameLine <code>true</code> for same line as the preceding field,  <code>false</code> otherwise
             */
            setSameLine(sameLine: Boolean): void;

            /**
             * Sets an exit configuration of the field.
             * A trigger type of the exit must always be set. Valid types are <code>focusin</code>, <code>focusout</code>, <code>change</code> and <code>button</code>.
             * If an exit configuration is set, a corresponding field exit callback must be registered in the [exitRegistry]{@link documents.sdk.exitRegistry}.
             * @param options {Object} the exit configuration options
             * @param options.type {String} the exit trigger type
             * @param options.image {String} the exit button image, if the <code>type</code> equals <code>button</code>
             * @param options.tooltip {String} the exit button image tooltip, if the <code>type</code> equals <code>button</code>
             * @see [exitRegistry.registerFileFieldExitCallback]{@link documents.sdk.exitRegistry#registerFileFieldExitCallback}
             * @see [exitRegistry.registerSearchFieldExitCallback]{@link documents.sdk.exitRegistry#registerSearchFieldExitCallback}
             * @see [exitRegistry.registerScriptParameterFieldExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterFieldExitCallback}
             */
            setExit(options?: setExit_options): void;

            /**
             * Adds autocomplete to a field. Only works for STRING fields.
             * @param options {Object} the autocomplete config
             * @param options.scriptName {String} the name of the script
             * @param options.minQueryChars {Number} amount of letters after which autocomplete starts
             * @param options.queryDelay {Number} time interval, after which autocomplete starts
             * @param options.maxResults {Number} max amount of autocomplete entries
             * @param options.autoFocusResult {Boolean} focus on the first autocomplete entry
             */
            setAutoComplete(options?: setAutoComplete_options): void;

            /**
             * Returns the tooltip of the field.
             * @returns the field tooltip
             */
            getTooltip(): String;

            /**
             * Sets the tooltip of the field.
             * @param tooltip the field tooltip
             */
            setTooltip(tooltip: String): void;

            /**
             * Returns the font color of the field.
             * @returns the field font color
             */
            getColor(): String;

            /**
             * Sets the font color of the field.
             * @param color the field font color. All color definitions available in CSS3 are supported as parameters.
             */
            setColor(color: String): void;

            /**
             * Returns the background color of the field.
             * @returns the field background color
             */
            getBgColor(): String;

            /**
             * Sets the background color of the field.
             * @param color the field background color. All color definitions available in CSS3 are supported as parameters.
             */
            setBgColor(color: String): void;

            /**
             * Returns the border color of the field.
             * @returns the field border color
             */
            getBorderColor(): String;

            /**
             * Sets the border color of the field.
             * @param color the field border color. All color definitions available in CSS3 are supported as parameters.
             */
            setBorderColor(color: String): void;

            /**
             * Returns the font color of the fields label.
             * @returns the font color of the fields label
             */
            getLabelColor(): String;

            /**
             * Sets the font color of the fields label.
             * @param color the font color of the fields label. All color definitions available in CSS3 are supported as parameters.
             */
            setLabelColor(color: String): void;


        }

        class SearchFieldModel {
            /**
             * The SearchFieldModel represents a search field in a search form and provides various methods to inspect and manipulate the field model data.
             * Every SearchFieldModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
             * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
             */
            constructor();

            /**
             * Returns the id of the field.
             * @returns the field id
             */
            getId(): String;

            /**
             * Returns the technical name of the field.
             * @returns the technical field name
             */
            getName(): String;

            /**
             * Sets the technical name of the field.
             * @param name the technical field name
             */
            setName(name: String): void;

            /**
             * Returns the label of the field.
             * @returns the field label
             */
            getLabel(): String;

            /**
             * Sets the label of the field.
             * @param label the field label
             */
            setLabel(label: String): void;

            /**
             * Returns the type of the field.
             * @returns the field type
             * @see
             */
            getType(): String;

            /**
             * Sets the type of the field.
             * In case of changing a field into a checkbox or a radio-group, the displayed options will be set to a default value. If you want to change them, please use the method {@link documents.sdk.FieldModel#setEnumValues|setEnumValues}.
             * @param type the field type
             * @see
             * @see
             */
            setType(type: FieldModel.Types): void;

            /**
             * Returns if the field is readonly or not.
             * @returns <code>true</code> if the field is readonly, <code>false</code> otherwise
             * @see
             */
            isReadonly(): Boolean;

            /**
             * Sets the field to readonly.
             * @param readonly <code>true</code> for readonly,  <code>false</code> otherwise
             * @see
             */
            setReadonly(readonly: Boolean): void;

            /**
             * Returns if the field is gui readonly or not.
             * @returns <code>true</code> if the field is gui readonly, <code>false</code> otherwise
             * @see
             */
            isGuiReadonly(): Boolean;

            /**
             * Sets the field to gui readonly.
             * @param guiReadonly <code>true</code> for gui readonly,  <code>false</code> otherwise
             * @see
             */
            setGuiReadonly(guiReadonly: Boolean): void;

            /**
             * Returns if the field is mandatory or not.
             * @returns <code>true</code> if the field is mandatory, <code>false</code> otherwise
             */
            isMandatory(): Boolean;

            /**
             * Returns the value(s) of the field.
             * @returns the field value
             * @see
             */
            getValue(): String | String[] | Boolean;

            /**
             * Sets the value(s) of the field.
             * Any matching enum values will be updated automatically.
             * @param value the field value
             * @param options
             * @param options.silent When  <code>true</code> the silent mode is active, no backbone events will be triggered, if the  model changes
             * @see
             */
            setValue(value: String | String[] | Boolean, options?: setValue_options): void;

            /**
             * Returns the optional enum values of the field.
             * @returns the field enum values
             */
            getEnumValues(): Object[];

            /**
             * Sets the optional enum values of the field. Supported input-formats can be viewed in the examples.
             * @param enumValues the field enum values
             * @param options the options passed
             * @param options.keepSelected {Boolean} `true` if the current selected entry should be set as the next selected entry. If it is not included within the enumValues it will be added. Default is `false`.
             * @param options.addEmptyEntry {Boolean} `true` if an empty entry should be added to the enumValues. Default is `false`
             */
            setEnumValues(enumValues: Object | Object[] | String | String[], options?: setEnumValues_options): void;

            /**
             * Returns if the field is in the same line as the preceding field or not.
             * @returns <code>true</code> if the field is in the same line as the preceding field, <code>false</code> otherwise
             */
            isSameLine(): Boolean;

            /**
             * Sets the field to the same line as the preceding field.
             * @param sameLine <code>true</code> for same line as the preceding field,  <code>false</code> otherwise
             */
            setSameLine(sameLine: Boolean): void;

            /**
             * Sets an exit configuration of the field.
             * A trigger type of the exit must always be set. Valid types are <code>focusin</code>, <code>focusout</code>, <code>change</code> and <code>button</code>.
             * If an exit configuration is set, a corresponding field exit callback must be registered in the [exitRegistry]{@link documents.sdk.exitRegistry}.
             * @param options {Object} the exit configuration options
             * @param options.type {String} the exit trigger type
             * @param options.image {String} the exit button image, if the <code>type</code> equals <code>button</code>
             * @param options.tooltip {String} the exit button image tooltip, if the <code>type</code> equals <code>button</code>
             * @see [exitRegistry.registerFileFieldExitCallback]{@link documents.sdk.exitRegistry#registerFileFieldExitCallback}
             * @see [exitRegistry.registerSearchFieldExitCallback]{@link documents.sdk.exitRegistry#registerSearchFieldExitCallback}
             * @see [exitRegistry.registerScriptParameterFieldExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterFieldExitCallback}
             */
            setExit(options?: setExit_options): void;

            /**
             * Adds autocomplete to a field. Only works for STRING fields.
             * @param options {Object} the autocomplete config
             * @param options.scriptName {String} the name of the script
             * @param options.minQueryChars {Number} amount of letters after which autocomplete starts
             * @param options.queryDelay {Number} time interval, after which autocomplete starts
             * @param options.maxResults {Number} max amount of autocomplete entries
             * @param options.autoFocusResult {Boolean} focus on the first autocomplete entry
             */
            setAutoComplete(options?: setAutoComplete_options): void;

            /**
             * Returns the tooltip of the field.
             * @returns the field tooltip
             */
            getTooltip(): String;

            /**
             * Sets the tooltip of the field.
             * @param tooltip the field tooltip
             */
            setTooltip(tooltip: String): void;

            /**
             * Returns the font color of the field.
             * @returns the field font color
             */
            getColor(): String;

            /**
             * Sets the font color of the field.
             * @param color the field font color. All color definitions available in CSS3 are supported as parameters.
             */
            setColor(color: String): void;

            /**
             * Returns the background color of the field.
             * @returns the field background color
             */
            getBgColor(): String;

            /**
             * Sets the background color of the field.
             * @param color the field background color. All color definitions available in CSS3 are supported as parameters.
             */
            setBgColor(color: String): void;

            /**
             * Returns the border color of the field.
             * @returns the field border color
             */
            getBorderColor(): String;

            /**
             * Sets the border color of the field.
             * @param color the field border color. All color definitions available in CSS3 are supported as parameters.
             */
            setBorderColor(color: String): void;

            /**
             * Returns the font color of the fields label.
             * @returns the font color of the fields label
             */
            getLabelColor(): String;

            /**
             * Sets the font color of the fields label.
             * @param color the font color of the fields label. All color definitions available in CSS3 are supported as parameters.
             */
            setLabelColor(color: String): void;


        }

        class ScriptFieldModel {
            /**
             * The ScriptFieldModel represents a script field in a script parameter form and provides various methods to inspect and manipulate the field model data.
             * Every ScriptFieldModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
             * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
             */
            constructor();

            /**
             * Returns the id of the field.
             * @returns the field id
             */
            getId(): String;

            /**
             * Returns the technical name of the field.
             * @returns the technical field name
             */
            getName(): String;

            /**
             * Sets the technical name of the field.
             * @param name the technical field name
             */
            setName(name: String): void;

            /**
             * Returns the label of the field.
             * @returns the field label
             */
            getLabel(): String;

            /**
             * Sets the label of the field.
             * @param label the field label
             */
            setLabel(label: String): void;

            /**
             * Returns the type of the field.
             * @returns the field type
             * @see
             */
            getType(): String;

            /**
             * Sets the type of the field.
             * In case of changing a field into a checkbox or a radio-group, the displayed options will be set to a default value. If you want to change them, please use the method {@link documents.sdk.FieldModel#setEnumValues|setEnumValues}.
             * @param type the field type
             * @see
             * @see
             */
            setType(type: FieldModel.Types): void;

            /**
             * Returns if the field is readonly or not.
             * @returns <code>true</code> if the field is readonly, <code>false</code> otherwise
             * @see
             */
            isReadonly(): Boolean;

            /**
             * Sets the field to readonly.
             * @param readonly <code>true</code> for readonly,  <code>false</code> otherwise
             * @see
             */
            setReadonly(readonly: Boolean): void;

            /**
             * Returns if the field is gui readonly or not.
             * @returns <code>true</code> if the field is gui readonly, <code>false</code> otherwise
             * @see
             */
            isGuiReadonly(): Boolean;

            /**
             * Sets the field to gui readonly.
             * @param guiReadonly <code>true</code> for gui readonly,  <code>false</code> otherwise
             * @see
             */
            setGuiReadonly(guiReadonly: Boolean): void;

            /**
             * Returns if the field is mandatory or not.
             * @returns <code>true</code> if the field is mandatory, <code>false</code> otherwise
             */
            isMandatory(): Boolean;

            /**
             * Returns the value(s) of the field.
             * @returns the field value
             * @see
             */
            getValue(): String | String[] | Boolean;

            /**
             * Sets the value(s) of the field.
             * Any matching enum values will be updated automatically.
             * @param value the field value
             * @param options
             * @param options.silent When  <code>true</code> the silent mode is active, no backbone events will be triggered, if the  model changes
             * @see
             */
            setValue(value: String | String[] | Boolean, options?: setValue_options): void;

            /**
             * Returns the optional enum values of the field.
             * @returns the field enum values
             */
            getEnumValues(): Object[];

            /**
             * Sets the optional enum values of the field. Supported input-formats can be viewed in the examples.
             * @param enumValues the field enum values
             * @param options the options passed
             * @param options.keepSelected {Boolean} `true` if the current selected entry should be set as the next selected entry. If it is not included within the enumValues it will be added. Default is `false`.
             * @param options.addEmptyEntry {Boolean} `true` if an empty entry should be added to the enumValues. Default is `false`
             */
            setEnumValues(enumValues: Object | Object[] | String | String[], options?: setEnumValues_options): void;

            /**
             * Returns if the field is in the same line as the preceding field or not.
             * @returns <code>true</code> if the field is in the same line as the preceding field, <code>false</code> otherwise
             */
            isSameLine(): Boolean;

            /**
             * Sets the field to the same line as the preceding field.
             * @param sameLine <code>true</code> for same line as the preceding field,  <code>false</code> otherwise
             */
            setSameLine(sameLine: Boolean): void;

            /**
             * Sets an exit configuration of the field.
             * A trigger type of the exit must always be set. Valid types are <code>focusin</code>, <code>focusout</code>, <code>change</code> and <code>button</code>.
             * If an exit configuration is set, a corresponding field exit callback must be registered in the [exitRegistry]{@link documents.sdk.exitRegistry}.
             * @param options {Object} the exit configuration options
             * @param options.type {String} the exit trigger type
             * @param options.image {String} the exit button image, if the <code>type</code> equals <code>button</code>
             * @param options.tooltip {String} the exit button image tooltip, if the <code>type</code> equals <code>button</code>
             * @see [exitRegistry.registerFileFieldExitCallback]{@link documents.sdk.exitRegistry#registerFileFieldExitCallback}
             * @see [exitRegistry.registerSearchFieldExitCallback]{@link documents.sdk.exitRegistry#registerSearchFieldExitCallback}
             * @see [exitRegistry.registerScriptParameterFieldExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterFieldExitCallback}
             */
            setExit(options?: setExit_options): void;

            /**
             * Adds autocomplete to a field. Only works for STRING fields.
             * @param options {Object} the autocomplete config
             * @param options.scriptName {String} the name of the script
             * @param options.minQueryChars {Number} amount of letters after which autocomplete starts
             * @param options.queryDelay {Number} time interval, after which autocomplete starts
             * @param options.maxResults {Number} max amount of autocomplete entries
             * @param options.autoFocusResult {Boolean} focus on the first autocomplete entry
             */
            setAutoComplete(options?: setAutoComplete_options): void;

            /**
             * Returns the tooltip of the field.
             * @returns the field tooltip
             */
            getTooltip(): String;

            /**
             * Sets the tooltip of the field.
             * @param tooltip the field tooltip
             */
            setTooltip(tooltip: String): void;

            /**
             * Returns the font color of the field.
             * @returns the field font color
             */
            getColor(): String;

            /**
             * Sets the font color of the field.
             * @param color the field font color. All color definitions available in CSS3 are supported as parameters.
             */
            setColor(color: String): void;

            /**
             * Returns the background color of the field.
             * @returns the field background color
             */
            getBgColor(): String;

            /**
             * Sets the background color of the field.
             * @param color the field background color. All color definitions available in CSS3 are supported as parameters.
             */
            setBgColor(color: String): void;

            /**
             * Returns the border color of the field.
             * @returns the field border color
             */
            getBorderColor(): String;

            /**
             * Sets the border color of the field.
             * @param color the field border color. All color definitions available in CSS3 are supported as parameters.
             */
            setBorderColor(color: String): void;

            /**
             * Returns the font color of the fields label.
             * @returns the font color of the fields label
             */
            getLabelColor(): String;

            /**
             * Sets the font color of the fields label.
             * @param color the font color of the fields label. All color definitions available in CSS3 are supported as parameters.
             */
            setLabelColor(color: String): void;


        }

        abstract class FormModel {
            /**
             * The FormModel is the abstract model for forms. It provides various methods to inspect and manipulate the form model data.
             * It should be used as the base model for models containing collections of fields such as FileFormModel or ExtendedSearchFormModel.
             * The initialize function should be overridden, if you plan to use a different Collection than the [Backbone.Collection]{@link http://backbonejs.org/#Collection}.
             * 
             * Every FormModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
             * It contains a Collection of {@link FieldModel|FieldModels} representing the fields.
             * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
             * @see
             */
            constructor();

            /**
             * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all field models containing this form model.
             * @returns [Backbone.Collection]{@link http://backbonejs.org/#Collection} the collection of all field models
             * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
             */
            getFields(): any;

            /**
             * Searches for and returns a field model by its id.
             * @param id the id of the field model to be searched for
             * @returns the field model if it could be found, <code>null</code> otherwise
             */
            getFieldById(id: String): FieldModel;

            /**
             * Searches for and returns an array of all field models by its ids.
             * @param ids the array of all field model ids to be searched for
             * @returns the array of all fields models that could be found
             */
            getFieldsById(ids: String[]): FieldModel[];

            /**
             * Searches for and returns a field model by its name.
             * @param name the name of the field model to be searched for
             * @returns the field model if it could be found, <code>null</code> otherwise
             */
            getFieldByName(name: String): FieldModel;

            /**
             * Searches for and returns an array of all field models by its names.
             * @param names the array of all field model names to be searched for
             * @returns the array of all fields models that could be found
             */
            getFieldsByName(names: String[]): FieldModel[];

            /**
             * Sets the values of multiple fields. A key of the parameter-object defines the field-id and the corresponding value the new value.
             * @param object the objects keys is defines the fields and the values define the values.
             */
            setFieldValuesById(object: Object): void;

            /**
             * Sets the values of multiple fields. A key of the parameter-object defines the field-name and the corresponding value the new value.
             * @param object the objects keys is defines the fields and the values define the values.
             */
            setFieldValuesByName(object: Object): void;

        }

        class FileFormModel {
            /**
             * The FileFormModel is the representing model for file forms. It provides various methods to inspect and manipulate the form model data.
             * Every FileFormModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
             * It contains a collection of {@link FileFieldModel|FileFieldModels} representing the form fields.
             * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
             * @see
             */
            constructor();

            /**
             * Returns the id of the representing file.
             * @returns the id of the representing file
             */
            getFileId(): String;

            /**
             * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all field models containing this form model.
             * @returns [Backbone.Collection]{@link http://backbonejs.org/#Collection} the collection of all field models
             * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
             */
            getFields(): any;

            /**
             * Searches for and returns a field model by its id.
             * @param id the id of the field model to be searched for
             * @returns the field model if it could be found, <code>null</code> otherwise
             */
            getFieldById(id: String): FieldModel;

            /**
             * Searches for and returns an array of all field models by its ids.
             * @param ids the array of all field model ids to be searched for
             * @returns the array of all fields models that could be found
             */
            getFieldsById(ids: String[]): FieldModel[];

            /**
             * Searches for and returns a field model by its name.
             * @param name the name of the field model to be searched for
             * @returns the field model if it could be found, <code>null</code> otherwise
             */
            getFieldByName(name: String): FieldModel;

            /**
             * Searches for and returns an array of all field models by its names.
             * @param names the array of all field model names to be searched for
             * @returns the array of all fields models that could be found
             */
            getFieldsByName(names: String[]): FieldModel[];

            /**
             * Sets the values of multiple fields. A key of the parameter-object defines the field-id and the corresponding value the new value.
             * @param object the objects keys is defines the fields and the values define the values.
             */
            setFieldValuesById(object: Object): void;

            /**
             * Sets the values of multiple fields. A key of the parameter-object defines the field-name and the corresponding value the new value.
             * @param object the objects keys is defines the fields and the values define the values.
             */
            setFieldValuesByName(object: Object): void;

        }

        class ExtendedSearchFormModel {
            /**
             * The ExtendedSearchFormModel is the representing model for extended search forms. It provides various methods to inspect and manipulate the form model data.
             * Every ExtendedSearchFormModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
             * It contains a collection of {@link SearchFieldModel|SearchFieldModels} representing the form fields.
             * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
             * @see
             */
            constructor();

            /**
             * Returns the [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all search-fields within this model.
             * @returns the collection of fields
             */
            getSearchFields(): Backbone.Collection;

            /**
             * Returns the search-field with matching the id.
             * @param id the id of the search-field to be searched
             * @returns the first matching search-field
             */
            getSearchFieldById(id: String): SearchFieldModel;

            /**
             * <Returns an Array of all fields within an extended search filtered by the field-id.
             * @param ids an Array of ids of the search-fields to be searched
             * @returns an Array of matching search-fields
             */
            getSearchFieldsById(ids: String[]): SearchFieldModel[];

            /**
             * Returns the search-field with matching the name.
             * @param name the name of the search-field to be searched
             * @returns the first matching search-field
             */
            getSearchFieldByName(name: String): SearchFieldModel;

            /**
             * Returns an Array of all search-fields within a file filtered by the field-names.
             * @param names an Array of names of the search-fields to be searched
             * @returns an Array of matching search-fields
             */
            getSearchFieldsByName(names: String[]): SearchFieldModel[];

            /**
             * getExtendedSearchId return the id of the representing extended search
             * @returns id
             */
            getExtendedSearchId(): String;

            /**
             * Returns the [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all sort-fields within this model.
             * @returns the collection of fields
             */
            getSortFields(): Backbone.Collection;

            /**
             * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all field models containing this form model.
             * @returns [Backbone.Collection]{@link http://backbonejs.org/#Collection} the collection of all field models
             * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
             */
            getFields(): any;

            /**
             * Searches for and returns a field model by its id.
             * @param id the id of the field model to be searched for
             * @returns the field model if it could be found, <code>null</code> otherwise
             */
            getFieldById(id: String): FieldModel;

            /**
             * Searches for and returns an array of all field models by its ids.
             * @param ids the array of all field model ids to be searched for
             * @returns the array of all fields models that could be found
             */
            getFieldsById(ids: String[]): FieldModel[];

            /**
             * Searches for and returns a field model by its name.
             * @param name the name of the field model to be searched for
             * @returns the field model if it could be found, <code>null</code> otherwise
             */
            getFieldByName(name: String): FieldModel;

            /**
             * Searches for and returns an array of all field models by its names.
             * @param names the array of all field model names to be searched for
             * @returns the array of all fields models that could be found
             */
            getFieldsByName(names: String[]): FieldModel[];

            /**
             * Sets the values of multiple fields. A key of the parameter-object defines the field-id and the corresponding value the new value.
             * @param object the objects keys is defines the fields and the values define the values.
             */
            setFieldValuesById(object: Object): void;

            /**
             * Sets the values of multiple fields. A key of the parameter-object defines the field-name and the corresponding value the new value.
             * @param object the objects keys is defines the fields and the values define the values.
             */
            setFieldValuesByName(object: Object): void;

        }

        class ScriptParameterFormModel {
            /**
             * The ScriptParameterFormModel is the representing model for script parameter forms. It provides various methods to inspect and manipulate the form model data.
             * Every ScriptParameterFormModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
             * It contains a collection of {@link ScriptFieldModel|ScriptFieldModels} representing the form fields.
             * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
             * @see
             */
            constructor();

            /**
             * Returns the name of the associated script.
             * @returns the name of the associated script
             */
            getScriptName(): String;

            /**
             * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all field models containing this form model.
             * @returns [Backbone.Collection]{@link http://backbonejs.org/#Collection} the collection of all field models
             * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
             */
            getFields(): any;

            /**
             * Searches for and returns a field model by its id.
             * @param id the id of the field model to be searched for
             * @returns the field model if it could be found, <code>null</code> otherwise
             */
            getFieldById(id: String): FieldModel;

            /**
             * Searches for and returns an array of all field models by its ids.
             * @param ids the array of all field model ids to be searched for
             * @returns the array of all fields models that could be found
             */
            getFieldsById(ids: String[]): FieldModel[];

            /**
             * Searches for and returns a field model by its name.
             * @param name the name of the field model to be searched for
             * @returns the field model if it could be found, <code>null</code> otherwise
             */
            getFieldByName(name: String): FieldModel;

            /**
             * Searches for and returns an array of all field models by its names.
             * @param names the array of all field model names to be searched for
             * @returns the array of all fields models that could be found
             */
            getFieldsByName(names: String[]): FieldModel[];

            /**
             * Sets the values of multiple fields. A key of the parameter-object defines the field-id and the corresponding value the new value.
             * @param object the objects keys is defines the fields and the values define the values.
             */
            setFieldValuesById(object: Object): void;

            /**
             * Sets the values of multiple fields. A key of the parameter-object defines the field-name and the corresponding value the new value.
             * @param object the objects keys is defines the fields and the values define the values.
             */
            setFieldValuesByName(object: Object): void;

        }

        class GadgetContext {
            /**
             * The GadgetContext provides gadget related functions for the client side scripting
             */
            constructor();

            /**
             * Get the contextData added in the gadget portal script with the function `setContextData`
             */
            getContextData(): any;

            /**
             * Returns the gadget client object **if available**.
             * Currently the following Gadgets have a client object:
             * * **FullCalendar**: `FullCalendar-Object` (jQuery element) is returned
             * * **Chart**: The `Chart.js-Object` is returned,
             * * **Form**: {@link GadgetForm} is returned,
             */
            getClientObject(): Object;

        }

        namespace gadget {
            class GadgetForm {
                /**
                 * The gadget client object for gadget forms.
                 * Provides gadget form related functions for the client side scripting
                 */
                constructor();

                /**
                 * Creates a ValidationResult object to be returned by a custom
                 * form validator
                 * @param result if the validation has failed or succeeded
                 * @param errorMessage displayed if the validation failed
                 * @param options option object to add additional information
                 * @returns object containing result of the validation
                 */
                createFormValidatorResult(result: boolean, errorMessage?: String, options?: object): validationResult;

                /**
                 * Validate form based on default and custom set validators
                 * @returns true if the form is valid and false if the form is invalid
                 */
                validateForm(): any;

                /**
                 * Returns the current data for every element of the form
                 */
                getFormData(): Object;

            }

        }

        class GentableContext {
            /**
             * The GentableContext provides full access to the {@link GentableGridModel GentableGridModel},
             * {@link documents.sdk.gentable.grid.GentableGridColumnModel GentableGridColumnModel} and the
             * {@link documents.sdk.gentable.grid.GentableGridRowModel GentableGridRowModel}. It also provides basic functions like
             * copyRow, moveRow and resetSelection.
             */
            constructor();

            /**
             * Returns a jQuery reference to a div that is rendered above the gentable toolbar that can be filled with custom html.
             * @returns Container that can be modified
             */
            getCustomContainerNorth(): JQuery;

            /**
             * Returns a jQuery reference to a div that is rendered between the gentable toolbar and the gentable that can be filled with custom html.
             * @returns Container that can be modified
             */
            getCustomContainerCenter(): JQuery;

            /**
             * Returns a jQuery reference to a div that is rendered beneath the gentable that can be filled with custom html.
             * @returns Container that can be modified
             */
            getCustomContainerSouth(): JQuery;

            /**
             * Returns a gentable grid model.
             * @returns A gentable grid model
             */
            getGridModel(): GentableGridModel;

        }

        namespace gentableRegistry {
            /**
             * Returns a register definition.
             * @param tableDefName the gentable definition name(s) specified in the gentable xml configuration file by <code>&lt;table_def name=""&gt;</code>, each separated by <code>,</code> or <code>*</code> for any definition name <br><strong>Caution:</strong> This parameter is <strong>not</strong> a file type or archive type name!
             */
            function getDefinition(tableDefName: String): String;

            /**
             * Registers a callback function that can be attached to a gentable related exit event.
             * @param tableDefName the gentable definition name(s) specified in the gentable xml configuration file by <code>&lt;table_def name=""&gt;</code>, each separated by <code>,</code> or <code>*</code> for any definition name <br><strong>Caution:</strong> This parameter is <strong>not</strong> a file type or archive type name!
             * @param event the name of the event referenced as <code>&lt;function&gt;</code> or <code>&lt;event&gt;</code> in the xml configuration file or one of the valid identifiers listed below<br><br>
             *        <code>Gentable.beforeRender</code><br>
             *        <code>Gentable.afterRender</code><br>
             *        <code>Gentable.beforeStore</code> (optionally cancels the gentable store and file edit commit action if callback `fn` returns `false`)<br>
             *        <code>Gentable.afterStore</code><br>
             *        <code>Gentable.afterRowSelect</code><br>
             *        <code>Gentable.cellFormatter</code><br>
             *        <code>Gentable.rowStyle</code><br>
             *        <code>Gentable.comparators</code><br>
             * @param fn the function (or callback) that will be called if the exit event occurs<br>Notice: Any callback will be executed according to the function signature listed below.
             * @see [getCallback]{@link documents.sdk.gentable.gentableRegistry#getCallback}
             * @see [DocumentsContext]{@link DocumentsContext}
             * @see [GentableContext]{@link GentableContext}
             */
            function registerCallback(tableDefName: String, event: String, fn: gentableCallback): void;

            /**
             * Returns a callback function that is registered to a gentable related exit event.
             * @param tableDefName the gentable definition name(s) specified in the gentable xml configuration file by <code>&lt;table_def name=""&gt;</code>, each separated by <code>,</code> or <code>*</code> for any definition name <br><strong>Caution:</strong> This parameter is <strong>not</strong> a file type or archive type name!
             * @param event the name of the event
             * @see [registerCallback]{@link documents.sdk.gentable.gentableRegistry#registerCallback}
             */
            function getCallback(tableDefName: String, event: String): Function;

            /**
             * Registers a column aggregator.
             * @param tableDefName the gentable definition name(s) specified in the gentable xml configuration file by <code>&lt;table_def name=""&gt;</code>, each separated by <code>,</code> or <code>*</code> for any definition name <br><strong>Caution:</strong> This parameter is <strong>not</strong> a file type or archive type name!
             * @param title title in the gentable field definition
             * @param columnAggregator Function returning a doby-grid column aggregator
             */
            function registerGridColumnAggregator(tableDefName: String, title: String, columnAggregator: Function): void;

            /**
             * Returns the column aggregator for the give column.
             * @param tableDefName the gentable definition name(s) specified in the gentable xml configuration file by <code>&lt;table_def name=""&gt;</code>, each separated by <code>,</code> or <code>*</code> for any definition name <br><strong>Caution:</strong> This parameter is <strong>not</strong> a file type or archive type name!
             * @param title title in the gentable field definition
             */
            function getGridColumnAggregator(tableDefName: String, title: String): Function;

            /**
             * Registers a grid cell renderer.
             * @param tableDefName the gentable definition name(s) specified in the gentable xml configuration file by <code>&lt;table_def name=""&gt;</code>, each separated by <code>,</code> or <code>*</code> for any definition name <br><strong>Caution:</strong> This parameter is <strong>not</strong> a file type or archive type name!
             * @param type
             * @param cellRenderer Function returning a html string
             */
            function registerGridCellRenderer(tableDefName: String, type: String, cellRenderer: Function): void;

            /**
             * Returns the cell renderer with the given type.
             * @param tableDefName the gentable definition name(s) specified in the gentable xml configuration file by <code>&lt;table_def name=""&gt;</code>, each separated by <code>,</code> or <code>*</code> for any definition name <br><strong>Caution:</strong> This parameter is <strong>not</strong> a file type or archive type name!
             * @param type type in the gentable field definition
             */
            function getGridCellRenderer(tableDefName: String, type: String): Function;

            /**
             * Registers a grid cell editor.
             * @param tableDefName the gentable definition name(s) specified in the gentable xml configuration file by <code>&lt;table_def name=""&gt;</code>, each separated by <code>,</code> or <code>*</code> for any definition name <br><strong>Caution:</strong> This parameter is <strong>not</strong> a file type or archive type name!
             * @param type
             * @param cellEditor doby-grid editor constructor
             */
            function registerGridCellEditor(tableDefName: String, type: String, cellEditor: Function): void;

            /**
             * Returns the cell editor with the given type.
             * @param tableDefName the gentable definition name(s) specified in the gentable xml configuration file by <code>&lt;table_def name=""&gt;</code>, each separated by <code>,</code> or <code>*</code> for any definition name <br><strong>Caution:</strong> This parameter is <strong>not</strong> a file type or archive type name!
             * @param type Type in the gentable field definition
             */
            function getGridCellEditor(tableDefName: String, type: String): Function;

        }

        class I18nContext {
            constructor();

            /**
             * Returns a <code>Messages</code> object providing methods to work with values from a common key/value paired messages/properties file.
             * This method tries to find a messages file with the locale currently selected by the logged in user at first. If no such file was found, a file without any specified locale is searched for.
             * @param propertiesFile the name of the messages file, leaving out the <code>_&lt;lang&gt;</code> postfix
             * @returns the <code>Messages</code> object holding all the messages
             * @see Messages
             */
            getMessages(propertiesFile: String): Messages;

        }

        class UserContext {
            /**
             * The UserContext provides access to information related to the current system user like the used language, login name,
             * accessProfiles and custom properties.
             */
            constructor();

            /**
             * Returns a system user property by its key.
             * User properties can be used to define arbitrary, user related application settings. They are <i>read-only</i> by default. The data type has to be <code>String</code>, e.g. JSON, XML or plain text data.
             * <br>In DOCUMENTS Manager, any user property can be found at the <i>upper</i> properties tab of the user account settings dialog.
             * <br>Notice that this function performs a request against the application server which is called <i>synchronous</i> by default. Thus the JavaScript- and UI thread of the browser will be blocked until the server response has returned.
             * @param key the key of the property
             */
            getProperty(key: String): String;

            /**
             * Returns a custom user property value by its name and type.
             * Custom user properties can be used to persist (i.e. load and store) arbitrary, user related application data across user sessions. The data type has to be <code>String</code>, e.g. JSON, XML or plain text data.
             * <br>In DOCUMENTS Manager, any custom user property can be found at the <i>lower</i> properties tab of the user account settings dialog.
             * <br>Notice that this function performs a request against the application server which is called <i>synchronous</i> by default. Thus the JavaScript- and UI thread of the browser will be blocked until the server response has returned.
             * @param name the name of the property
             * @param type the type of the property
             * @see [setCustomPropertyValue]{@link UserContext#setCustomPropertyValue}
             * @see [removeCustomProperty]{@link UserContext#removeCustomProperty}
             */
            getCustomPropertyValue(name: String, type: String): String;

            /**
             * Sets a custom user property value by its name and type.
             * Custom user properties can be used to persist (i.e. load and store) arbitrary, user related application data across user sessions. The data type has to be <code>String</code>, e.g. JSON, XML or plain text data.
             * <br>In DOCUMENTS Manager, any custom user property can be found at the <i>lower</i> properties tab of the user account settings dialog.
             * <br>Notice that this function performs a request against the application server which is called <i>synchronous</i> by default. Thus the JavaScript- and UI thread of the browser will be blocked until the server response has returned.
             * @param name the name of the property
             * @param type the type of the property
             * @param value the new value of the property
             * @see [getCustomPropertyValue]{@link UserContext#getCustomPropertyValue}
             * @see [removeCustomProperty]{@link UserContext#removeCustomProperty}
             */
            setCustomPropertyValue(name: String, type: String, value: String): String;

            /**
             * Removes a custom user property by its name and type and returns its previous value.
             * Custom user properties can be used to persist (i.e. load and store) arbitrary, user related application data across user sessions. The data type has to be <code>String</code>, e.g. JSON, XML or plain text data.
             * <br>In DOCUMENTS Manager, any custom user property can be found at the <i>lower</i> properties tab of the user account settings dialog.
             * <br>Notice that this function performs a request against the application server which is called <i>synchronous</i> by default. Thus the JavaScript- and UI thread of the browser will be blocked until the server response has returned.
             * @param name the name of the property
             * @param type the type of the property
             * @see [getCustomPropertyValue]{@link UserContext#getCustomPropertyValue}
             * @see [setCustomPropertyValue]{@link UserContext#setCustomPropertyValue}
             */
            removeCustomProperty(name: String, type: String): String;

        }

        namespace utils {
            /**
             * Parses a number string and returns it as number.
             * If any of the optional `decimalSeparator` or `groupingSeparator` parameters is not set, this function will automatically use the default value of the current user locale configured in the Documents Manager.
             * @param value the number string value to be parsed
             * @param decimalSeparator the decimal separator character
             * @param groupingSeparator the grouping separator character
             */
            function parseNumber(value: String, decimalSeparator?: String, groupingSeparator?: String): Number;

            /**
             * Formats a number and returns it as string.
             * If any of the optional `decimalSeparator`, `groupingSeparator` or `decimalPrecision` parameters is not set, this function will use the default value of the current user locale configured in the Documents Manager.
             * @param value the number value to be formatted
             * @param decimalSeparator_or_options the decimal separator character that should be used or an object that contains any of the `decimalSeparator`, `groupingSeparator` or `decimalPrecision` options
             * @param groupingSeparator the grouping separator character
             * @param decimalPrecision the decimal precision, if set to -1, it is left untouched
             */
            function formatNumber(value: Number, decimalSeparator_or_options?: String | Object, groupingSeparator?: String, decimalPrecision?: Number): String;

        }

        abstract class Storage {
            constructor();

            /**
             * Returns the current storage options.
             */
            getOptions(): Object;

            /**
             * Sets the current storage options.
             * @param newOptions the storage options
             * @param newOptions.autoSave <code>true</code> if the autoSave mode is switched on, <code>false</code> otherwise
             */
            setOptions(newOptions: setOptions_newOptions): void;

            /**
             * Puts a new item or replaces an old item into the storage.
             * Alternatively puts multiple items into the storage at once (see example below).
             * @param key the key of the item
             * @param value the value of the item
             */
            set(key: String, value: Object): void;

            /**
             * Returns an item value of the storage by its key.
             * @param key the key of the item
             */
            get(key: String): Boolean | Number | string | object | any;

            /**
             * Deletes an item of the storage by its key.
             * @param key the key of the item
             */
            remove(key: String): void;

            /**
             * Removes all items of the storage at once.
             */
            clear(): void;

            /**
             * Returns whether or not an item exits in the storage by its key.
             * @param key the key of the item
             */
            contains(key: String): Boolean;

            /**
             * Returns a (shallow) copy of the entire storage for JSON serialization.
             * For example this method can be used for persistence, serialization or augmentation before being sent to the server.
             */
            toJSON(): Object;

            /**
             * Returns all the keys of the storage.
             */
            keys(): string[];

            /**
             * Loads and deserializes the storage from the underlying HTML5 WebStorage area.
             */
            load(): void;

            /**
             * Serializes and saves the storage to the underlying HTML5 WebStorage area.
             */
            save(): void;

            /**
             * Erases the underlying HTML5 WebStorage area.
             */
            erase(): void;

        }

        class SessionStorage {
            /**
             * The SessionStorage is a HTML5 WebStorage based storage area that has the ability to store user-defined key/value paired items.
             * The storage remains available for the duration of a user session until logout, including any page reloads.
             * Opening a new browser tab or window will cause a new storage to be initiated.
             * While the item keys always have to be of type <code>String</code>, the item values are allowed to be of type <code>Boolean</code>, <code>Number</code>, <code>String</code>, <code>Object</code> (literal) or <code>Array</code> (literal).
             * @see [LocalStorage]{@link LocalStorage}
             */
            constructor();

            /**
             * Puts a new item or replaces an old item into the storage.
             * Alternatively puts multiple items into the storage at once (see example below).
             * @param key the key of the item
             * @param value the value of the item
             */
            set(key: String, value: Object): void;

            /**
             * Returns an item value of the storage by its key.
             * @param key the key of the item
             */
            get(key: String): Boolean | Number | string | object | any;

            /**
             * Deletes an item of the storage by its key.
             * @param key the key of the item
             */
            remove(key: String): void;

            /**
             * Removes all items of the storage at once.
             */
            clear(): void;

            /**
             * Returns whether or not an item exits in the storage by its key.
             * @param key the key of the item
             */
            contains(key: String): Boolean;

            /**
             * Returns a (shallow) copy of the entire storage for JSON serialization.
             * For example this method can be used for persistence, serialization or augmentation before being sent to the server.
             */
            toJSON(): Object;

            /**
             * Returns all the keys of the storage.
             */
            keys(): string[];

            /**
             * Loads and deserializes the storage from the underlying HTML5 WebStorage area.
             */
            load(): void;

            /**
             * Serializes and saves the storage to the underlying HTML5 WebStorage area.
             */
            save(): void;

            /**
             * Erases the underlying HTML5 WebStorage area.
             */
            erase(): void;

        }

        class LocalStorage {
            /**
             * The LocalStorage is a HTML5 WebStorage based storage area that has the ability to store user-defined key/value paired items.
             * The storage remains available after the duration of a user session and even when the browser is closed and reopened.
             * While the item keys always have to be of type <code>String</code>, the item values are allowed to be of type <code>Boolean</code>, <code>Number</code>, <code>String</code>, <code>Object</code> (literal) or <code>Array</code> (literal).
             * @see [SessionStorage]{@link SessionStorage}
             */
            constructor();

            /**
             * Puts a new item or replaces an old item into the storage.
             * Alternatively puts multiple items into the storage at once (see example below).
             * @param key the key of the item
             * @param value the value of the item
             */
            set(key: String, value: Object): void;

            /**
             * Returns an item value of the storage by its key.
             * @param key the key of the item
             */
            get(key: String): Boolean | Number | string | object | any;

            /**
             * Deletes an item of the storage by its key.
             * @param key the key of the item
             */
            remove(key: String): void;

            /**
             * Removes all items of the storage at once.
             */
            clear(): void;

            /**
             * Returns whether or not an item exits in the storage by its key.
             * @param key the key of the item
             */
            contains(key: String): Boolean;

            /**
             * Returns a (shallow) copy of the entire storage for JSON serialization.
             * For example this method can be used for persistence, serialization or augmentation before being sent to the server.
             */
            toJSON(): Object;

            /**
             * Returns all the keys of the storage.
             */
            keys(): string[];

            /**
             * Loads and deserializes the storage from the underlying HTML5 WebStorage area.
             */
            load(): void;

            /**
             * Serializes and saves the storage to the underlying HTML5 WebStorage area.
             */
            save(): void;

            /**
             * Erases the underlying HTML5 WebStorage area.
             */
            erase(): void;

        }

        namespace gentable {
            namespace grid {
                class GentableGridColumnModel {
                    constructor();

                    /**
                     * Returns the key of the current column.
                     */
                    getName(): String;

                    /**
                     * Returns the localized label of the current column.
                     */
                    getLabel(): String;

                    /**
                     * Returns the data type of the current column.
                     */
                    getDataType(): String;

                    /**
                     * Returns the button label of the current column.
                     */
                    getButtonLabel(): String;

                    /**
                     * Returns the number format of the current column.
                     */
                    getNumberFormat(): String;

                    /**
                     * Returns the tooltip of the current column.
                     */
                    getTooltip(): String;

                    /**
                     * Returns the number of decimal places of the current column.
                     */
                    getDecimalPlaces(): Number;

                    /**
                     * Checks if the current column is focusable.
                     */
                    isFocusable(): Boolean;

                    /**
                     * Checks if the current column is editable.
                     */
                    isEditable(): Boolean;

                    /**
                     * Checks if the current column is visible.
                     */
                    isVisible(): Boolean;

                }

                class GentableGridRowModel {
                    constructor();

                    /**
                     * Returns a (shallow) copy of the entire row for JSON serialization.
                     * For example this method can be used for persistence, serialization or augmentation before being sent to the server.
                     */
                    toJSON(): Object;

                    /**
                     * Reloads the current row and returns a <code>Promise</code> for the reload process to be completed.
                     * Notice that reloading a row implies an full AJAX request/response to/from the server behind the scenes which is always performed <i>asynchronously</i>.
                     * As a result, any code following a <code>reload()</code> statement will be executed <i>immediately</i> while not waiting the reload process to be completed.
                     * Code can be synchronized with the returned <code>Promise</code> object which lets you provide a callback function that is called when the <code>Promise</code> is fulfilled.
                     */
                    reload(): Promise;

                    /**
                     * Returns the current index of the row.
                     */
                    index(): Number;

                    /**
                     * Returns if the row is visible or not.
                     */
                    isVisible(): Boolean;

                    /**
                     * Returns the value of the given column as a <code>number</code>.
                     * If the optional parameters <code>decimalSeparator</code> and <code>groupingSeparator</code> are not set, this method will use localized values by default.
                     * @param columnName the name of the column
                     * @param decimalSeparator the decimal separator
                     * @param groupingSeparator the grouping separator
                     */
                    getNumber(columnName: String, decimalSeparator?: String, groupingSeparator?: String): Number;

                }

                class GentableGridColumnCollection {
                    constructor();

                }

                class GentableGridRowCollection {
                    constructor();

                }

                class GentableGridModel {
                    constructor();

                    /**
                     * Returns a backbone collection of all currently selected grid row models.
                     * @see [setSelectedRows]{@link GentableGridModel#setSelectedRows}
                     * @see [resetSelectedRows]{@link GentableGridModel#resetSelectedRows}
                     * @see http://backbonejs.org/#Collection
                     */
                    getSelectedRows(): GentableGridRowCollection;

                    /**
                     * Sets the selected grid rows by their row indexes.
                     * @param indexes {Number[]} all row indexes to be selected
                     * @see [getSelectedRows]{@link GentableGridModel#getSelectedRows}
                     * @see [resetSelectedRows]{@link GentableGridModel#resetSelectedRows}
                     */
                    setSelectedRows(indexes: Number[]): void;

                    /**
                     * Removes the selected state of all grid rows. After calling this method, none of the grid rows is selected anymore.
                     * @see [getSelectedRows]{@link GentableGridModel#getSelectedRows}
                     * @see [setSelectedRows]{@link GentableGridModel#setSelectedRows}
                     */
                    resetSelectedRows(): void;

                    /**
                     * Sets the active grid row by its row index.
                     * @param index the row index to be activated
                     * @see [getActiveRow]{@link GentableGridModel#getActiveRow}
                     * @see [resetActiveRow]{@link GentableGridModel#resetActiveRow}
                     */
                    setActiveRow(index: Number): void;

                    /**
                     * Returns the currently active grid row model.
                     * @see [setActiveRow]{@link GentableGridModel#setActiveRow}
                     * @see [resetActiveRow]{@link GentableGridModel#resetActiveRow}
                     */
                    getActiveRow(): GentableGridRowModel;

                    /**
                     * Removes the active state of all grid rows. After calling this method, none of the grid rows is activated anymore.
                     * @see [getActiveRow]{@link GentableGridModel#getActiveRow}
                     * @see [setActiveRow]{@link GentableGridModel#setActiveRow}
                     */
                    resetActiveRow(): void;

                    /**
                     * Returns the column with the given name.
                     * @returns the column with the given name
                     * @param name
                     */
                    getColumn(name: String): GentableGridColumnModel;

                    /**
                     * Returns the row at the given index.
                     * @param index
                     */
                    getRow(index: Number): GentableGridRowModel;

                    /**
                     * Adds the given row.
                     * @param row values of the row that should be added
                     * @param options
                     * @param options.index the index where the row should be added
                     * @returns
                     */
                    addRow(row?: Object, options?: addRow_options): GentableGridRowModel;

                    /**
                     * Removes the row at the given index.
                     * @param index
                     */
                    removeRow(index: Number): void;

                    /**
                     * Creates a key for the current row.
                     */
                    createRowKey(): String;

                    /**
                     * Copies the row from the srcIndex to the dstIndex.
                     * @param srcIndex The index of the row that should be copied.
                     * @param dstIndex The index where the row should be copied to.
                     */
                    copyRow(srcIndex: Number, dstIndex: Number): void;

                    /**
                     * Moves a row from the srcIndex to the dstIndex.
                     * @param srcIndex The index of the row that should be moved.
                     * @param dstIndex The index where the row should be moved to.
                     */
                    moveRow(srcIndex: Number, dstIndex: Number): void;

                    /**
                     * Returns the number of all grid columns.
                     */
                    columnsSize(): Number;

                    /**
                     * Returns the number of all grid rows.
                     */
                    rowsSize(): Number;

                    /**
                     * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all grid row models.
                     * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
                     */
                    getRows(): any;

                    /**
                     * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all grid column models.
                     * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
                     */
                    getColumns(): any;

                }

            }

        }

        namespace grid {
            class GridColumnModel {
                constructor();

            }

            class GridRowModel {
                constructor();

            }

            class GridCollection {
                constructor();

            }

            class GridColumnCollection {
                constructor();

            }

            class GridRowCollection {
                constructor();

            }

            class GridModel {
                constructor();

                /**
                 * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all grid row models.
                 * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
                 */
                getRows(): any;

                /**
                 * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all grid column models.
                 * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
                 */
                getColumns(): any;

            }

        }

    }

}

declare class DocumentsContext {
    /**
     * The universal interface for user-exits, gentable and gadgets. It includes opening of dialogs and navigation
     * to folders, files, the extended search other etc. Additional interfaces are available via the
     * {@link UserContext},
     * {@link FileContext},
     * {@link GadgetContext} and the
     * {@link GentableContext}.
     */
    constructor();

    /**
     * Returns the <code>UserContext</code> of the current system user.
     * @returns The UserContext
     */
    getUserContext(): UserContext;

    /**
     * Returns a [`FileContext`]{@link FileContext}.
     * @returns The FileContext
     */
    getFileContext(): FileContext;

    /**
     * Returns an [`ExtendedSearchContext`]{@link ExtendedSearchContext}.
     * @returns The ExtendedSearchContext
     */
    getExtendedSearchContext(): ExtendedSearchContext;

    /**
     * Returns a [`GentableContext`]{@link GentableContext}.
     * @returns The GentableContext
     */
    getGentableContext(): GentableContext;

    /**
     * Returns a [`GadgetContext`]{@link GadgetContext}.
     * @returns The GadgetContext
     */
    getGadgetContext(): GadgetContext;

    /**
     * Returns an [`I18nContext`]{@link I18nContext}.
     * @returns The I18nContext
     */
    getI18nContext(): I18nContext;

    /**
     * Changes the current view to the start screen view.
     * Caution: This function will not process any actions if the user is currently in edit mode.
     */
    openHomeView(): void;

    /**
     * Opens the outbar with the given name.
     * @param options
     * @param options.name Possible values:
     *        *OutbarPublicFolder*  //The outbar for public folders (Documents Manager - Settings - Documents (display) - Combined folder tree not checked)
     *        *OutbarPrivateFolder*  //The outbar for private folders (Documents Manager - Settings - Documents (display) - Combined folder tree not checked)
     *        *OutbarCombinedFolder*  //The outbar for a combination of public and private folders (Documents Manager - Settings - Documents (display) - Combined folder tree checked)
     *        *OutbarHitTree*  //The outbar for a hit tree (Documents Manager - Settings - Global Settings - Hit tree checked)
     *        User defined outbars can be accessed by their name (Documents Manager - settings - Outbars).
     */
    openOutbar(options: openOutbar_options): void;

    /**
     * Changes the current view to a folder view. It is allowed to navigate to any private or public folder.
     * Caution: This function will not process any actions if the user is currently in edit mode.
     * @param folderId the id of the folder
     */
    openFolderView(folderId: String): void;

    /**
     * Changes the current view to a file view. It is allowed to navigate to a file (cover), to a register or to a document.
     * Caution: This function will not process any actions if the user is currently in edit mode.
     * @param fileId the id of the file
     * @param registerId the id of the file register
     * @param documentId the id of the file document
     * @param options
     * @param options.autoOpenDocumentMode , default: true
     * @param options.checkConstraints if constraints should be checked or not, default: true
     * @param options.startFileEditMode if file edit mode should be started or not, default: false
     * @param options.registerBarState "open", "min", "closed", default :
     */
    openFileView(fileId: String, registerId?: String, documentId?: String, options?: openFileView_options): void;

    /**
     * Updates the current file view.
     * In file edit mode, this operation automatically stores the values of all visible file fields while ignoring any constraints.
     */
    updateFileView(): void;

    /**
     * Changes the current view to the extended search view.
     * Caution: This function will not process any actions if the user is currently in edit mode.
     */
    openExtendedSearchView(): void;

    /**
     * Displays a dialog window that requests the current system user for confirmation.
     * The dialog window is displayed in front of the main window and system users always have to interact with it before they can return to the main window.
     * Note that unlike a <code>window.prompt()</code> dialog, the execution of the current program flow is <i>not</i> paused until the user cancels or confirms the dialog.
     * @param title the title of the dialog window
     * @param message the confirmation message text
     * @param onOk a function that is executed if the user clicks "OK"
     * @param onCancel a function that is executed if the user clicks "Cancel"
     * @param onClose a function that is executed if the user clicks "OK", "Cancel" or "X". The function is executed after the onOk or onCancel function.
     * @see [closeDialog]{@link DocumentsContext#closeDialog}
     */
    openConfirmationDialog(title: String, message: String, onOk: Function, onCancel: Function, onClose: Function): void;

    /**
     * Creates and returns a documents application servlet url by a defined type. Optional parameters must be provided in some cases.
     * @param type the type of the servlet url that should be returned<br>
     *        <code>annotation</code> (<code>options</code>: <code>fileId</code>, <code>documentId</code>) URL to access the annotations of a pdf/tif file
     *        <code>controlSheet</code> (<code>options</code>: <code>fileId</code>, <code>registerId</code>) URL for a control sheet
     *        <code>gadget</code> URL for a gadget
     *        <code>docDownload</code> URL to download a file (<code>options</code>: <code>fileId</code>, <code>documentId</code>, <code>attachmentType</code>, <code>versionId</code>, <code>attachmentMode</code>)
     *        <code>pdfjsViewer</code> URL to access the pdfjs viewer
     *        <code>otrisViewer</code> URL to access the otris viewer
     *        <code>report</code> URL for a report
     *        <code>docUpload</code> URL to access the upload servlet
     *        <code>userLogin</code> URL to login the current user
     *        <code>userLogout</code> URL to logout the current user
     * @param options additional options needed for some types
     * @param options.absolute default false, if true the function will return an absolute url, otherwise a relative url
     * @param options.fileId the id of the file
     * @param options.documentId the id of the file document
     * @param options.registerId the id of the file register
     * @param options.filename the file name of a file document
     * @param options.attachmentMode
     * @param options.attachmentType
     * @param options.versionId the id of a file document version
     */
    getURL(type: String, options?: getURL_options): String;

    /**
     * Displays a message dialog window.
     * The dialog window is displayed in front of the main window and system users always have to interact with it before they can return to the main window.
     * Note that unlike a <code>window.alert()</code> dialog, the execution of the current program flow is <i>not</i> paused until the user cancels or confirms the dialog.
     * @param title the title of the dialog window
     * @param message the message text
     * @param onOk a function that is executed if the user clicks "OK"
     * @param onClose a function that is executed if the user clicks "OK" or "X". The function is executed after the onOk function.
     * @see [closeDialog]{@link DocumentsContext#closeDialog}
     */
    openMessageDialog(title: String, message: String, onOk: Function, onClose: Function): void;

    /**
     * Displays a html dialog window.
     * The dialog window is displayed in front of the main window and system users always have to interact with it before they can return to the main window.
     * Note that unlike a <code>window.alert()</code> dialog, the execution of the current program flow is <i>not</i> paused until the user cancels or confirms the dialog.
     * @param title the title of the dialog window
     * @param html the inner html content source
     * @param onOk a function that is executed if the user clicks "OK"
     * @param onClose a function that is executed if the user clicks "OK" or "X". The function is executed after the onOk function.
     * @see [closeDialog]{@link DocumentsContext#closeDialog}
     */
    openHtmlDialog(title: String, html: String, onOk: Function, onClose: Function): void;

    /**
     * Displays a dialog with an embedded iframe.
     * @param title the title of the dialog window
     * @param frameSrc the url of the embedded iframe
     * @param options
     * @param options.width the width of the dialog, default: 400
     * @param options.height the height of the dialog, default: 300
     * @param options.top the distance from the top of the window
     * @param options.left the distance from the left of the window
     * @param options.frameStyles the styles of the dialog
     * @param options.frameStyleClasses the classes of the dialog
     * @param options.onClose function to execute when close is clicked
     * @param options.onOk function to execute when ok is clicked
     * @param options.onCancel function to execute when cancel is clicked
     */
    openFrameDialog(title: String, frameSrc: String, options?: openFrameDialog_options): void;

    /**
     * Closes any dialog that is currently displayed.
     */
    closeDialog(): void;

    /**
     * Opens a dedicated dialog for the tabledata plugin.
     * Basically, there are two different dialog types available, one (internal) iframe dialog (default) and another (external) popup window dialog.
     * The internal iframe dialog appears like an ordinary DOCUMENTS 5 dialog, the external popup window dialog is the more traditional way.
     * This function supports fully automatic setting of file field data, gentable row data or email dialog recipient data on a tabledata row selection.
     * Alternatively, a custom handler function can be implemented which will be executed on tabledata row selection.
     * If the automatic field setting should be used, the <code>exitOptions</code> option must be specified. Otherwise, if a custom row selection handler should be used, the the <code>onSelect</code> option must be specified.
     * If both options are set by accident, <code>onSelect</code> option overrides the <code>exitOptions</code> option and also any automatic data setting.
     * See the examples below for recommended implementations of <code>detail.jsp</code>. Legacy D5 implementations of <code>detail.jsp</code> are fully supported so updating the code is not mandatory in most cases.
     * @param title the title of the dialog window
     * @param url the url of the <code>table.jsp</code>
     * @param options
     * @param options.onSelect custom handler function that is executed after the selection of a tabledata row entry, the selected data is available as a function parameter.
     *        Notice: If this option is set, none of the fields will be set automatically.
     * @param options.exitOptions the <code>options</code> object of the registered exit callback function, see examples below for details.
     *        Should be provided if <code>options.onSelect</code> option is not set.
     * @param options.popupWin <code>true</code>, if an (external) popup window should be used to display the tabledata, otherwise an (internal) iframe dialog is used (default)
     * @param options.width the width of the dialog, default: 400
     * @param options.height the height of the dialog, default: 300
     * @param options.top the top position of the dialog
     * @param options.left the left position of the dialog
     * @param options.onClose custom handler function that is executed when the dialog is closed, not available if <code>popupWin: true</code> is set
     * @param options.sortColumn the column that sorts the tabledata, add '+' or '-' at the end of the column name to set the sort order. Default: '+'
     * @param options.searchText the default search text, tabledata is searched on opening
     * @param options.searchColumn the column to search the searchText in
     * @param options.params additional parameter that will be added to the url
     */
    openTableDataDialog(title: String, url: String, options?: openTableDataDialog_options): void;

    /**
     * Returns a transient session web storage by its key. If the key is omitted, a "custom" session storage is returned by default.
     * @param key the key of the storage
     */
    getSessionStorage(key: String): SessionStorage;

    /**
     * Returns a persistent local web storage by its key. If the key is omitted, a "custom" local storage is returned by default.
     * @param key the key of the storage
     */
    getLocalStorage(key: String): LocalStorage;

    /**
     * Closes a gadget. Currently only useful when the gadget is used in a popup dialog.
     */
    closeGadget(): void;

    /**
     * Executes a server-side global script by its name. Any defined script parameters can be transmitted alike.
     * The script can either be called <i>synchronous</i> (default) or <i>asynchronous</i> (via options parameter).
     * If the script result has a defined <code>returnType</code> (defined by context.returnType in the portal script) the
     * function has <strong>no return value</strong> and the output depends on the returnType.
     * With the option <code>dispatch</code> it is possible to always retrieve the script result even if a returnType is defined.
     * options.dispatch must be set to <strong>false</strong> (defaults to true) to use the script result as return value.
     * With <code>option.async = true</code> the function always returns a Promise object. If this option is set it is also
     * possible to input script parameters defined in the Documents Manager via a dialog. Script parameters added via dialog
     * will override duplicate <code>scriptParams</code> keys.
     * @param scriptName - the name of the script
     * @param scriptParams - the input parameters for the script
     * @param options - additional options
     * @param options.dispatch default true, if false scriptResult is returned even if the script has a returnType
     * @param options.async default false, if true the script will be executed asynchronous and will return a promise
     * @param options.useScriptParameterDialog default false, if true a script parameter dialog will always be displayed if the script has defined parameter, only works if options.async = true
     * @param options.dialogTitle the title of the script parameter dialog
     */
    executeScript(scriptName: String, scriptParams?: Object, options?: executeScript_options): Promise | String | undefined;

    /**
     * Encodes an URL by adding the <code>jsessionid</code> and the <code>cnvid</code> to it. A <code>jsessionid</code> is provided if cookies are disabled only.
     * URLs must be encoded always if calling custom servlets or jsps and access to the tomcat server session is required.
     * @param url the url to be encoded
     * @see [getBaseParams]{@link DocumentsContext#getBaseParams}
     * @see [getBaseParamsQueryString]{@link DocumentsContext#getBaseParamsQueryString}
     */
    encodeURL(url: String): String;

    /**
     * Returns all documents application related base parameters as object. It includes both the principal (<code>pri</code>) and the language (<code>lang</code>) parameter.
     * @see [encodeURL]{@link DocumentsContext#encodeURL}
     * @see [getBaseParamsQueryString]{@link DocumentsContext#getBaseParamsQueryString}
     */
    getBaseParams(): Object;

    /**
     * Returns the query string of all documents application related base parameters as query string. It includes both the principal (<code>pri</code>) and the language (<code>lang</code>) parameter.
     * @see [encodeURL]{@link DocumentsContext#encodeURL}
     * @see [getBaseParams]{@link DocumentsContext#getBaseParams}
     */
    getBaseParamsQueryString(): String;

    /**
     * This function locks a defined view for the current user by a view identifier.
     * Valid view identifiers are <code>Workspace</code>, <code>MainTree</code>, <code>MainList</code>, <code>MainFile</code>, <code>MainFileGentable</code>.
     * @param view the identifier of the view that is to be locked
     * @see [stopBusyPanel]{@link DocumentsContext#stopBusyPanel}
     */
    startBusyPanel(view: String): void;

    /**
     * This function unlocks a defined view for the current user by a view identifier.
     * Valid view identifiers are <code>Workspace</code>, <code>MainTree</code>, <code>MainList</code>, <code>MainFile</code>, <code>MainFileGentable</code>.
     * @param view the identifier of the view that is to be unlocked
     * @see [startBusyPanel]{@link DocumentsContext#startBusyPanel}
     */
    stopBusyPanel(view: String): void;

}

declare interface openOutbar_options {
    /**
     * <p>Possible values:<br><em>OutbarPublicFolder</em>  //The outbar for public folders (Documents Manager - Settings - Documents (display) - Combined folder tree not checked)<br><em>OutbarPrivateFolder</em>  //The outbar for private folders (Documents Manager - Settings - Documents (display) - Combined folder tree not checked)<br><em>OutbarCombinedFolder</em>  //The outbar for a combination of public and private folders (Documents Manager - Settings - Documents (display) - Combined folder tree checked)<br><em>OutbarHitTree</em>  //The outbar for a hit tree (Documents Manager - Settings - Global Settings - Hit tree checked)<br>User defined outbars can be accessed by their name (Documents Manager - settings - Outbars).</p>
     */
    name: String;
}

declare interface openFileView_options {
    /**
     * <p>, default: true</p>
     */
    autoOpenDocumentMode: Boolean;
    /**
     * <p>if constraints should be checked or not, default: true</p>
     */
    checkConstraints: Boolean;
    /**
     * <p>if file edit mode should be started or not, default: false</p>
     */
    startFileEditMode: Boolean;
    /**
     * <p>&quot;open&quot;, &quot;min&quot;, &quot;closed&quot;, default :</p>
     */
    registerBarState: String;
}

declare interface getURL_options {
    /**
     * <p>default false, if true the function will return an absolute url, otherwise a relative url</p>
     */
    absolute: String;
    /**
     * <p>the id of the file</p>
     */
    fileId: String;
    /**
     * <p>the id of the file document</p>
     */
    documentId: String;
    /**
     * <p>the id of the file register</p>
     */
    registerId: String;
    /**
     * <p>the file name of a file document</p>
     */
    filename: String;
    attachmentMode: Boolean;
    attachmentType: String;
    /**
     * <p>the id of a file document version</p>
     */
    versionId: String;
}

declare interface openFrameDialog_options {
    /**
     * <p>the width of the dialog, default: 400</p>
     */
    width: Number;
    /**
     * <p>the height of the dialog, default: 300</p>
     */
    height: Number;
    /**
     * <p>the distance from the top of the window</p>
     */
    top: Number;
    /**
     * <p>the distance from the left of the window</p>
     */
    left: Number;
    /**
     * <p>the styles of the dialog</p>
     */
    frameStyles: Object;
    /**
     * <p>the classes of the dialog</p>
     */
    frameStyleClasses: Object;
    /**
     * <p>function to execute when close is clicked</p>
     */
    onClose: Function;
    /**
     * <p>function to execute when ok is clicked</p>
     */
    onOk: Function;
    /**
     * <p>function to execute when cancel is clicked</p>
     */
    onCancel: Function;
}

declare interface openTableDataDialog_options {
    /**
     * <p>custom handler function that is executed after the selection of a tabledata row entry, the selected data is available as a function parameter.<br>Notice: If this option is set, none of the fields will be set automatically.</p>
     */
    onSelect: Function;
    /**
     * <p>the <code>options</code> object of the registered exit callback function, see examples below for details.<br>Should be provided if <code>options.onSelect</code> option is not set.</p>
     */
    exitOptions: Object;
    /**
     * <p><code>true</code>, if an (external) popup window should be used to display the tabledata, otherwise an (internal) iframe dialog is used (default)</p>
     */
    popupWin: Boolean;
    /**
     * <p>the width of the dialog, default: 400</p>
     */
    width: Number;
    /**
     * <p>the height of the dialog, default: 300</p>
     */
    height: Number;
    /**
     * <p>the top position of the dialog</p>
     */
    top: Number;
    /**
     * <p>the left position of the dialog</p>
     */
    left: Number;
    /**
     * <p>custom handler function that is executed when the dialog is closed, not available if <code>popupWin: true</code> is set</p>
     */
    onClose: Function;
    /**
     * <p>the column that sorts the tabledata, add '+' or '-' at the end of the column name to set the sort order. Default: '+'</p>
     */
    sortColumn: String;
    /**
     * <p>the default search text, tabledata is searched on opening</p>
     */
    searchText: String;
    /**
     * <p>the column to search the searchText in</p>
     */
    searchColumn: String;
    /**
     * <p>additional parameter that will be added to the url</p>
     */
    params: Object;
}

declare interface executeScript_options {
    /**
     * <p>default true, if false scriptResult is returned even if the script has a returnType</p>
     */
    dispatch: String;
    /**
     * <p>default false, if true the script will be executed asynchronous and will return a promise</p>
     */
    async: String;
    /**
     * <p>default false, if true a script parameter dialog will always be displayed if the script has defined parameter, only works if options.async = true</p>
     */
    useScriptParameterDialog: String;
    /**
     * <p>the title of the script parameter dialog</p>
     */
    dialogTitle: String;
}

/**
 * 
 * @param documentsContext the <code>DocumentsContext</code> passed in the function
 * @param options the options passed to the function
 * @param options.fileTypeName the technical name of the file type
 */
declare type fileExitCallback = (documentsContext: DocumentsContext, options: fileExitCallback_options)=>void;

declare interface fileExitCallback_options {
    /**
     * <p>the technical name of the file type</p>
     */
    fileTypeName: String;
}

/**
 * 
 * @param documentsContext the <code>DocumentsContext</code> passed in the function
 * @param options the options passed in the function
 * @param options.searchForm the {@link documents.sdk.ExtendedSearchFormModel|ExtendedSearchFormModel} of the extended Search
 */
declare type searchExitCallback = (documentsContext: DocumentsContext, options?: searchExitCallback_options)=>void;

declare interface searchExitCallback_options {
    /**
     * <p>the {@link documents.sdk.ExtendedSearchFormModel|ExtendedSearchFormModel} of the extended Search</p>
     */
    searchForm: String;
}

/**
 * 
 * @param documentsContext the <code>DocumentsContext</code> passed in the function
 * @param options the options passed in the function
 * @param options.searchField the search-field triggering the exit
 * @param options.searchFieldId the id of the search-field triggering the exit
 * @param options.searchFieldName the name of the search-field triggering the exit
 * @param options.searchFieldValue the value of the search-field triggering the exit
 * @param options.searchForm the {@link documents.sdk.ExtendedSearchFormModel|ExtendedSearchFormModel} of the extended Search
 */
declare type searchFieldExitCallback = (documentsContext: DocumentsContext, options: searchFieldExitCallback_options)=>void;

declare interface searchFieldExitCallback_options {
    /**
     * <p>the search-field triggering the exit</p>
     */
    searchField: String;
    /**
     * <p>the id of the search-field triggering the exit</p>
     */
    searchFieldId: String;
    /**
     * <p>the name of the search-field triggering the exit</p>
     */
    searchFieldName: String;
    /**
     * <p>the value of the search-field triggering the exit</p>
     */
    searchFieldValue: String;
    /**
     * <p>the {@link documents.sdk.ExtendedSearchFormModel|ExtendedSearchFormModel} of the extended Search</p>
     */
    searchForm: String;
}

/**
 * 
 * @param documentsContext the <code>DocumentsContext</code> passed in the function
 * @param options the options passed in the function
 * @param options.fileFieldId the id of the file field
 * @param options.fileFieldName the technical name of the file field
 * @param options.fileTypeName the technical name of the file type
 */
declare type fileFieldExitCallback = (documentsContext: DocumentsContext, options: fileFieldExitCallback_options)=>void;

declare interface fileFieldExitCallback_options {
    /**
     * <p>the id of the file field</p>
     */
    fileFieldId: String;
    /**
     * <p>the technical name of the file field</p>
     */
    fileFieldName: String;
    /**
     * <p>the technical name of the file type</p>
     */
    fileTypeName: String;
}

/**
 * 
 * @param documentsContext the <code>DocumentsContext</code> passed in the function
 * @param options the options passed in the function
 * @param options.folderId the id of the folder
 * @param options.folderName the technical name of the folder
 */
declare type folderExitCallback = (documentsContext: DocumentsContext, options: folderExitCallback_options)=>void;

declare interface folderExitCallback_options {
    /**
     * <p>the id of the folder</p>
     */
    folderId: String;
    /**
     * <p>the technical name of the folder</p>
     */
    folderName: String;
}

/**
 * 
 * @param documentsContext the <code>DocumentsContext</code> passed in the function
 * @param options the options passed in the function
 * @param options.outbarName the technical name of the outbar
 */
declare type outbarExitCallback = (documentsContext: DocumentsContext, options: outbarExitCallback_options)=>void;

declare interface outbarExitCallback_options {
    /**
     * <p>the technical name of the outbar</p>
     */
    outbarName: String;
}

/**
 * 
 * @param documentsContext the <code>DocumentsContext</code> passed in the function
 * @param options the options passed in the function
 * @param options.scriptName the name(s) of the script configered in the manager
 * @param options.scriptForm the {@link documents.sdk.ScriptParameterFormModel|ScriptParameterFormModel} of the script parameter dialog
 */
declare type scriptParameterExitCallback = (documentsContext: DocumentsContext, options?: scriptParameterExitCallback_options)=>void;

declare interface scriptParameterExitCallback_options {
    /**
     * <p>the name(s) of the script configered in the manager</p>
     */
    scriptName: String;
    /**
     * <p>the {@link documents.sdk.ScriptParameterFormModel|ScriptParameterFormModel} of the script parameter dialog</p>
     */
    scriptForm: String;
}

/**
 * 
 * @param documentsContext the <code>DocumentsContext</code> passed in the function
 * @param options the options passed in the function
 * @param options.scriptName the name(s) of the script configered in the manager
 * @param options.scriptField the script-field triggering the exit
 * @param options.scriptFieldId the id of the script-field triggering the exit
 * @param options.scriptFieldName the name of the script-field triggering the exit
 * @param options.scriptFieldValue the value of the script-field triggering the exit
 * @param options.scriptForm the {@link documents.sdk.ScriptParameterFormModel|ScriptParameterFormModel} of the script parameter dialog
 */
declare type scriptParameterFieldExitCallback = (documentsContext: DocumentsContext, options: scriptParameterFieldExitCallback_options)=>void;

declare interface scriptParameterFieldExitCallback_options {
    /**
     * <p>the name(s) of the script configered in the manager</p>
     */
    scriptName: String;
    /**
     * <p>the script-field triggering the exit</p>
     */
    scriptField: String;
    /**
     * <p>the id of the script-field triggering the exit</p>
     */
    scriptFieldId: String;
    /**
     * <p>the name of the script-field triggering the exit</p>
     */
    scriptFieldName: String;
    /**
     * <p>the value of the script-field triggering the exit</p>
     */
    scriptFieldValue: String;
    /**
     * <p>the {@link documents.sdk.ScriptParameterFormModel|ScriptParameterFormModel} of the script parameter dialog</p>
     */
    scriptForm: String;
}

declare class ExtendedSearchContext {
    /**
     * The ExtendedSearchContext provides access to the Extended Search Dialog
     * and gives access to various GUI functions like get/set field values,
     * change the color of fields, change the focus to a specific field etc.
     */
    constructor();

    /**
     * Returns the DOM element of the entire search form view.
     * @returns the DOM element of the search form view
     */
    getSearchFormViewEl(): Element;

    /**
     * Returns the jQuery object of the entire search form view.
     * @returns the jQuery object of the search form view
     */
    getSearchFormView$El(): JQuery;

    /**
     * Returns the DOM element of a search field's input field by its name.
     * @param fieldName the name of the field
     * @returns the DOM element of the input field
     */
    getSearchFieldEl(fieldName: String): Element;

    /**
     * Returns the jQuery object of a search field's input field by its name.
     * @param fieldName the name of the field
     * @returns the jQuery object of the input field
     */
    getSearchField$El(fieldName: String): JQuery;

    /**
     * Returns the jQuery object of a search field's label by its name.
     * @param fieldName the name of the field
     * @returns the jQuery object of the label
     */
    getSearchFieldLabel$El(fieldName: String): JQuery;

    /**
     * Gets the value of a search field by its name.
     * @param fieldName the search field name
     */
    getSearchFieldValue(fieldName: String): String;

    /**
     * Gets the values for an array of search fields by their names.
     * @param fieldNames the search field names
     */
    getSearchFieldValues(fieldNames: String[]): Object;

    /**
     * Gets the value of a search field as a Number. If the parameters decimalSeparator and
     * groupingSeparator are not set the method will use localized values.
     * @param fieldName - the file field name
     * @param decimalSeparator the decimal separator
     * @param groupingSeparator the grouping separator
     */
    getSearchFieldNumberValue(fieldName: String, decimalSeparator?: String, groupingSeparator?: String): Number;

    /**
     * Sets the value of a search field to the specified value by its name.
     * @param fieldName the search field name
     * @param value the new value of the search field
     */
    setSearchFieldValue(fieldName: String, value: String): String;

    /**
     * Sets the value of multiple search fields to the specified value by its name.
     * @param fieldValues
     */
    setSearchFieldValues(fieldValues: Object): void;

    /**
     * Sets the options for a select menu.
     * @param fieldName the name of the select field
     * @param value the values for the select field
     * @param options keepSelected === true: the previously selected value will be kept even if not inside the value String (default),
     *        false: the previously selected value will be removed except when inside the value String
     */
    setSearchFieldOptions(fieldName: String, value: String | String[] | Object, options: Object): void;

    /**
     * Checks if a search field is currently displayed or not.
     * @param fieldName the name of the field
     */
    isSearchFieldVisible(fieldName: String): Boolean;

    /**
     * Sets the focus to a search field by its name.
     * @param fieldName the name of the field
     */
    setSearchFieldFocus(fieldName: String): void;

    /**
     * Sets the text-color of a search field by its name.
     * @param fieldName the name of the field
     * @param color the new color
     */
    setSearchFieldColor(fieldName: String, color: String): void;

    /**
     * Sets the background-color of a search field by its name.
     * @param fieldName the name of the field
     * @param color the new color
     */
    setSearchFieldBgColor(fieldName: String, color: String): void;

    /**
     * Sets the border-color of a search field by its name.
     * @param fieldName the name of the field
     * @param color the new color
     */
    setSearchFieldBorderColor(fieldName: String, color: String): void;

    /**
     * Sets the text-color of a search field label by its name.
     * @param fieldName the name of the field
     * @param color the new color
     */
    setSearchFieldLabelColor(fieldName: String, color: String): void;

    /**
     * Returns a shallow array of all currently available search source items.
     * Each item contains (at least) the attributes <code>id</code>, <code>name</code>, <code>type</code>, <code>label</code>, <code>selected</code> and <code>opened</code>.
     * @param options
     * @param options.filter a filter
     */
    getSearchSources(options?: getSearchSources_options): void;

    /**
     * Returns a shallow array of all currently selected search source items.
     * Each item contains (at least) the attributes <code>id</code>, <code>name</code>, <code>type</code>, <code>label</code>, <code>selected</code> and <code>opened</code>.
     * @param options
     * @param options.filter a filter
     */
    getSelectedSearchSources(options?: getSelectedSearchSources_options): void;

    /**
     * Returns a shallow array of all currently available search source names.
     * @param options
     * @param options.filter a filter
     */
    getSearchSourceNames(options?: getSearchSourceNames_options): void;

    /**
     * Returns a shallow array of all currently selected search source names.
     * @param options
     * @param options.filter a filter
     */
    getSelectedSearchSourceNames(options?: getSelectedSearchSourceNames_options): void;

    /**
     * Returns the extended search form model.
     * @returns the extended search form model
     */
    getSearchFormModel(): ExtendedSearchFormModel;

}

declare interface getSearchSources_options {
    /**
     * <p>a filter</p>
     */
    filter: Object;
}

declare interface getSelectedSearchSources_options {
    /**
     * <p>a filter</p>
     */
    filter: Object;
}

declare interface getSearchSourceNames_options {
    /**
     * <p>a filter</p>
     */
    filter: Object;
}

declare interface getSelectedSearchSourceNames_options {
    /**
     * <p>a filter</p>
     */
    filter: Object;
}

declare class FileContext {
    /**
     * The FileContext provides general information about a document, the possibility to execute scripts, control the edit mode
     * and gives access to various GUI functions like get/set field values, change the color of fields, change the focus to a
     * specific field etc.
     */
    constructor();

    /**
     * Returns the current value of a file field by its name.
     * If, for any reason, the field is currently not visible, the field value will be retrieved from the file instance on the server. This default fallback behaviour can be disabled by the `serverMode` option.
     * @param fieldName the technical file field name
     * @param options
     * @param options.serverMode if true (default) and the field is currently not visible, gets the field value from the server
     */
    getFileFieldValue(fieldName: String, options?: getFileFieldValue_options): String;

    /**
     * Returns the current value of a file field as a number by its name.
     * If, for any reason, the field is currently not visible, the field value will be retrieved from the file instance on the server. This default fallback behaviour can be disabled by the `serverMode` option.
     * If any of the optional `decimalSeparator` or `groupingSeparator` parameters is not set, this function will automatically use the default value of the current user locale configured in the Documents Manager.
     * @param fieldName the technical file field name
     * @param decimalSeparator the decimal separator character
     * @param groupingSeparator the grouping separator character
     * @param options
     * @param options.serverMode if true (default) and the field is currently not visible, gets the field value from the server
     */
    getFileFieldNumberValue(fieldName: String, decimalSeparator?: String, groupingSeparator?: String, options?: getFileFieldNumberValue_options): Number;

    /**
     * Gets all available options of a select menu or a double list.
     * @param fieldName - the file field name
     */
    getFileFieldOptions(fieldName: String): Object;

    /**
     * Gets the values for an array of file fields by their names.
     * @param fieldNames the file field names
     * @param options
     * @param options.serverMode get the field value from the server if the field is not visible, default true
     */
    getFileFieldValues(fieldNames: String[], options?: getFileFieldValues_options): Object;

    /**
     * Returns the file form model.
     * @returns the file form model
     */
    getFileFormModel(): FileFormModel;

    /**
     * Sets the value of a file field to the specified value by its name.
     * Caution: This function will work correctly only if the current file is already in edit mode.
     * If, for any reason, the field is currently not visible, the field value will be set to the file instance on the server. This default fallback behaviour can be disabled by the `serverMode` option.
     * @param fieldName the technical file field name
     * @param value the new value of the file field, can be an array if used with a multi-value field type
     * @param options
     * @param options.serverMode if true (default) and the field is currently not visible, sets the field value to the server
     */
    setFileFieldValue(fieldName: String, value?: String | String[], options?: setFileFieldValue_options): String;

    /**
     * Sets the value of multiple file fields to the specified value by its name.
     * Caution: This function will work only if the user is already in edit mode.
     * @param fieldValues
     * @param options
     * @param options.serverMode set the field value on the server if the field is not visible, default true
     */
    setFileFieldValues(fieldValues: Object, options?: setFileFieldValues_options): void;

    /**
     * Sets the options for a select menu or the doublelist. This method does not work if the file is not in edit mode.
     * @param fieldName the name of the select/doublelist field
     * @param values the values for the select/doublelist field
     * @param options keepSelected === true: the previously selected value will be kept even if not inside the value String (default),
     *        false: the previously selected value will be removed except when inside the value String
     */
    setFileFieldOptions(fieldName: String, values: String | String[] | Object, options: Object): void;

    /**
     * Sets a file reference.
     * Removing the file reference can be achieved by passing <code>null</code> or <code>""</code> in referenceFileId.
     * @param fieldName the name of the field
     * @param referenceFileId the id of the reference file, <code>null</code> or <code>""</code> to reset
     */
    setFileFieldReference(fieldName: String, referenceFileId: String): void;

    /**
     * Returns if the file is currently in edit mode or not.
     */
    isFileEditMode(): Boolean;

    /**
     * Starts the file edit mode.
     * This function will work only if the user is not already in edit mode.
     */
    startFileEditMode(): void;

    /**
     * Aborts the file edit mode. Any modifications in the file will be discarded.
     * This function will work only if the user is already in edit mode.
     */
    cancelFileEditMode(): void;

    /**
     * Stops the file edit mode. Any modifications in the file will be commited.
     * This function will work only if the user is already in edit mode.
     */
    commitFileEditMode(): void;

    /**
     * Checks if a file field is currently displayed or not.
     * @param fieldName the name of the field
     */
    isFileFieldVisible(fieldName: String): Boolean;

    /**
     * Returns the id of a file field by its name.
     * @param fieldName the name of the field
     */
    getFileFieldId(fieldName: String): String;

    /**
     * Returns the DOM element id of a file field's input field by its name.
     * @param fieldName the name of the field
     */
    getFileFieldElId(fieldName: String): String;

    /**
     * Returns the DOM element of a file field's input field by its name.
     * @param fieldName the name of the field
     * @returns the DOM element of the input field
     */
    getFileFieldEl(fieldName: String): Element;

    /**
     * Returns the jQuery object of a file field's input field by its name.
     * @param fieldName the name of the field
     * @returns the jQuery object of the input field
     */
    getFileField$El(fieldName: String): JQuery;

    /**
     * Returns the jQuery object of a file field's label by its name.
     * @param fieldName the name of the field
     * @returns the jQuery object of the label
     */
    getFileFieldLabel$El(fieldName: String): JQuery;

    /**
     * Sets the text-color of a file field by its name.
     * @param fieldName the name of the field
     * @param color the new color
     */
    setFileFieldColor(fieldName: String, color: String): void;

    /**
     * Sets the background-color of a file field by its name.
     * @param fieldName the name of the field
     * @param color the new color
     */
    setFileFieldBgColor(fieldName: String, color: String): void;

    /**
     * Sets the border-color of a file field by its name.
     * @param fieldName the name of the field
     * @param color the new color
     */
    setFileFieldBorderColor(fieldName: String, color: String): void;

    /**
     * Sets the text-color of a file field label by its name.
     * @param fieldName the name of the field
     * @param color the new color
     */
    setFileFieldLabelColor(fieldName: String, color: String): void;

    /**
     * Sets the focus to a file field by its name.
     * @param fieldName the name of the field
     */
    setFileFieldFocus(fieldName: String): void;

    /**
     * Returns the current vertical scroll position from the top.
     */
    getScrollPositionTop(): Number;

    /**
     * Returns the current horizontal scroll position from the left.
     */
    getScrollPositionLeft(): Number;

    /**
     * Sets the vertical scroll position from the top.
     * @param value the new vertical scroll position
     */
    setScrollPositionTop(value: Number): void;

    /**
     * Sets the horizontal scroll position from the left.
     * @param value the new horizontal scroll position
     */
    setScrollPositionLeft(value: Number): void;

    /**
     * Returns the file property for the given key.
     * @param key the key of the property
     */
    getFileProperty(key: String): String;

    /**
     * Returns the file register property for the given key.
     * @param key the key of the property
     */
    getFileRegisterProperty(key: String): String;

    /**
     * Executes a server-side file script by its name. Any defined script parameters can be transmitted alike.
     * The script can either be called <i>synchronous</i> (default) or <i>asynchronous</i> (via options parameter).
     * If the script result has a defined <code>returnType</code> (defined by context.returnType in the portal script) the
     * function has <strong>no return value</strong> and the output depends on the returnType.
     * With the option <code>dispatch</code> it is possible to always retrieve the script result even if a returnType is defined.
     * options.dispatch must be set to <strong>false</strong> (defaults to true) to use the script result as return value.
     * With <code>option.async = true</code> the function always returns a Promise object. If this option is set it is also
     * possible to input script parameters defined in the Documents Manager via a dialog. Script parameters added via dialog
     * will override duplicate <code>scriptParams</code> keys.
     * @param scriptName - the name of the script
     * @param scriptParams - the input parameters for the script
     * @param options - additional options
     * @param options.dispatch default true, if false scriptResult is returned even if the script has a returnType
     * @param options.async default false, if true the script will be executed asynchronous and will return a promise
     * @param options.useScriptParameterDialog default false, if true a script parameter dialog will always be displayed if the script has defined parameter, only works if options.async = true
     * @param options.dialogTitle the title of the script parameter dialog
     */
    executeScript(scriptName: String, scriptParams?: Object, options?: executeScript_options): Promise | String | undefined;

    /**
     * Returns the id of the current file.
     */
    getFileId(): String;

    /**
     * Returns the id of the current register.
     */
    getRegisterId(): String;

    /**
     * Returns the id of the current document.
     */
    getDocumentId(): String;

    /**
     * Returns the file type name of the current file.
     */
    getFileTypeName(): String;

    /**
     * Returns the type of the current register.
     */
    getRegisterType(): String;

    /**
     * Returns the title of the current file.
     */
    getFileTitle(): String;

    /**
     * Returns the title of the current register.
     */
    getRegisterTitle(): String;

    /**
     * Returns the title of the current document.
     */
    getDocumentTitle(): String;

    /**
     * Returns the current file task.
     */
    getFileTask(): String;

    /**
     * Opens or closes the file registerbar view.
     * @param action {String} action the action that should be performed, permitted values: `open`, `close`
     * @param options
     * @param options.animate {boolean} `true` (default) if the open or close action should be animated, `false` otherwise
     */
    toggleRegisterbarView(action: String, options?: toggleRegisterbarView_options): void;

    /**
     * Opens or closes the file monitor view.
     * @param action {String} action the action that should be performed, permitted values: `open`, `close`
     * @param options
     * @param options.animate {boolean} `true` (default) if the open or close action should be animated, `false` otherwise
     */
    toggleMonitorView(action: String, options?: toggleMonitorView_options): void;

}

declare interface getFileFieldValue_options {
    /**
     * <p>if true (default) and the field is currently not visible, gets the field value from the server</p>
     */
    serverMode: boolean;
}

declare interface getFileFieldNumberValue_options {
    /**
     * <p>if true (default) and the field is currently not visible, gets the field value from the server</p>
     */
    serverMode: boolean;
}

declare interface getFileFieldValues_options {
    /**
     * <p>get the field value from the server if the field is not visible, default true</p>
     */
    serverMode: boolean;
}

declare interface setFileFieldValue_options {
    /**
     * <p>if true (default) and the field is currently not visible, sets the field value to the server</p>
     */
    serverMode: boolean;
}

declare interface setFileFieldValues_options {
    /**
     * <p>set the field value on the server if the field is not visible, default true</p>
     */
    serverMode: boolean;
}

declare interface toggleRegisterbarView_options {
    /**
     * <p><code>true</code> (default) if the open or close action should be animated, <code>false</code> otherwise</p>
     */
    animate: boolean;
}

declare interface toggleMonitorView_options {
    /**
     * <p><code>true</code> (default) if the open or close action should be animated, <code>false</code> otherwise</p>
     */
    animate: boolean;
}

declare abstract class FieldModel {
    /**
     * The FieldModel is the abstract model for form fields. It provides various methods to inspect and manipulate the field model data.
     * Every FieldModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
     * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
     */
    constructor();

    /**
     * Returns the id of the field.
     * @returns the field id
     */
    getId(): String;

    /**
     * Returns the technical name of the field.
     * @returns the technical field name
     */
    getName(): String;

    /**
     * Sets the technical name of the field.
     * @param name the technical field name
     */
    setName(name: String): void;

    /**
     * Returns the label of the field.
     * @returns the field label
     */
    getLabel(): String;

    /**
     * Sets the label of the field.
     * @param label the field label
     */
    setLabel(label: String): void;

    /**
     * Returns the type of the field.
     * @returns the field type
     * @see
     */
    getType(): String;

    /**
     * Sets the type of the field.
     * In case of changing a field into a checkbox or a radio-group, the displayed options will be set to a default value. If you want to change them, please use the method {@link documents.sdk.FieldModel#setEnumValues|setEnumValues}.
     * @param type the field type
     * @see
     * @see
     */
    setType(type: FieldModel.Types): void;

    /**
     * Returns if the field is readonly or not.
     * @returns <code>true</code> if the field is readonly, <code>false</code> otherwise
     * @see
     */
    isReadonly(): Boolean;

    /**
     * Sets the field to readonly.
     * @param readonly <code>true</code> for readonly,  <code>false</code> otherwise
     * @see
     */
    setReadonly(readonly: Boolean): void;

    /**
     * Returns if the field is gui readonly or not.
     * @returns <code>true</code> if the field is gui readonly, <code>false</code> otherwise
     * @see
     */
    isGuiReadonly(): Boolean;

    /**
     * Sets the field to gui readonly.
     * @param guiReadonly <code>true</code> for gui readonly,  <code>false</code> otherwise
     * @see
     */
    setGuiReadonly(guiReadonly: Boolean): void;

    /**
     * Returns if the field is mandatory or not.
     * @returns <code>true</code> if the field is mandatory, <code>false</code> otherwise
     */
    isMandatory(): Boolean;

    /**
     * Returns the value(s) of the field.
     * @returns the field value
     * @see
     */
    getValue(): String | String[] | Boolean;

    /**
     * Sets the value(s) of the field.
     * Any matching enum values will be updated automatically.
     * @param value the field value
     * @param options
     * @param options.silent When  <code>true</code> the silent mode is active, no backbone events will be triggered, if the  model changes
     * @see
     */
    setValue(value: String | String[] | Boolean, options?: setValue_options): void;

    /**
     * Returns the optional enum values of the field.
     * @returns the field enum values
     */
    getEnumValues(): Object[];

    /**
     * Sets the optional enum values of the field. Supported input-formats can be viewed in the examples.
     * @param enumValues the field enum values
     * @param options the options passed
     * @param options.keepSelected {Boolean} `true` if the current selected entry should be set as the next selected entry. If it is not included within the enumValues it will be added. Default is `false`.
     * @param options.addEmptyEntry {Boolean} `true` if an empty entry should be added to the enumValues. Default is `false`
     */
    setEnumValues(enumValues: Object | Object[] | String | String[], options?: setEnumValues_options): void;

    /**
     * Returns if the field is in the same line as the preceding field or not.
     * @returns <code>true</code> if the field is in the same line as the preceding field, <code>false</code> otherwise
     */
    isSameLine(): Boolean;

    /**
     * Sets the field to the same line as the preceding field.
     * @param sameLine <code>true</code> for same line as the preceding field,  <code>false</code> otherwise
     */
    setSameLine(sameLine: Boolean): void;

    /**
     * Sets an exit configuration of the field.
     * A trigger type of the exit must always be set. Valid types are <code>focusin</code>, <code>focusout</code>, <code>change</code> and <code>button</code>.
     * If an exit configuration is set, a corresponding field exit callback must be registered in the [exitRegistry]{@link documents.sdk.exitRegistry}.
     * @param options {Object} the exit configuration options
     * @param options.type {String} the exit trigger type
     * @param options.image {String} the exit button image, if the <code>type</code> equals <code>button</code>
     * @param options.tooltip {String} the exit button image tooltip, if the <code>type</code> equals <code>button</code>
     * @see [exitRegistry.registerFileFieldExitCallback]{@link documents.sdk.exitRegistry#registerFileFieldExitCallback}
     * @see [exitRegistry.registerSearchFieldExitCallback]{@link documents.sdk.exitRegistry#registerSearchFieldExitCallback}
     * @see [exitRegistry.registerScriptParameterFieldExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterFieldExitCallback}
     */
    setExit(options?: setExit_options): void;

    /**
     * Adds autocomplete to a field. Only works for STRING fields.
     * @param options {Object} the autocomplete config
     * @param options.scriptName {String} the name of the script
     * @param options.minQueryChars {Number} amount of letters after which autocomplete starts
     * @param options.queryDelay {Number} time interval, after which autocomplete starts
     * @param options.maxResults {Number} max amount of autocomplete entries
     * @param options.autoFocusResult {Boolean} focus on the first autocomplete entry
     */
    setAutoComplete(options?: setAutoComplete_options): void;

    /**
     * Returns the tooltip of the field.
     * @returns the field tooltip
     */
    getTooltip(): String;

    /**
     * Sets the tooltip of the field.
     * @param tooltip the field tooltip
     */
    setTooltip(tooltip: String): void;

    /**
     * Returns the font color of the field.
     * @returns the field font color
     */
    getColor(): String;

    /**
     * Sets the font color of the field.
     * @param color the field font color. All color definitions available in CSS3 are supported as parameters.
     */
    setColor(color: String): void;

    /**
     * Returns the background color of the field.
     * @returns the field background color
     */
    getBgColor(): String;

    /**
     * Sets the background color of the field.
     * @param color the field background color. All color definitions available in CSS3 are supported as parameters.
     */
    setBgColor(color: String): void;

    /**
     * Returns the border color of the field.
     * @returns the field border color
     */
    getBorderColor(): String;

    /**
     * Sets the border color of the field.
     * @param color the field border color. All color definitions available in CSS3 are supported as parameters.
     */
    setBorderColor(color: String): void;

    /**
     * Returns the font color of the fields label.
     * @returns the font color of the fields label
     */
    getLabelColor(): String;

    /**
     * Sets the font color of the fields label.
     * @param color the font color of the fields label. All color definitions available in CSS3 are supported as parameters.
     */
    setLabelColor(color: String): void;


}

declare interface setValue_options {
    /**
     * <p>When  <code>true</code> the silent mode is active, no backbone events will be triggered, if the  model changes</p>
     */
    silent: Boolean;
}

declare interface setEnumValues_options {
    /**
     * <p><code>true</code> if the current selected entry should be set as the next selected entry. If it is not included within the enumValues it will be added. Default is <code>false</code>.</p>
     */
    keepSelected: Boolean;
    /**
     * <p><code>true</code> if an empty entry should be added to the enumValues. Default is <code>false</code></p>
     */
    addEmptyEntry: Boolean;
}

declare interface setExit_options {
    /**
     * <p>the exit trigger type</p>
     */
    type: String;
    /**
     * <p>the exit button image, if the <code>type</code> equals <code>button</code></p>
     */
    image: String;
    /**
     * <p>the exit button image tooltip, if the <code>type</code> equals <code>button</code></p>
     */
    tooltip: String;
}

declare interface setAutoComplete_options {
    /**
     * <p>the name of the script</p>
     */
    scriptName: String;
    /**
     * <p>amount of letters after which autocomplete starts</p>
     */
    minQueryChars: Number;
    /**
     * <p>time interval, after which autocomplete starts</p>
     */
    queryDelay: Number;
    /**
     * <p>max amount of autocomplete entries</p>
     */
    maxResults: Number;
    /**
     * <p>focus on the first autocomplete entry</p>
     */
    autoFocusResult: Boolean;
}

/**
 * enumeration of different field types.
 */
declare enum Types {
    CHECKBOX = "CHECKBOX",
    CUSTOM = "CUSTOM",
    DATE = "DATE",
    DOUBLE_LIST = "DOUBLE_LIST",
    EMAIL = "EMAIL",
    ENUM = "ENUM",
    FILING_PLAN = "FILING_PLAN",
    GADGET = "GADGET",
    HISTORY = "HISTORY",
    HTML = "HTML",
    NUMBER = "NUMBER",
    PASSWORD = "PASSWORD",
    RADIO = "RADIO",
    REFERENCE = "REFERENCE",
    SEPARATOR = "SEPARATOR",
    STRING = "STRING",
    TEXT = "TEXT",
    TEXT_FIXED = "TEXT_FIXED",
    TIMESTAMP = "TIMESTAMP",
    URL = "URL",
}

declare class FileFieldModel {
    /**
     * The FileFieldModel represents a file field in a file form and provides various methods to inspect and manipulate the field model data.
     * Every FileFieldModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
     * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
     */
    constructor();

    /**
     * Returns the width of a field.
     * @returns the fields width
     */
    getWidth(): String;

    /**
     * Sets the width of a field.
     * @param width the fields width
     */
    setWidth(width: String): void;

    /**
     * Returns the height of a field.
     * @returns the fields height
     */
    getHeight(): String;

    /**
     * Sets the height of a field.
     * @param height the fields height
     */
    setHeight(height: String): void;

    /**
     * Returns the maximum length of a field.
     * @returns the fields maximum length
     */
    getMaxLength(): String;

    /**
     * Sets the maximum length of a field.
     * @param maxLength the fields maximum length
     */
    setMaxLength(maxLength: String): void;

    /**
     * Returns the id of the field.
     * @returns the field id
     */
    getId(): String;

    /**
     * Returns the technical name of the field.
     * @returns the technical field name
     */
    getName(): String;

    /**
     * Sets the technical name of the field.
     * @param name the technical field name
     */
    setName(name: String): void;

    /**
     * Returns the label of the field.
     * @returns the field label
     */
    getLabel(): String;

    /**
     * Sets the label of the field.
     * @param label the field label
     */
    setLabel(label: String): void;

    /**
     * Returns the type of the field.
     * @returns the field type
     * @see
     */
    getType(): String;

    /**
     * Sets the type of the field.
     * In case of changing a field into a checkbox or a radio-group, the displayed options will be set to a default value. If you want to change them, please use the method {@link documents.sdk.FieldModel#setEnumValues|setEnumValues}.
     * @param type the field type
     * @see
     * @see
     */
    setType(type: FieldModel.Types): void;

    /**
     * Returns if the field is readonly or not.
     * @returns <code>true</code> if the field is readonly, <code>false</code> otherwise
     * @see
     */
    isReadonly(): Boolean;

    /**
     * Sets the field to readonly.
     * @param readonly <code>true</code> for readonly,  <code>false</code> otherwise
     * @see
     */
    setReadonly(readonly: Boolean): void;

    /**
     * Returns if the field is gui readonly or not.
     * @returns <code>true</code> if the field is gui readonly, <code>false</code> otherwise
     * @see
     */
    isGuiReadonly(): Boolean;

    /**
     * Sets the field to gui readonly.
     * @param guiReadonly <code>true</code> for gui readonly,  <code>false</code> otherwise
     * @see
     */
    setGuiReadonly(guiReadonly: Boolean): void;

    /**
     * Returns if the field is mandatory or not.
     * @returns <code>true</code> if the field is mandatory, <code>false</code> otherwise
     */
    isMandatory(): Boolean;

    /**
     * Returns the value(s) of the field.
     * @returns the field value
     * @see
     */
    getValue(): String | String[] | Boolean;

    /**
     * Sets the value(s) of the field.
     * Any matching enum values will be updated automatically.
     * @param value the field value
     * @param options
     * @param options.silent When  <code>true</code> the silent mode is active, no backbone events will be triggered, if the  model changes
     * @see
     */
    setValue(value: String | String[] | Boolean, options?: setValue_options): void;

    /**
     * Returns the optional enum values of the field.
     * @returns the field enum values
     */
    getEnumValues(): Object[];

    /**
     * Sets the optional enum values of the field. Supported input-formats can be viewed in the examples.
     * @param enumValues the field enum values
     * @param options the options passed
     * @param options.keepSelected {Boolean} `true` if the current selected entry should be set as the next selected entry. If it is not included within the enumValues it will be added. Default is `false`.
     * @param options.addEmptyEntry {Boolean} `true` if an empty entry should be added to the enumValues. Default is `false`
     */
    setEnumValues(enumValues: Object | Object[] | String | String[], options?: setEnumValues_options): void;

    /**
     * Returns if the field is in the same line as the preceding field or not.
     * @returns <code>true</code> if the field is in the same line as the preceding field, <code>false</code> otherwise
     */
    isSameLine(): Boolean;

    /**
     * Sets the field to the same line as the preceding field.
     * @param sameLine <code>true</code> for same line as the preceding field,  <code>false</code> otherwise
     */
    setSameLine(sameLine: Boolean): void;

    /**
     * Sets an exit configuration of the field.
     * A trigger type of the exit must always be set. Valid types are <code>focusin</code>, <code>focusout</code>, <code>change</code> and <code>button</code>.
     * If an exit configuration is set, a corresponding field exit callback must be registered in the [exitRegistry]{@link documents.sdk.exitRegistry}.
     * @param options {Object} the exit configuration options
     * @param options.type {String} the exit trigger type
     * @param options.image {String} the exit button image, if the <code>type</code> equals <code>button</code>
     * @param options.tooltip {String} the exit button image tooltip, if the <code>type</code> equals <code>button</code>
     * @see [exitRegistry.registerFileFieldExitCallback]{@link documents.sdk.exitRegistry#registerFileFieldExitCallback}
     * @see [exitRegistry.registerSearchFieldExitCallback]{@link documents.sdk.exitRegistry#registerSearchFieldExitCallback}
     * @see [exitRegistry.registerScriptParameterFieldExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterFieldExitCallback}
     */
    setExit(options?: setExit_options): void;

    /**
     * Adds autocomplete to a field. Only works for STRING fields.
     * @param options {Object} the autocomplete config
     * @param options.scriptName {String} the name of the script
     * @param options.minQueryChars {Number} amount of letters after which autocomplete starts
     * @param options.queryDelay {Number} time interval, after which autocomplete starts
     * @param options.maxResults {Number} max amount of autocomplete entries
     * @param options.autoFocusResult {Boolean} focus on the first autocomplete entry
     */
    setAutoComplete(options?: setAutoComplete_options): void;

    /**
     * Returns the tooltip of the field.
     * @returns the field tooltip
     */
    getTooltip(): String;

    /**
     * Sets the tooltip of the field.
     * @param tooltip the field tooltip
     */
    setTooltip(tooltip: String): void;

    /**
     * Returns the font color of the field.
     * @returns the field font color
     */
    getColor(): String;

    /**
     * Sets the font color of the field.
     * @param color the field font color. All color definitions available in CSS3 are supported as parameters.
     */
    setColor(color: String): void;

    /**
     * Returns the background color of the field.
     * @returns the field background color
     */
    getBgColor(): String;

    /**
     * Sets the background color of the field.
     * @param color the field background color. All color definitions available in CSS3 are supported as parameters.
     */
    setBgColor(color: String): void;

    /**
     * Returns the border color of the field.
     * @returns the field border color
     */
    getBorderColor(): String;

    /**
     * Sets the border color of the field.
     * @param color the field border color. All color definitions available in CSS3 are supported as parameters.
     */
    setBorderColor(color: String): void;

    /**
     * Returns the font color of the fields label.
     * @returns the font color of the fields label
     */
    getLabelColor(): String;

    /**
     * Sets the font color of the fields label.
     * @param color the font color of the fields label. All color definitions available in CSS3 are supported as parameters.
     */
    setLabelColor(color: String): void;


}

declare abstract class FormModel {
    /**
     * The FormModel is the abstract model for forms. It provides various methods to inspect and manipulate the form model data.
     * It should be used as the base model for models containing collections of fields such as FileFormModel or ExtendedSearchFormModel.
     * The initialize function should be overridden, if you plan to use a different Collection than the [Backbone.Collection]{@link http://backbonejs.org/#Collection}.
     * 
     * Every FormModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
     * It contains a Collection of {@link FieldModel|FieldModels} representing the fields.
     * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
     * @see
     */
    constructor();

    /**
     * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all field models containing this form model.
     * @returns [Backbone.Collection]{@link http://backbonejs.org/#Collection} the collection of all field models
     * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
     */
    getFields(): any;

    /**
     * Searches for and returns a field model by its id.
     * @param id the id of the field model to be searched for
     * @returns the field model if it could be found, <code>null</code> otherwise
     */
    getFieldById(id: String): FieldModel;

    /**
     * Searches for and returns an array of all field models by its ids.
     * @param ids the array of all field model ids to be searched for
     * @returns the array of all fields models that could be found
     */
    getFieldsById(ids: String[]): FieldModel[];

    /**
     * Searches for and returns a field model by its name.
     * @param name the name of the field model to be searched for
     * @returns the field model if it could be found, <code>null</code> otherwise
     */
    getFieldByName(name: String): FieldModel;

    /**
     * Searches for and returns an array of all field models by its names.
     * @param names the array of all field model names to be searched for
     * @returns the array of all fields models that could be found
     */
    getFieldsByName(names: String[]): FieldModel[];

    /**
     * Sets the values of multiple fields. A key of the parameter-object defines the field-id and the corresponding value the new value.
     * @param object the objects keys is defines the fields and the values define the values.
     */
    setFieldValuesById(object: Object): void;

    /**
     * Sets the values of multiple fields. A key of the parameter-object defines the field-name and the corresponding value the new value.
     * @param object the objects keys is defines the fields and the values define the values.
     */
    setFieldValuesByName(object: Object): void;

}

declare class FileFormModel {
    /**
     * The FileFormModel is the representing model for file forms. It provides various methods to inspect and manipulate the form model data.
     * Every FileFormModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
     * It contains a collection of {@link FileFieldModel|FileFieldModels} representing the form fields.
     * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
     * @see
     */
    constructor();

    /**
     * Returns the id of the representing file.
     * @returns the id of the representing file
     */
    getFileId(): String;

    /**
     * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all field models containing this form model.
     * @returns [Backbone.Collection]{@link http://backbonejs.org/#Collection} the collection of all field models
     * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
     */
    getFields(): any;

    /**
     * Searches for and returns a field model by its id.
     * @param id the id of the field model to be searched for
     * @returns the field model if it could be found, <code>null</code> otherwise
     */
    getFieldById(id: String): FieldModel;

    /**
     * Searches for and returns an array of all field models by its ids.
     * @param ids the array of all field model ids to be searched for
     * @returns the array of all fields models that could be found
     */
    getFieldsById(ids: String[]): FieldModel[];

    /**
     * Searches for and returns a field model by its name.
     * @param name the name of the field model to be searched for
     * @returns the field model if it could be found, <code>null</code> otherwise
     */
    getFieldByName(name: String): FieldModel;

    /**
     * Searches for and returns an array of all field models by its names.
     * @param names the array of all field model names to be searched for
     * @returns the array of all fields models that could be found
     */
    getFieldsByName(names: String[]): FieldModel[];

    /**
     * Sets the values of multiple fields. A key of the parameter-object defines the field-id and the corresponding value the new value.
     * @param object the objects keys is defines the fields and the values define the values.
     */
    setFieldValuesById(object: Object): void;

    /**
     * Sets the values of multiple fields. A key of the parameter-object defines the field-name and the corresponding value the new value.
     * @param object the objects keys is defines the fields and the values define the values.
     */
    setFieldValuesByName(object: Object): void;

}

declare class ExtendedSearchFormModel {
    /**
     * The ExtendedSearchFormModel is the representing model for extended search forms. It provides various methods to inspect and manipulate the form model data.
     * Every ExtendedSearchFormModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
     * It contains a collection of {@link SearchFieldModel|SearchFieldModels} representing the form fields.
     * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
     * @see
     */
    constructor();

    /**
     * Returns the [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all search-fields within this model.
     * @returns the collection of fields
     */
    getSearchFields(): Backbone.Collection;

    /**
     * Returns the search-field with matching the id.
     * @param id the id of the search-field to be searched
     * @returns the first matching search-field
     */
    getSearchFieldById(id: String): SearchFieldModel;

    /**
     * <Returns an Array of all fields within an extended search filtered by the field-id.
     * @param ids an Array of ids of the search-fields to be searched
     * @returns an Array of matching search-fields
     */
    getSearchFieldsById(ids: String[]): SearchFieldModel[];

    /**
     * Returns the search-field with matching the name.
     * @param name the name of the search-field to be searched
     * @returns the first matching search-field
     */
    getSearchFieldByName(name: String): SearchFieldModel;

    /**
     * Returns an Array of all search-fields within a file filtered by the field-names.
     * @param names an Array of names of the search-fields to be searched
     * @returns an Array of matching search-fields
     */
    getSearchFieldsByName(names: String[]): SearchFieldModel[];

    /**
     * getExtendedSearchId return the id of the representing extended search
     * @returns id
     */
    getExtendedSearchId(): String;

    /**
     * Returns the [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all sort-fields within this model.
     * @returns the collection of fields
     */
    getSortFields(): Backbone.Collection;

    /**
     * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all field models containing this form model.
     * @returns [Backbone.Collection]{@link http://backbonejs.org/#Collection} the collection of all field models
     * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
     */
    getFields(): any;

    /**
     * Searches for and returns a field model by its id.
     * @param id the id of the field model to be searched for
     * @returns the field model if it could be found, <code>null</code> otherwise
     */
    getFieldById(id: String): FieldModel;

    /**
     * Searches for and returns an array of all field models by its ids.
     * @param ids the array of all field model ids to be searched for
     * @returns the array of all fields models that could be found
     */
    getFieldsById(ids: String[]): FieldModel[];

    /**
     * Searches for and returns a field model by its name.
     * @param name the name of the field model to be searched for
     * @returns the field model if it could be found, <code>null</code> otherwise
     */
    getFieldByName(name: String): FieldModel;

    /**
     * Searches for and returns an array of all field models by its names.
     * @param names the array of all field model names to be searched for
     * @returns the array of all fields models that could be found
     */
    getFieldsByName(names: String[]): FieldModel[];

    /**
     * Sets the values of multiple fields. A key of the parameter-object defines the field-id and the corresponding value the new value.
     * @param object the objects keys is defines the fields and the values define the values.
     */
    setFieldValuesById(object: Object): void;

    /**
     * Sets the values of multiple fields. A key of the parameter-object defines the field-name and the corresponding value the new value.
     * @param object the objects keys is defines the fields and the values define the values.
     */
    setFieldValuesByName(object: Object): void;

}

declare class ScriptParameterFormModel {
    /**
     * The ScriptParameterFormModel is the representing model for script parameter forms. It provides various methods to inspect and manipulate the form model data.
     * Every ScriptParameterFormModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
     * It contains a collection of {@link ScriptFieldModel|ScriptFieldModels} representing the form fields.
     * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
     * @see
     */
    constructor();

    /**
     * Returns the name of the associated script.
     * @returns the name of the associated script
     */
    getScriptName(): String;

    /**
     * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all field models containing this form model.
     * @returns [Backbone.Collection]{@link http://backbonejs.org/#Collection} the collection of all field models
     * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
     */
    getFields(): any;

    /**
     * Searches for and returns a field model by its id.
     * @param id the id of the field model to be searched for
     * @returns the field model if it could be found, <code>null</code> otherwise
     */
    getFieldById(id: String): FieldModel;

    /**
     * Searches for and returns an array of all field models by its ids.
     * @param ids the array of all field model ids to be searched for
     * @returns the array of all fields models that could be found
     */
    getFieldsById(ids: String[]): FieldModel[];

    /**
     * Searches for and returns a field model by its name.
     * @param name the name of the field model to be searched for
     * @returns the field model if it could be found, <code>null</code> otherwise
     */
    getFieldByName(name: String): FieldModel;

    /**
     * Searches for and returns an array of all field models by its names.
     * @param names the array of all field model names to be searched for
     * @returns the array of all fields models that could be found
     */
    getFieldsByName(names: String[]): FieldModel[];

    /**
     * Sets the values of multiple fields. A key of the parameter-object defines the field-id and the corresponding value the new value.
     * @param object the objects keys is defines the fields and the values define the values.
     */
    setFieldValuesById(object: Object): void;

    /**
     * Sets the values of multiple fields. A key of the parameter-object defines the field-name and the corresponding value the new value.
     * @param object the objects keys is defines the fields and the values define the values.
     */
    setFieldValuesByName(object: Object): void;

}

declare class GadgetContext {
    /**
     * The GadgetContext provides gadget related functions for the client side scripting
     */
    constructor();

    /**
     * Get the contextData added in the gadget portal script with the function `setContextData`
     */
    getContextData(): any;

    /**
     * Returns the gadget client object **if available**.
     * Currently the following Gadgets have a client object:
     * * **FullCalendar**: `FullCalendar-Object` (jQuery element) is returned
     * * **Chart**: The `Chart.js-Object` is returned,
     * * **Form**: {@link GadgetForm} is returned,
     */
    getClientObject(): Object;

}

declare class GadgetForm {
    /**
     * The gadget client object for gadget forms.
     * Provides gadget form related functions for the client side scripting
     */
    constructor();

    /**
     * Creates a ValidationResult object to be returned by a custom
     * form validator
     * @param result if the validation has failed or succeeded
     * @param errorMessage displayed if the validation failed
     * @param options option object to add additional information
     * @returns object containing result of the validation
     */
    createFormValidatorResult(result: boolean, errorMessage?: String, options?: object): validationResult;

    /**
     * Validate form based on default and custom set validators
     * @returns true if the form is valid and false if the form is invalid
     */
    validateForm(): any;

    /**
     * Returns the current data for every element of the form
     */
    getFormData(): Object;

}

declare class GentableContext {
    /**
     * The GentableContext provides full access to the {@link GentableGridModel GentableGridModel},
     * {@link documents.sdk.gentable.grid.GentableGridColumnModel GentableGridColumnModel} and the
     * {@link documents.sdk.gentable.grid.GentableGridRowModel GentableGridRowModel}. It also provides basic functions like
     * copyRow, moveRow and resetSelection.
     */
    constructor();

    /**
     * Returns a jQuery reference to a div that is rendered above the gentable toolbar that can be filled with custom html.
     * @returns Container that can be modified
     */
    getCustomContainerNorth(): JQuery;

    /**
     * Returns a jQuery reference to a div that is rendered between the gentable toolbar and the gentable that can be filled with custom html.
     * @returns Container that can be modified
     */
    getCustomContainerCenter(): JQuery;

    /**
     * Returns a jQuery reference to a div that is rendered beneath the gentable that can be filled with custom html.
     * @returns Container that can be modified
     */
    getCustomContainerSouth(): JQuery;

    /**
     * Returns a gentable grid model.
     * @returns A gentable grid model
     */
    getGridModel(): GentableGridModel;

}

declare class GentableGridModel {
    constructor();

    /**
     * Returns a backbone collection of all currently selected grid row models.
     * @see [setSelectedRows]{@link GentableGridModel#setSelectedRows}
     * @see [resetSelectedRows]{@link GentableGridModel#resetSelectedRows}
     * @see http://backbonejs.org/#Collection
     */
    getSelectedRows(): GentableGridRowCollection;

    /**
     * Sets the selected grid rows by their row indexes.
     * @param indexes {Number[]} all row indexes to be selected
     * @see [getSelectedRows]{@link GentableGridModel#getSelectedRows}
     * @see [resetSelectedRows]{@link GentableGridModel#resetSelectedRows}
     */
    setSelectedRows(indexes: Number[]): void;

    /**
     * Removes the selected state of all grid rows. After calling this method, none of the grid rows is selected anymore.
     * @see [getSelectedRows]{@link GentableGridModel#getSelectedRows}
     * @see [setSelectedRows]{@link GentableGridModel#setSelectedRows}
     */
    resetSelectedRows(): void;

    /**
     * Sets the active grid row by its row index.
     * @param index the row index to be activated
     * @see [getActiveRow]{@link GentableGridModel#getActiveRow}
     * @see [resetActiveRow]{@link GentableGridModel#resetActiveRow}
     */
    setActiveRow(index: Number): void;

    /**
     * Returns the currently active grid row model.
     * @see [setActiveRow]{@link GentableGridModel#setActiveRow}
     * @see [resetActiveRow]{@link GentableGridModel#resetActiveRow}
     */
    getActiveRow(): GentableGridRowModel;

    /**
     * Removes the active state of all grid rows. After calling this method, none of the grid rows is activated anymore.
     * @see [getActiveRow]{@link GentableGridModel#getActiveRow}
     * @see [setActiveRow]{@link GentableGridModel#setActiveRow}
     */
    resetActiveRow(): void;

    /**
     * Returns the column with the given name.
     * @returns the column with the given name
     * @param name
     */
    getColumn(name: String): GentableGridColumnModel;

    /**
     * Returns the row at the given index.
     * @param index
     */
    getRow(index: Number): GentableGridRowModel;

    /**
     * Adds the given row.
     * @param row values of the row that should be added
     * @param options
     * @param options.index the index where the row should be added
     * @returns
     */
    addRow(row?: Object, options?: addRow_options): GentableGridRowModel;

    /**
     * Removes the row at the given index.
     * @param index
     */
    removeRow(index: Number): void;

    /**
     * Creates a key for the current row.
     */
    createRowKey(): String;

    /**
     * Copies the row from the srcIndex to the dstIndex.
     * @param srcIndex The index of the row that should be copied.
     * @param dstIndex The index where the row should be copied to.
     */
    copyRow(srcIndex: Number, dstIndex: Number): void;

    /**
     * Moves a row from the srcIndex to the dstIndex.
     * @param srcIndex The index of the row that should be moved.
     * @param dstIndex The index where the row should be moved to.
     */
    moveRow(srcIndex: Number, dstIndex: Number): void;

    /**
     * Returns the number of all grid columns.
     */
    columnsSize(): Number;

    /**
     * Returns the number of all grid rows.
     */
    rowsSize(): Number;

    /**
     * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all grid row models.
     * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
     */
    getRows(): any;

    /**
     * Returns a [Backbone.Collection]{@link http://backbonejs.org/#Collection} of all grid column models.
     * @see [Backbone.Collection]{@link http://backbonejs.org/#Collection}
     */
    getColumns(): any;

}

/**
 * 
 * @param documentsContext the <code>DocumentsContext</code> passed in the function
 * @param options the options passed in the function
 * @param options.fileTypeName the technical name of the file type
 * @param options.gentableDefinitionName
 * @param options.row [optional] the current grid row model
 * @param options.originalEvent [optional] the current original dom event
 */
declare type gentableCallback = (documentsContext: DocumentsContext, options: gentableCallback_options)=>void;

declare interface gentableCallback_options {
    /**
     * <p>the technical name of the file type</p>
     */
    fileTypeName: String;
    gentableDefinitionName: String;
    /**
     * <p>[optional] the current grid row model</p>
     */
    row: documents.sdk.gentable.grid.GentableGridRowModel;
    /**
     * <p>[optional] the current original dom event</p>
     */
    originalEvent: String;
}

declare class I18nContext {
    constructor();

    /**
     * Returns a <code>Messages</code> object providing methods to work with values from a common key/value paired messages/properties file.
     * This method tries to find a messages file with the locale currently selected by the logged in user at first. If no such file was found, a file without any specified locale is searched for.
     * @param propertiesFile the name of the messages file, leaving out the <code>_&lt;lang&gt;</code> postfix
     * @returns the <code>Messages</code> object holding all the messages
     * @see Messages
     */
    getMessages(propertiesFile: String): Messages;

}

declare class Messages {
    constructor();

    /**
     * 
     * @param key the key of the message
     * @param defaultValue return value if the key doesn't match any key in the properties file, must be set if placeholders are used
     * @param placeholder replaces {x} tags inside the value, x is an integer greater than 0.
     *        Can be any amount of strings or an array of strings.
     * @returns the message value
     */
    get(key: String, defaultValue?: String, placeholder?: string | string[]): String;

    /**
     * 
     * @returns the message keys
     */
    keys(): string[];

    /**
     * 
     * @param key the key of the message
     * @returns <code>true</code> if the messages contains the key, <code>false</code> otherwise
     */
    contains(key: String): Boolean;

}

declare class UserContext {
    /**
     * The UserContext provides access to information related to the current system user like the used language, login name,
     * accessProfiles and custom properties.
     */
    constructor();

    /**
     * Returns a system user property by its key.
     * User properties can be used to define arbitrary, user related application settings. They are <i>read-only</i> by default. The data type has to be <code>String</code>, e.g. JSON, XML or plain text data.
     * <br>In DOCUMENTS Manager, any user property can be found at the <i>upper</i> properties tab of the user account settings dialog.
     * <br>Notice that this function performs a request against the application server which is called <i>synchronous</i> by default. Thus the JavaScript- and UI thread of the browser will be blocked until the server response has returned.
     * @param key the key of the property
     */
    getProperty(key: String): String;

    /**
     * Returns a custom user property value by its name and type.
     * Custom user properties can be used to persist (i.e. load and store) arbitrary, user related application data across user sessions. The data type has to be <code>String</code>, e.g. JSON, XML or plain text data.
     * <br>In DOCUMENTS Manager, any custom user property can be found at the <i>lower</i> properties tab of the user account settings dialog.
     * <br>Notice that this function performs a request against the application server which is called <i>synchronous</i> by default. Thus the JavaScript- and UI thread of the browser will be blocked until the server response has returned.
     * @param name the name of the property
     * @param type the type of the property
     * @see [setCustomPropertyValue]{@link UserContext#setCustomPropertyValue}
     * @see [removeCustomProperty]{@link UserContext#removeCustomProperty}
     */
    getCustomPropertyValue(name: String, type: String): String;

    /**
     * Sets a custom user property value by its name and type.
     * Custom user properties can be used to persist (i.e. load and store) arbitrary, user related application data across user sessions. The data type has to be <code>String</code>, e.g. JSON, XML or plain text data.
     * <br>In DOCUMENTS Manager, any custom user property can be found at the <i>lower</i> properties tab of the user account settings dialog.
     * <br>Notice that this function performs a request against the application server which is called <i>synchronous</i> by default. Thus the JavaScript- and UI thread of the browser will be blocked until the server response has returned.
     * @param name the name of the property
     * @param type the type of the property
     * @param value the new value of the property
     * @see [getCustomPropertyValue]{@link UserContext#getCustomPropertyValue}
     * @see [removeCustomProperty]{@link UserContext#removeCustomProperty}
     */
    setCustomPropertyValue(name: String, type: String, value: String): String;

    /**
     * Removes a custom user property by its name and type and returns its previous value.
     * Custom user properties can be used to persist (i.e. load and store) arbitrary, user related application data across user sessions. The data type has to be <code>String</code>, e.g. JSON, XML or plain text data.
     * <br>In DOCUMENTS Manager, any custom user property can be found at the <i>lower</i> properties tab of the user account settings dialog.
     * <br>Notice that this function performs a request against the application server which is called <i>synchronous</i> by default. Thus the JavaScript- and UI thread of the browser will be blocked until the server response has returned.
     * @param name the name of the property
     * @param type the type of the property
     * @see [getCustomPropertyValue]{@link UserContext#getCustomPropertyValue}
     * @see [setCustomPropertyValue]{@link UserContext#setCustomPropertyValue}
     */
    removeCustomProperty(name: String, type: String): String;

}

declare abstract class Storage {
    constructor();

    /**
     * Returns the current storage options.
     */
    getOptions(): Object;

    /**
     * Sets the current storage options.
     * @param newOptions the storage options
     * @param newOptions.autoSave <code>true</code> if the autoSave mode is switched on, <code>false</code> otherwise
     */
    setOptions(newOptions: setOptions_newOptions): void;

    /**
     * Puts a new item or replaces an old item into the storage.
     * Alternatively puts multiple items into the storage at once (see example below).
     * @param key the key of the item
     * @param value the value of the item
     */
    set(key: String, value: Object): void;

    /**
     * Returns an item value of the storage by its key.
     * @param key the key of the item
     */
    get(key: String): Boolean | Number | string | object | any;

    /**
     * Deletes an item of the storage by its key.
     * @param key the key of the item
     */
    remove(key: String): void;

    /**
     * Removes all items of the storage at once.
     */
    clear(): void;

    /**
     * Returns whether or not an item exits in the storage by its key.
     * @param key the key of the item
     */
    contains(key: String): Boolean;

    /**
     * Returns a (shallow) copy of the entire storage for JSON serialization.
     * For example this method can be used for persistence, serialization or augmentation before being sent to the server.
     */
    toJSON(): Object;

    /**
     * Returns all the keys of the storage.
     */
    keys(): string[];

    /**
     * Loads and deserializes the storage from the underlying HTML5 WebStorage area.
     */
    load(): void;

    /**
     * Serializes and saves the storage to the underlying HTML5 WebStorage area.
     */
    save(): void;

    /**
     * Erases the underlying HTML5 WebStorage area.
     */
    erase(): void;

}

declare interface setOptions_newOptions {
    /**
     * <p><code>true</code> if the autoSave mode is switched on, <code>false</code> otherwise</p>
     */
    autoSave: Boolean;
}

declare class GentableGridColumnModel {
    constructor();

    /**
     * Returns the key of the current column.
     */
    getName(): String;

    /**
     * Returns the localized label of the current column.
     */
    getLabel(): String;

    /**
     * Returns the data type of the current column.
     */
    getDataType(): String;

    /**
     * Returns the button label of the current column.
     */
    getButtonLabel(): String;

    /**
     * Returns the number format of the current column.
     */
    getNumberFormat(): String;

    /**
     * Returns the tooltip of the current column.
     */
    getTooltip(): String;

    /**
     * Returns the number of decimal places of the current column.
     */
    getDecimalPlaces(): Number;

    /**
     * Checks if the current column is focusable.
     */
    isFocusable(): Boolean;

    /**
     * Checks if the current column is editable.
     */
    isEditable(): Boolean;

    /**
     * Checks if the current column is visible.
     */
    isVisible(): Boolean;

}

declare class GentableGridRowModel {
    constructor();

    /**
     * Returns a (shallow) copy of the entire row for JSON serialization.
     * For example this method can be used for persistence, serialization or augmentation before being sent to the server.
     */
    toJSON(): Object;

    /**
     * Reloads the current row and returns a <code>Promise</code> for the reload process to be completed.
     * Notice that reloading a row implies an full AJAX request/response to/from the server behind the scenes which is always performed <i>asynchronously</i>.
     * As a result, any code following a <code>reload()</code> statement will be executed <i>immediately</i> while not waiting the reload process to be completed.
     * Code can be synchronized with the returned <code>Promise</code> object which lets you provide a callback function that is called when the <code>Promise</code> is fulfilled.
     */
    reload(): Promise;

    /**
     * Returns the current index of the row.
     */
    index(): Number;

    /**
     * Returns if the row is visible or not.
     */
    isVisible(): Boolean;

    /**
     * Returns the value of the given column as a <code>number</code>.
     * If the optional parameters <code>decimalSeparator</code> and <code>groupingSeparator</code> are not set, this method will use localized values by default.
     * @param columnName the name of the column
     * @param decimalSeparator the decimal separator
     * @param groupingSeparator the grouping separator
     */
    getNumber(columnName: String, decimalSeparator?: String, groupingSeparator?: String): Number;

}

declare interface addRow_options {
    /**
     * <p>the index where the row should be added</p>
     */
    index: Number;
}

declare namespace Backbone {
    class Model {
        /**
         * 
         * @see
         */
        constructor();

    }

    class Collection {
        /**
         * 
         * @see
         */
        constructor();

    }

}

declare class SearchFieldModel {
    /**
     * The SearchFieldModel represents a search field in a search form and provides various methods to inspect and manipulate the field model data.
     * Every SearchFieldModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
     * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
     */
    constructor();

    /**
     * Returns the id of the field.
     * @returns the field id
     */
    getId(): String;

    /**
     * Returns the technical name of the field.
     * @returns the technical field name
     */
    getName(): String;

    /**
     * Sets the technical name of the field.
     * @param name the technical field name
     */
    setName(name: String): void;

    /**
     * Returns the label of the field.
     * @returns the field label
     */
    getLabel(): String;

    /**
     * Sets the label of the field.
     * @param label the field label
     */
    setLabel(label: String): void;

    /**
     * Returns the type of the field.
     * @returns the field type
     * @see
     */
    getType(): String;

    /**
     * Sets the type of the field.
     * In case of changing a field into a checkbox or a radio-group, the displayed options will be set to a default value. If you want to change them, please use the method {@link documents.sdk.FieldModel#setEnumValues|setEnumValues}.
     * @param type the field type
     * @see
     * @see
     */
    setType(type: FieldModel.Types): void;

    /**
     * Returns if the field is readonly or not.
     * @returns <code>true</code> if the field is readonly, <code>false</code> otherwise
     * @see
     */
    isReadonly(): Boolean;

    /**
     * Sets the field to readonly.
     * @param readonly <code>true</code> for readonly,  <code>false</code> otherwise
     * @see
     */
    setReadonly(readonly: Boolean): void;

    /**
     * Returns if the field is gui readonly or not.
     * @returns <code>true</code> if the field is gui readonly, <code>false</code> otherwise
     * @see
     */
    isGuiReadonly(): Boolean;

    /**
     * Sets the field to gui readonly.
     * @param guiReadonly <code>true</code> for gui readonly,  <code>false</code> otherwise
     * @see
     */
    setGuiReadonly(guiReadonly: Boolean): void;

    /**
     * Returns if the field is mandatory or not.
     * @returns <code>true</code> if the field is mandatory, <code>false</code> otherwise
     */
    isMandatory(): Boolean;

    /**
     * Returns the value(s) of the field.
     * @returns the field value
     * @see
     */
    getValue(): String | String[] | Boolean;

    /**
     * Sets the value(s) of the field.
     * Any matching enum values will be updated automatically.
     * @param value the field value
     * @param options
     * @param options.silent When  <code>true</code> the silent mode is active, no backbone events will be triggered, if the  model changes
     * @see
     */
    setValue(value: String | String[] | Boolean, options?: setValue_options): void;

    /**
     * Returns the optional enum values of the field.
     * @returns the field enum values
     */
    getEnumValues(): Object[];

    /**
     * Sets the optional enum values of the field. Supported input-formats can be viewed in the examples.
     * @param enumValues the field enum values
     * @param options the options passed
     * @param options.keepSelected {Boolean} `true` if the current selected entry should be set as the next selected entry. If it is not included within the enumValues it will be added. Default is `false`.
     * @param options.addEmptyEntry {Boolean} `true` if an empty entry should be added to the enumValues. Default is `false`
     */
    setEnumValues(enumValues: Object | Object[] | String | String[], options?: setEnumValues_options): void;

    /**
     * Returns if the field is in the same line as the preceding field or not.
     * @returns <code>true</code> if the field is in the same line as the preceding field, <code>false</code> otherwise
     */
    isSameLine(): Boolean;

    /**
     * Sets the field to the same line as the preceding field.
     * @param sameLine <code>true</code> for same line as the preceding field,  <code>false</code> otherwise
     */
    setSameLine(sameLine: Boolean): void;

    /**
     * Sets an exit configuration of the field.
     * A trigger type of the exit must always be set. Valid types are <code>focusin</code>, <code>focusout</code>, <code>change</code> and <code>button</code>.
     * If an exit configuration is set, a corresponding field exit callback must be registered in the [exitRegistry]{@link documents.sdk.exitRegistry}.
     * @param options {Object} the exit configuration options
     * @param options.type {String} the exit trigger type
     * @param options.image {String} the exit button image, if the <code>type</code> equals <code>button</code>
     * @param options.tooltip {String} the exit button image tooltip, if the <code>type</code> equals <code>button</code>
     * @see [exitRegistry.registerFileFieldExitCallback]{@link documents.sdk.exitRegistry#registerFileFieldExitCallback}
     * @see [exitRegistry.registerSearchFieldExitCallback]{@link documents.sdk.exitRegistry#registerSearchFieldExitCallback}
     * @see [exitRegistry.registerScriptParameterFieldExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterFieldExitCallback}
     */
    setExit(options?: setExit_options): void;

    /**
     * Adds autocomplete to a field. Only works for STRING fields.
     * @param options {Object} the autocomplete config
     * @param options.scriptName {String} the name of the script
     * @param options.minQueryChars {Number} amount of letters after which autocomplete starts
     * @param options.queryDelay {Number} time interval, after which autocomplete starts
     * @param options.maxResults {Number} max amount of autocomplete entries
     * @param options.autoFocusResult {Boolean} focus on the first autocomplete entry
     */
    setAutoComplete(options?: setAutoComplete_options): void;

    /**
     * Returns the tooltip of the field.
     * @returns the field tooltip
     */
    getTooltip(): String;

    /**
     * Sets the tooltip of the field.
     * @param tooltip the field tooltip
     */
    setTooltip(tooltip: String): void;

    /**
     * Returns the font color of the field.
     * @returns the field font color
     */
    getColor(): String;

    /**
     * Sets the font color of the field.
     * @param color the field font color. All color definitions available in CSS3 are supported as parameters.
     */
    setColor(color: String): void;

    /**
     * Returns the background color of the field.
     * @returns the field background color
     */
    getBgColor(): String;

    /**
     * Sets the background color of the field.
     * @param color the field background color. All color definitions available in CSS3 are supported as parameters.
     */
    setBgColor(color: String): void;

    /**
     * Returns the border color of the field.
     * @returns the field border color
     */
    getBorderColor(): String;

    /**
     * Sets the border color of the field.
     * @param color the field border color. All color definitions available in CSS3 are supported as parameters.
     */
    setBorderColor(color: String): void;

    /**
     * Returns the font color of the fields label.
     * @returns the font color of the fields label
     */
    getLabelColor(): String;

    /**
     * Sets the font color of the fields label.
     * @param color the font color of the fields label. All color definitions available in CSS3 are supported as parameters.
     */
    setLabelColor(color: String): void;


}

declare class ScriptFieldModel {
    /**
     * The ScriptFieldModel represents a script field in a script parameter form and provides various methods to inspect and manipulate the field model data.
     * Every ScriptFieldModel is a [Backbone.Model]{@link http://backbonejs.org/#Model}.
     * @see [Backbone.Model]{@link http://backbonejs.org/#Model}
     */
    constructor();

    /**
     * Returns the id of the field.
     * @returns the field id
     */
    getId(): String;

    /**
     * Returns the technical name of the field.
     * @returns the technical field name
     */
    getName(): String;

    /**
     * Sets the technical name of the field.
     * @param name the technical field name
     */
    setName(name: String): void;

    /**
     * Returns the label of the field.
     * @returns the field label
     */
    getLabel(): String;

    /**
     * Sets the label of the field.
     * @param label the field label
     */
    setLabel(label: String): void;

    /**
     * Returns the type of the field.
     * @returns the field type
     * @see
     */
    getType(): String;

    /**
     * Sets the type of the field.
     * In case of changing a field into a checkbox or a radio-group, the displayed options will be set to a default value. If you want to change them, please use the method {@link documents.sdk.FieldModel#setEnumValues|setEnumValues}.
     * @param type the field type
     * @see
     * @see
     */
    setType(type: FieldModel.Types): void;

    /**
     * Returns if the field is readonly or not.
     * @returns <code>true</code> if the field is readonly, <code>false</code> otherwise
     * @see
     */
    isReadonly(): Boolean;

    /**
     * Sets the field to readonly.
     * @param readonly <code>true</code> for readonly,  <code>false</code> otherwise
     * @see
     */
    setReadonly(readonly: Boolean): void;

    /**
     * Returns if the field is gui readonly or not.
     * @returns <code>true</code> if the field is gui readonly, <code>false</code> otherwise
     * @see
     */
    isGuiReadonly(): Boolean;

    /**
     * Sets the field to gui readonly.
     * @param guiReadonly <code>true</code> for gui readonly,  <code>false</code> otherwise
     * @see
     */
    setGuiReadonly(guiReadonly: Boolean): void;

    /**
     * Returns if the field is mandatory or not.
     * @returns <code>true</code> if the field is mandatory, <code>false</code> otherwise
     */
    isMandatory(): Boolean;

    /**
     * Returns the value(s) of the field.
     * @returns the field value
     * @see
     */
    getValue(): String | String[] | Boolean;

    /**
     * Sets the value(s) of the field.
     * Any matching enum values will be updated automatically.
     * @param value the field value
     * @param options
     * @param options.silent When  <code>true</code> the silent mode is active, no backbone events will be triggered, if the  model changes
     * @see
     */
    setValue(value: String | String[] | Boolean, options?: setValue_options): void;

    /**
     * Returns the optional enum values of the field.
     * @returns the field enum values
     */
    getEnumValues(): Object[];

    /**
     * Sets the optional enum values of the field. Supported input-formats can be viewed in the examples.
     * @param enumValues the field enum values
     * @param options the options passed
     * @param options.keepSelected {Boolean} `true` if the current selected entry should be set as the next selected entry. If it is not included within the enumValues it will be added. Default is `false`.
     * @param options.addEmptyEntry {Boolean} `true` if an empty entry should be added to the enumValues. Default is `false`
     */
    setEnumValues(enumValues: Object | Object[] | String | String[], options?: setEnumValues_options): void;

    /**
     * Returns if the field is in the same line as the preceding field or not.
     * @returns <code>true</code> if the field is in the same line as the preceding field, <code>false</code> otherwise
     */
    isSameLine(): Boolean;

    /**
     * Sets the field to the same line as the preceding field.
     * @param sameLine <code>true</code> for same line as the preceding field,  <code>false</code> otherwise
     */
    setSameLine(sameLine: Boolean): void;

    /**
     * Sets an exit configuration of the field.
     * A trigger type of the exit must always be set. Valid types are <code>focusin</code>, <code>focusout</code>, <code>change</code> and <code>button</code>.
     * If an exit configuration is set, a corresponding field exit callback must be registered in the [exitRegistry]{@link documents.sdk.exitRegistry}.
     * @param options {Object} the exit configuration options
     * @param options.type {String} the exit trigger type
     * @param options.image {String} the exit button image, if the <code>type</code> equals <code>button</code>
     * @param options.tooltip {String} the exit button image tooltip, if the <code>type</code> equals <code>button</code>
     * @see [exitRegistry.registerFileFieldExitCallback]{@link documents.sdk.exitRegistry#registerFileFieldExitCallback}
     * @see [exitRegistry.registerSearchFieldExitCallback]{@link documents.sdk.exitRegistry#registerSearchFieldExitCallback}
     * @see [exitRegistry.registerScriptParameterFieldExitCallback]{@link documents.sdk.exitRegistry#registerScriptParameterFieldExitCallback}
     */
    setExit(options?: setExit_options): void;

    /**
     * Adds autocomplete to a field. Only works for STRING fields.
     * @param options {Object} the autocomplete config
     * @param options.scriptName {String} the name of the script
     * @param options.minQueryChars {Number} amount of letters after which autocomplete starts
     * @param options.queryDelay {Number} time interval, after which autocomplete starts
     * @param options.maxResults {Number} max amount of autocomplete entries
     * @param options.autoFocusResult {Boolean} focus on the first autocomplete entry
     */
    setAutoComplete(options?: setAutoComplete_options): void;

    /**
     * Returns the tooltip of the field.
     * @returns the field tooltip
     */
    getTooltip(): String;

    /**
     * Sets the tooltip of the field.
     * @param tooltip the field tooltip
     */
    setTooltip(tooltip: String): void;

    /**
     * Returns the font color of the field.
     * @returns the field font color
     */
    getColor(): String;

    /**
     * Sets the font color of the field.
     * @param color the field font color. All color definitions available in CSS3 are supported as parameters.
     */
    setColor(color: String): void;

    /**
     * Returns the background color of the field.
     * @returns the field background color
     */
    getBgColor(): String;

    /**
     * Sets the background color of the field.
     * @param color the field background color. All color definitions available in CSS3 are supported as parameters.
     */
    setBgColor(color: String): void;

    /**
     * Returns the border color of the field.
     * @returns the field border color
     */
    getBorderColor(): String;

    /**
     * Sets the border color of the field.
     * @param color the field border color. All color definitions available in CSS3 are supported as parameters.
     */
    setBorderColor(color: String): void;

    /**
     * Returns the font color of the fields label.
     * @returns the font color of the fields label
     */
    getLabelColor(): String;

    /**
     * Sets the font color of the fields label.
     * @param color the font color of the fields label. All color definitions available in CSS3 are supported as parameters.
     */
    setLabelColor(color: String): void;


}

declare class SessionStorage {
    /**
     * The SessionStorage is a HTML5 WebStorage based storage area that has the ability to store user-defined key/value paired items.
     * The storage remains available for the duration of a user session until logout, including any page reloads.
     * Opening a new browser tab or window will cause a new storage to be initiated.
     * While the item keys always have to be of type <code>String</code>, the item values are allowed to be of type <code>Boolean</code>, <code>Number</code>, <code>String</code>, <code>Object</code> (literal) or <code>Array</code> (literal).
     * @see [LocalStorage]{@link LocalStorage}
     */
    constructor();

    /**
     * Puts a new item or replaces an old item into the storage.
     * Alternatively puts multiple items into the storage at once (see example below).
     * @param key the key of the item
     * @param value the value of the item
     */
    set(key: String, value: Object): void;

    /**
     * Returns an item value of the storage by its key.
     * @param key the key of the item
     */
    get(key: String): Boolean | Number | string | object | any;

    /**
     * Deletes an item of the storage by its key.
     * @param key the key of the item
     */
    remove(key: String): void;

    /**
     * Removes all items of the storage at once.
     */
    clear(): void;

    /**
     * Returns whether or not an item exits in the storage by its key.
     * @param key the key of the item
     */
    contains(key: String): Boolean;

    /**
     * Returns a (shallow) copy of the entire storage for JSON serialization.
     * For example this method can be used for persistence, serialization or augmentation before being sent to the server.
     */
    toJSON(): Object;

    /**
     * Returns all the keys of the storage.
     */
    keys(): string[];

    /**
     * Loads and deserializes the storage from the underlying HTML5 WebStorage area.
     */
    load(): void;

    /**
     * Serializes and saves the storage to the underlying HTML5 WebStorage area.
     */
    save(): void;

    /**
     * Erases the underlying HTML5 WebStorage area.
     */
    erase(): void;

}

declare class LocalStorage {
    /**
     * The LocalStorage is a HTML5 WebStorage based storage area that has the ability to store user-defined key/value paired items.
     * The storage remains available after the duration of a user session and even when the browser is closed and reopened.
     * While the item keys always have to be of type <code>String</code>, the item values are allowed to be of type <code>Boolean</code>, <code>Number</code>, <code>String</code>, <code>Object</code> (literal) or <code>Array</code> (literal).
     * @see [SessionStorage]{@link SessionStorage}
     */
    constructor();

    /**
     * Puts a new item or replaces an old item into the storage.
     * Alternatively puts multiple items into the storage at once (see example below).
     * @param key the key of the item
     * @param value the value of the item
     */
    set(key: String, value: Object): void;

    /**
     * Returns an item value of the storage by its key.
     * @param key the key of the item
     */
    get(key: String): Boolean | Number | string | object | any;

    /**
     * Deletes an item of the storage by its key.
     * @param key the key of the item
     */
    remove(key: String): void;

    /**
     * Removes all items of the storage at once.
     */
    clear(): void;

    /**
     * Returns whether or not an item exits in the storage by its key.
     * @param key the key of the item
     */
    contains(key: String): Boolean;

    /**
     * Returns a (shallow) copy of the entire storage for JSON serialization.
     * For example this method can be used for persistence, serialization or augmentation before being sent to the server.
     */
    toJSON(): Object;

    /**
     * Returns all the keys of the storage.
     */
    keys(): string[];

    /**
     * Loads and deserializes the storage from the underlying HTML5 WebStorage area.
     */
    load(): void;

    /**
     * Serializes and saves the storage to the underlying HTML5 WebStorage area.
     */
    save(): void;

    /**
     * Erases the underlying HTML5 WebStorage area.
     */
    erase(): void;

}

