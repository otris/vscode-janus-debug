

declare namespace Documents {
	/**
	 * The AccessProfile class has been added to the DOCUMENTS PortalScripting API to gain full access to the DOCUMENTS access profiles by scripting means. 
	 * 
	 * A SystemUser can be assigned to an AccessProfile. At the filetype it is possible to define several rights depending on the AccessProfile. You can get an AccessProfile object by different methods like Context::findAccessProfile(String ProfileName) or from the AccessProfileIterator. ... 
	 */
	export interface AccessProfile {
	/**
	 * The technical name of the AccessProfile. 
	 * 
	 * ... ... ... 
	 */
	name: string;
	/**
	 * Access to the property cache of the AccessProfile. 
	 * 
	 * ... ... ... ... 
	 */
	propCache: Documents.PropertyCache;
	/**
	 * Creates a new CustomProperty for the AccessProfile. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof AccessProfile
	* @param {string} name
	* @param {string} type
	* @param {string} value
	* @returns {Documents.CustomProperty}
	**/
	addCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
	/**
	 * Get the String value of an attribute of the AccessProfile. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof AccessProfile
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * Get a CustomPropertyIterator with custom properties of the current AccessProfile. 
	 * 
	 * ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof AccessProfile
	* @param {string} nameFilter
	* @param {string} typeFilter
	* @returns {Documents.CustomPropertyIterator}
	**/
	getCustomProperties(nameFilter?: string, typeFilter?: string): Documents.CustomPropertyIterator;
	/**
	 * If you call a method at an AccessProfile object and an error occurred, you can get the error description with this function. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof AccessProfile
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Returns the object-id. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof AccessProfile
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getOID(oidLow?: boolean): string;
	/**
	 * Retrieve a list of all SystemUser which are assigned to the current AccessProfile. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof AccessProfile
	* @returns {Documents.SystemUserIterator}
	**/
	getSystemUsers(): Documents.SystemUserIterator;
	/**
	 * Set the String value of an attribute of the AccessProfile to the desired value. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof AccessProfile
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	/**
	 * Creates a new CustomProperty or modifies a CustomProperty according the name and type for the AccessProfile. 
	 * 
	 * This method creates or modifies a unique CustomProperty for the AccessProfile. The combination of the name and the type make the CustomProperty unique for the AccessProfile. ... ... ... ... ... ... 
	 */
	/**
	* @memberof AccessProfile
	* @param {string} name
	* @param {string} type
	* @param {string} value
	* @returns {Documents.CustomProperty}
	**/
	setOrAddCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
	}
}

declare class AccessProfile implements Documents.AccessProfile {
	name: string;
	propCache: Documents.PropertyCache;
	addCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
	getAttribute(attribute: string): string;
	getCustomProperties(nameFilter?: string, typeFilter?: string): Documents.CustomPropertyIterator;
	getLastError(): string;
	getOID(oidLow?: boolean): string;
	getSystemUsers(): Documents.SystemUserIterator;
	constructor(nameAccessProfile: string);
	setAttribute(attribute: string, value: string): boolean;
	setOrAddCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
}



declare namespace Documents {
	/**
	 * The AccessProfileIterator class has been added to the DOCUMENTS PortalScripting API to gain full access to the DOCUMENTS access profiles by scripting means. 
	 * 
	 * The objects of this class represent lists of AccessProfile objects and allow to loop through such a list of profiles. The following methods return an AccessProfileIterator: Context::getAccessProfiles(), SystemUser::getAccessProfiles(). ... ... 
	 */
	export interface AccessProfileIterator {
	/**
	 * Retrieve the first AccessProfile object in the AccessProfileIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof AccessProfileIterator
	* @returns {Documents.AccessProfile}
	**/
	first(): Documents.AccessProfile;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof AccessProfileIterator
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Retrieve the next AccessProfile object in the AccessProfileIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof AccessProfileIterator
	* @returns {Documents.AccessProfile}
	**/
	next(): Documents.AccessProfile;
	/**
	 * Get the amount of AccessProfile objects in the AccessProfileIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof AccessProfileIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class AccessProfileIterator implements Documents.AccessProfileIterator {
	first(): Documents.AccessProfile;
	getLastError(): string;
	next(): Documents.AccessProfile;
	size(): number;
}



declare namespace Documents {
	/**
	 * The ArchiveConnection class allows low level access to the EAS Interface, EBIS and the EASY ENTERPRISE XML-Server. 
	 */
	export interface ArchiveConnection {
	/**
	 * String value containing the version of the archive interface. 
	 * 
	 * ... ... 
	 */
	id: string;
	/**
	 * Download an attachment from the XML-Server. 
	 * 
	 * With this method you can download an attachment from the EASYWARE ENTERPRISE archive using the XML-Server. The method returns an object of the class ArchiveConnectionBlob. This object allows you to access the attachment. If the method fails the return value is NULL. You can retrieve the error message by executing ArchiveConnection.getLastError(). ... ... ... ... ... 
	 */
	/**
	* @memberof ArchiveConnection
	* @param {string} fileKey
	* @param {string} docKey
	* @returns {Documents.ArchiveConnectionBlob}
	**/
	downloadBlob(fileKey: string, docKey: string): Documents.ArchiveConnectionBlob;
	/**
	 * Download multiple attachments from the XML-Server. 
	 * 
	 * This method allows downloading multiple attachments from the EASYWARE ENTERPRISE archive using the XML-Server. The method returns an object of the class ArchiveConnectionBlobIterator. This object allows you to access the attachments. If the method fails the return value is NULL. You can retrieve the error message by executing ArchiveConnection.getLastError(). ... ... ... ... ... 
	 */
	/**
	* @memberof ArchiveConnection
	* @param {string} fileKey
	* @param {string} docKey
	* @returns {Documents.ArchiveConnectionBlobIterator}
	**/
	downloadBlobs(fileKey: string, docKey: string): Documents.ArchiveConnectionBlobIterator;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveConnection
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Upload an attachment to the XML-Server. 
	 */
	/**
	* @memberof ArchiveConnection
	* @param {any} doc
	* @param {string} blobreference
	* @returns {boolean}
	**/
	putBlob(doc: Documents.Document, blobreference: string): boolean;
	/**
	 * Sends a query EQL to the EE.x XML-Server and returns the response XML. 
	 * 
	 * With this method you can send a query EQL to the XML-Server of EASY ENTERPRISE.x If the method succeed the return value is the response-xml, otherwise it returns NULL. If the value is NULL you can retrieve the error message by executing ArchiveConnection.getLastError()... ... ... ... ... 
	 */
	/**
	* @memberof ArchiveConnection
	* @param {string} eql
	* @param {number} wantedHits
	* @param {number} maxHits
	* @returns {string}
	**/
	queryRawEEx(eql: string, wantedHits?: number, maxHits?: number): string;
	/**
	 * Sends a request to the EBIS interface and returns the response. 
	 * 
	 * With this method you can send a GET or a POST request to an EBIS interface. If the request succeeds, the return value is the HTTP-content of the response. Otherwise the function returns an empty String. Call ArchiveConnection.getLastError() subsequently to test for eventual errors. If the interface reports an error, it will be prefixed with "[EBIS] ". ... ... ... ... ... ... 
	 */
	/**
	* @memberof ArchiveConnection
	* @param {string} resourceIdentifier
	* @param {string} postData
	* @param {string []} extraHeaders
	* @returns {string}
	**/
	sendEbisRequest(resourceIdentifier: string, postData?: string, extraHeaders?: string []): string;
	/**
	 * Sends a request to the ArchiveConnection and returns the response XML. 
	 * 
	 * With this method you can send a request to the XML-Server of EASY ENTERPRISE. If the method succeeds the return value is the response-xml, otherwise it returns NULL. If the value is NULL you can retrieve the error message by executing ArchiveConnection.getLastError()... ... ... ... ... 
	 */
	/**
	* @memberof ArchiveConnection
	* @param {string} request
	* @returns {string}
	**/
	sendRequest(request: string): string;
	}
}

declare class ArchiveConnection implements Documents.ArchiveConnection {
	id: string;
	downloadBlob(fileKey: string, docKey: string): Documents.ArchiveConnectionBlob;
	downloadBlobs(fileKey: string, docKey: string): Documents.ArchiveConnectionBlobIterator;
	getLastError(): string;
	putBlob(doc: Documents.Document, blobreference: string): boolean;
	queryRawEEx(eql: string, wantedHits?: number, maxHits?: number): string;
	sendEbisRequest(resourceIdentifier: string, postData?: string, extraHeaders?: string []): string;
	sendRequest(request: string): string;
}



declare namespace Documents {
	/**
	 * The ArchiveConnectionBlob class provides access to each single attachment of files in the archive. 
	 * 
	 * This class holds data like name, extension, size etc. of attachments in the archive. The existance of an object means, that an attachment exists in the archive. If you want to access the attachment (blob) itself in the PortalServer, you have to download the attachment from the archive with the ArchiveConnectionBlob.download() method. Then the attachment will be transferred to the PortalServer machine (localPath). ... ... ... 
	 */
	export interface ArchiveConnectionBlob {
	/**
	 * Integer containing the filesize of an attachment in the archive. 
	 */
	bytes: number;
	/**
	 * String containing the key of the attachment in the archive. 
	 * 
	 * ... 
	 */
	docKey: string;
	/**
	 * Boolean that indicates whether an attachment of the archive is locally available at the PortalServer. 
	 * 
	 * If the attachment in the archive is locally available at the PortalServer's file system, this value is true.
	 */
	downloaded: boolean;
	/**
	 * String containing the key of the file the attachment belongs to in the archive. 
	 * 
	 * ... 
	 */
	fileKey: string;
	/**
	 * String with the local path to the attachment (blob). 
	 * 
	 * This path is only available if the attribute ArchiveConnectionBlob.downloaded is true
	 */
	localPath: string;
	/**
	 * String containing the mime-type of an attachment in the archive. 
	 */
	mimeType: string;
	/**
	 * String containing the name of the attachment in the archive. 
	 * 
	 * ... 
	 */
	name: string;
	/**
	 * String containing the filesize of an attachment in the archive. 
	 */
	size: string;
	/**
	 * Download the attachment to the PortalServer's machine (localPath) 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof ArchiveConnectionBlob
	* @returns {boolean}
	**/
	download(): boolean;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveConnectionBlob
	* @returns {string}
	**/
	getLastError(): string;
	}
}

declare class ArchiveConnectionBlob implements Documents.ArchiveConnectionBlob {
	bytes: number;
	docKey: string;
	downloaded: boolean;
	fileKey: string;
	localPath: string;
	mimeType: string;
	name: string;
	size: string;
	download(): boolean;
	getLastError(): string;
}



declare namespace Documents {
	/**
	 * The ArchiveConnectionBlobIterator class is an iterator that holds a list of objects of the class ArchiveConnectionBlob. 
	 * 
	 * You may access ArchiveConnectionBlobIterator objects by the ArchiveConnection.downloadBlobs() method described in the ArchiceConnection chapter. ... ... 
	 */
	export interface ArchiveConnectionBlobIterator {
	/**
	 * Retrieve the first ArchiveConnectionBlob object in the ArchiveConnectionBlobIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveConnectionBlobIterator
	* @returns {Documents.ArchiveConnectionBlob}
	**/
	first(): Documents.ArchiveConnectionBlob;
	/**
	 * Retrieve the next ArchiveConnectionBlob object in the ArchiveConnectionBlobIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveConnectionBlobIterator
	* @returns {Documents.ArchiveConnectionBlob}
	**/
	next(): Documents.ArchiveConnectionBlob;
	/**
	 * Get the amount of ArchiveConnectionBlob objects in the ArchiveConnectionBlobIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveConnectionBlobIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class ArchiveConnectionBlobIterator implements Documents.ArchiveConnectionBlobIterator {
	first(): Documents.ArchiveConnectionBlob;
	next(): Documents.ArchiveConnectionBlob;
	size(): number;
}



declare namespace Documents {
	/**
	 * The ArchiveFileResultset class supports basic functions to loop through a list of ArchiveFile objects. 
	 */
	export interface ArchiveFileResultset {
	/**
	 * Retrieve the first DocFile object in the ArchiveFileResultset. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveFileResultset
	* @returns {Documents.DocFile}
	**/
	first(): Documents.DocFile;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof ArchiveFileResultset
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Retrieve the last DocFile object in the ArchiveFileResultset. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveFileResultset
	* @returns {Documents.DocFile}
	**/
	last(): Documents.DocFile;
	/**
	 * Retrieve the next DocFile object in the ArchiveFileResultset. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveFileResultset
	* @returns {Documents.DocFile}
	**/
	next(): Documents.DocFile;
	/**
	 * Get the amount of DocFile objects in the ArchiveFileResultset. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveFileResultset
	* @returns {number}
	**/
	size(): number;
	}
}

declare class ArchiveFileResultset implements Documents.ArchiveFileResultset {
	constructor(archiveKey: string, filter: string, sortOrder: string, hitlist: string, unlimitedHits?: boolean);
	first(): Documents.DocFile;
	getLastError(): string;
	last(): Documents.DocFile;
	next(): Documents.DocFile;
	size(): number;
}



declare namespace Documents {
	/**
	 * The ArchiveServer class has been added to the DOCUMENTS PortalScripting API to gain full access to the DOCUMENTS ArchiveServer by scripting means. 
	 * 
	 * ... 
	 */
	export interface ArchiveServer {
	/**
	 * The technical name of the ArchiveServer. 
	 * 
	 * ... ... 
	 */
	name: string;
	/**
	 * Retrieve the archive connection object for EAS, EBIS or EASY Enterprise XML-Server. 
	 * 
	 * The ArchiveConnection object can be used for low level call directly on the archive interface. ... ... 
	 */
	/**
	* @memberof ArchiveServer
	* @returns {Documents.ArchiveConnection}
	**/
	getArchiveConnection(): Documents.ArchiveConnection;
	/**
	 * Get the String value of an attribute of the ArchiveServer. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof ArchiveServer
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * If you call a method at an ArchiveServer object and an error occurred, you can get the error description with this function. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveServer
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Returns the object-id. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof ArchiveServer
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getOID(oidLow?: boolean): string;
	/**
	 * Set the String value of an attribute of the ArchiveServer to the desired value. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof ArchiveServer
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	/**
	 * After changes on the ArchiveServer with scripting methods, it is necessary to submit them to make them immediately valid. 
	 * 
	 * The settings of the ArchiveServer will be cached in a connection pool to the archive system. The pool does not recognize changes in the ArchiveServer object automatically, therefore it is necessary to call this method after all.
	 */
	/**
	* @memberof ArchiveServer
	* @returns {void}
	**/
	submitChanges(): void;
	}
}

declare class ArchiveServer implements Documents.ArchiveServer {
	name: string;
	getArchiveConnection(): Documents.ArchiveConnection;
	getAttribute(attribute: string): string;
	getLastError(): string;
	getOID(oidLow?: boolean): string;
	setAttribute(attribute: string, value: string): boolean;
	submitChanges(): void;
}



declare namespace Documents {
	/**
	 * The ArchiveServerIterator class has been added to the DOCUMENTS PortalScripting API to gain full access to the DOCUMENTS ArchiveSerevrby scripting means. 
	 * 
	 * ... 
	 */
	export interface ArchiveServerIterator {
	/**
	 * Retrieve the first ArchiveServer object in the ArchiveServerIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveServerIterator
	* @returns {Documents.AccessProfile}
	**/
	first(): Documents.AccessProfile;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveServerIterator
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Retrieve the next ArchiveServer object in the ArchiveServerIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveServerIterator
	* @returns {Documents.AccessProfile}
	**/
	next(): Documents.AccessProfile;
	/**
	 * Get the amount of ArchiveServer objects in the ArchiveServerIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ArchiveServerIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class ArchiveServerIterator implements Documents.ArchiveServerIterator {
	first(): Documents.AccessProfile;
	getLastError(): string;
	next(): Documents.AccessProfile;
	size(): number;
}



declare namespace Documents {
	/**
	 * The ArchivingDescription class has been added to the DOCUMENTS PortalScripting API to improve the archiving process of DOCUMENTS files by scripting means. 
	 * 
	 * For instance this allows to use different target archives for each file as well as to influence the archiving process by the file's contents itself. The ArchivingDescription object can only be used as parameter for the method DocFile::archive(ArchivingDescription)... ... ... ... 
	 */
	export interface ArchivingDescription {
	/**
	 * Boolean value whether to archive the monitor of the file. 
	 * 
	 * Like on the filetype in the Portal Client you may decide whether you want to archive the monitor of the file along with the file. If so, the file's monitor will be transformed to a HTML file named monitor.html, and it will be part of the archived file in the desired target archive. ... ... ... ... 
	 */
	archiveMonitor: boolean;
	/**
	 * String containing the name of the archive server in a multi archive server environment. 
	 */
	archiveServer: string;
	/**
	 * Boolean value whether to archive the status of the file. 
	 * 
	 * Like on the filetype in the Portal Client you may decide whether you want to archive the status of the file along with the file. If so, the file's status will be transformed to a HTML file named status.html, and it will be part of the archived file in the desired target archive. ... ... ... ... 
	 */
	archiveStatus: boolean;
	/**
	 * String containing the complete address of the target archive for archiving to EE.i. 
	 * 
	 * You need to define the target archive including the "Storageplace". ... ... ... 
	 */
	targetArchive: string;
	/**
	 * String containing the complete address of the target schema used for archiving to EE.x. 
	 * 
	 * You need to define the target schema you want to archive into. ... ... ... 
	 */
	targetSchema: string;
	/**
	 * String containing the complete address of the target view used for archiving to EE.x. 
	 * 
	 * You need to define the target view (write pool) you want to archive into. ... ... ... 
	 */
	targetView: string;
	/**
	 * Boolean value whether to use the versioning technique in the archive. 
	 * 
	 * If the DocFile has already been archived and if you define this attribute to be true, a new version of the archive file will be created otherwise a independent new file in the archive will be created. ... ... ... ... 
	 */
	versioning: boolean;
	/**
	 * flag an additional (document) register to be archived with the file. 
	 * 
	 * You may add the technical names of different document registers to an internal list of your ArchivingDescription object. This allows for example to archive only part of your documents of your DocFile. ... ... ... ... ... 
	 */
	/**
	* @memberof ArchivingDescription
	* @param {string} registerName
	* @returns {void}
	**/
	addRegister(registerName: string): void;
	}
}

declare class ArchivingDescription implements Documents.ArchivingDescription {
	archiveMonitor: boolean;
	archiveServer: string;
	archiveStatus: boolean;
	targetArchive: string;
	targetSchema: string;
	targetView: string;
	versioning: boolean;
	addRegister(registerName: string): void;
	constructor();
}



declare namespace Documents {
	/**
	 * The Context class is the basic anchor for the most important attributes and methods to customize DOCUMENTS through PortalScripting. 
	 * 
	 * There is exactly ONE implicit object of the class Context which is named context. The implicit object context is the root object in any script. With the context object you are able to access to the different DOCUMENTS objects like DocFile, Folder etc. Some of the attributes are only available under certain conditions. It depends on the execution context of the PortalScript, whether a certain attribute is accessible or not. For example, context.selectedFiles is available in a folder userdefined action script, but not in a script used as a signal exit. ... 
	 */
	export interface Context {
	/**
	 * Id of the client / thread which is the execution context of the script. 
	 * 
	 * This property is helpful to identify the clients at scripts running concurrently (for debugging purposes). ... ... ... ... 
	 */
	clientId: string;
	/**
	 * Login of the user who has triggered the script execution. 
	 * 
	 * If the script is running e.g. as action in the workflow the user is the logged in user, who has initiated the action. ... ... ... ... 
	 */
	currentUser: string;
	/**
	 * Document object representing the current document that the script is executed at. 
	 * 
	 * ... ... ... ... 
	 */
	document: Documents.Document;
	/**
	 * Error message text to be returned by the script. 
	 * 
	 * The error message will be displayed as Javascript alert box in the web client if the script is called in context of a web client. ... ... ... ... 
	 */
	errorMessage: string;
	/**
	 * Event which triggered the script execution. 
	 * 
	 * According to the context where the portal script has been called this property contains a key name for this event. 
	 * 
	 * 
	 * The following events are available: ... ... ... ... ... 
	 */
	event: string;
	/**
	 * DocFile object representing the current file that the script is executed at. 
	 * 
	 * ... ... ... ... 
	 */
	file: FileTypeMapper[keyof FileTypeMapper];
	/**
	 * Technical name of the filetype of the file which is the execution context of the script. 
	 * 
	 * This property contains the technical name of the filetype of the file which is the execution context of the script. ... ... ... ... ... 
	 */
	fileType: string;
	/**
	 * FileResultset with all files of a folder. 
	 * 
	 * This property allows to retrieve a list of all files of a folder if this script is run as user defined action at the folder. You can then iterate through this list for further use of the distinct files.
	 * ... ... ... ... 
	 */
	folderFiles: Documents.FileResultset;
	/**
	 * Technical name of the folder the script is called from. 
	 * 
	 * This property contains the technical name of the folder which is the execution context of the script. ... ... ... ... 
	 */
	folderName: string;
	/**
	 * Register object representing the current register that the script is executed at. 
	 * 
	 * ... ... ... ... 
	 */
	register: Documents.Register;
	/**
	 * Type of the return value that the script returns. 
	 * 
	 * User defined actions attached to a file or a folder allow to influence the behaviour of the Web-Client. As soon as you define a return type you explicitely have to return a value. 
	 * 
	 * 
	 * The following types of return values are available: ... ... ... ... ... ... ... 
	 */
	returnType: string;
	/**
	 * Name of the executed script. 
	 * 
	 * ... ... ... ... 
	 */
	scriptName: string;
	/**
	 * Iterator with the selected archive files of a folder. 
	 * 
	 * This property allows to retrieve a list of the selected archive files of a folder if this script is run as user defined action at the folder. You can then iterate through this list for further use of the distinct files.
	 * ... ... ... ... 
	 */
	selectedArchiveFiles: Documents.ArchiveFileResultset;
	/**
	 * Array with the keys of the selected archive files of a folder. 
	 * 
	 * This property allows to retrieve an array with the keys of the selected archive files of a folder if this script is run as user defined action at the folder. ... ... ... ... 
	 */
	selectedArchiveKeys: Array<any>;
	/**
	 * DocumentIterator with the selected Documents (attachments) of the current document register. 
	 * 
	 * This property allows to retrieve a list of all selected Documents of a register if this script is run as user defined action at the register. ... ... ... ... 
	 */
	selectedDocuments: Documents.DocumentIterator;
	/**
	 * Iterator with the selected files of a folder. 
	 * 
	 * This property allows to retrieve a list of the selected files of a folder if this script is run as user defined action at the folder. You can then iterate through this list for further use of the distinct files.
	 * ... ... ... ... 
	 */
	selectedFiles: Documents.FileResultset;
	/**
	 * Script source code of the script after including other scripts by the #import rule. 
	 * 
	 * This property is useful for debugging purposes, if you need to have a look for a certain line of code to find an error, but the script contains other imported sub scripts which mangle the line numbering. ... ... ... ... 
	 */
	sourceCode: string;
	/**
	 * Id of the locking WorkflowStep for the user for the current file. 
	 * 
	 * ... ... ... ... 
	 */
	workflowActionId: string;
	/**
	 * Name of the locking WorkflowStep for the user for the current file. 
	 * 
	 * ... ... ... ... 
	 */
	workflowActionName: string;
	/**
	 * Id of the ControlFlow the current file currently passes. 
	 * 
	 * ... ... ... ... 
	 */
	workflowControlFlowId: string;
	/**
	 * Name of the ControlFlow the current file currently passes. 
	 * 
	 * ... ... ... ... 
	 */
	workflowControlFlowName: string;
	/**
	 * Returns the current workflowstep if the script is run in context of a workflow. 
	 */
	workflowStep: string;
	/**
	 * Creates a new global custom property. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} name
	* @param {string} type
	* @param {string} value
	* @returns {Documents.CustomProperty}
	**/
	addCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
	/**
	 * Adds a time interval to a Date object. 
	 * 
	 * Since date manipulation in Javascript is odd sometimes, this useful function allows to conveniently add a given period of time to a given date, e.g. to calculate a due date based upon the current date plus xx days ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {Date} ts
	* @param {number} amount
	* @param {string} unit
	* @param {boolean} useWorkCalendar
	* @returns {Date}
	**/
	addTimeInterval(ts: Date, amount: number, unit?: string, useWorkCalendar?: boolean): Date;
	/**
	 * Change the user context of the PortalScript. 
	 * 
	 * In some cases, especially if you make heavy use of access privileges both with files and file fields, it might be neccessary to run a script in a different user context than the user who triggered the script execution. For example, if the current user is not allowed to change any field values, a PortalScript running in this user's context will fail, if it tries to change a field value. In this case it is best practice to switch the user context to some superuser who is allowed to perform the restricted action before that restricted action is executed. You may change the script's user context as often as you need, a change only applies to the instructions following the changeScriptUser() call. ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} login
	* @returns {boolean}
	**/
	changeScriptUser(login: string): boolean;
	/**
	 * Convert a Date object representing a date into a String. 
	 * 
	 * The output String is in the date format of the specified locale. If you leave the locale parameter away the current locale of the script context will be used. ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {Date} dateOrTimeStamp
	* @param {string} locale
	* @returns {string}
	**/
	convertDateToString(dateOrTimeStamp: Date, locale?: string): string;
	/**
	 * Converts a Number into a formatted String. 
	 * 
	 * The output String may have any format you like. The following parameters defines the format to configure the fromat of the numeric String. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {number} value
	* @param {string} decimalSep
	* @param {string} thousandSep
	* @param {number} precision
	* @returns {string}
	**/
	convertNumericToString(value: number, decimalSep: string, thousandSep: string, precision?: number): string;
	/**
	 * Converts a Number into a formatted String. 
	 * 
	 * The output String is formatted like the definition in the locale. If the locale is not defined by parameter, the locale of the current user will be used. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {number} value
	* @param {string} locale
	* @param {number} precision
	* @returns {string}
	**/
	convertNumericToString(value: number, locale?: string, precision?: number): string;
	/**
	 * Convert a String representing a date into a Date object. 
	 * 
	 * The output Date is in the date format of the specified locale. If you omit the locale parameter the current locale of the script context will be used. ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} dateOrTimeStamp
	* @param {string} locale
	* @returns {Date}
	**/
	convertStringToDate(dateOrTimeStamp: string, locale: string): Date;
	/**
	 * Converts a formated String into a number. 
	 * 
	 * The input String may have any format you like. The following parameters defines the format to configure the format of the numeric String. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} numericValue
	* @param {string} decimalSep
	* @param {string} thousandSep
	* @returns {number}
	**/
	convertStringToNumeric(numericValue: string, decimalSep: string, thousandSep: string): number;
	/**
	 * Converts a formated String into a number. 
	 * 
	 * The input String has to be formatted like the definition in the locale. If the locale is not defined by parameter, the locale of the current user will be used. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} numericValue
	* @param {string} locale
	* @returns {number}
	**/
	convertStringToNumeric(numericValue: string, locale?: string): number;
	/**
	 * Retrieve the amount of pool files of the specified filetype in the system. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} fileType
	* @returns {number}
	**/
	countPoolFiles(fileType: string): number;
	/**
	 * Create a new access profile in the DOCUMENTS environment. 
	 * 
	 * If the access profile already exist, the method returns an error. ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} profileName
	* @returns {Documents.AccessProfile}
	**/
	createAccessProfile(profileName: string): Documents.AccessProfile;
	/**
	 * Create a new ArchiveServer. 
	 * 
	 * This function creates a new ArchiveServer for the specified archive software on the top level. These types are available: ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} name
	* @param {string} type
	* @returns {Documents.ArchiveServer}
	**/
	createArchiveServer(name: string, type: string): Documents.ArchiveServer;
	/**
	 * Create a new fellow in the DOCUMENTS environment. 
	 * 
	 * ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} loginName
	* @param {boolean} isDlcUser
	* @param {string} licenseType
	* @returns {Documents.SystemUser}
	**/
	createFellow(loginName: string, isDlcUser: boolean, licenseType?: string): Documents.SystemUser;
	/**
	 * Create a new file of the specified filetype. 
	 * 
	 * This function creates a new file of the given filetype. Since the script is executed in the context of a particular user, it is mandatory that user possesses sufficient access privileges to create new instances of the desired filetype, otherwise the method will fail. 
	 * 
	 * If an error occurs during creation of the file the return value will be null and you can access an error message describing the error with getLastError(). ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} fileType
	* @returns {Documents.DocFile}
	**/
	createFile<K extends keyof FileTypeMapper>(fileType: K): FileTypeMapper[K];
	createFile(fileType: string): Documents.DocFile;
	/**
	 * Create a new folder of the specified type on the top level. 
	 * 
	 * This function creates a new folder of the specified type on the top level. There are three types available: ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} name
	* @param {string} type
	* @returns {Documents.Folder}
	**/
	createFolder(name: string, type: string): Documents.Folder;
	/**
	 * Create a new pool file of the specified filetype. 
	 * 
	 * The script must run in the context of a user who has sufficient access privileges to create new files of the specified filetype, otherwise this method will fail. ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} fileType
	* @returns {boolean}
	**/
	createPoolFile(fileType: string): boolean;
	/**
	 * Create a new user in the DOCUMENTS environment. 
	 * 
	 * ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} loginName
	* @param {boolean} isDlcUser
	* @param {string} licenseType
	* @returns {Documents.SystemUser}
	**/
	createSystemUser(loginName: string, isDlcUser: boolean, licenseType?: string): Documents.SystemUser;
	/**
	 * Delete a certain access profile in the DOCUMENTS environment. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} profileName
	* @returns {boolean}
	**/
	deleteAccessProfile(profileName: string): boolean;
	/**
	 * Delete a folder in DOCUMENTS. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {any} folderObj
	* @returns {boolean}
	**/
	deleteFolder(folderObj: Documents.Folder): boolean;
	/**
	 * Delete a user in the DOCUMENTS environment. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} loginName
	* @returns {boolean}
	**/
	deleteSystemUser(loginName: string): boolean;
	/**
	 * Perform an external command shell call on the Portalserver. 
	 * 
	 * In the context of a work directory, an external command shell call is executed, usually a batch file. You can decide whether the scripting engine must wait for the external call to complete or whether the script execution continues asynchonously. If the script waits for the external call to complete, this method returns the errorcode of the external call as an integer value. ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} workDir
	* @param {string} cmd
	* @param {boolean} synced
	* @returns {boolean}
	**/
	extCall(workDir: string, cmd: string, synced: boolean): boolean;
	/**
	 * Perform an external process call on the Portalserver and returns the exitcode of the external process and the standard output. 
	 * 
	 * An external process call is executed, e.g. a batch file. The methods returns an array of the size 2. The first array value is the exitcode of the external process. The second array value contains the content that the external process has written to the standard output. ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} cmd
	* @returns {Array<any>}
	**/
	extProcess(cmd: string): Array<any>;
	/**
	 * Find a certain access profile in the DOCUMENTS environment. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} profileName
	* @returns {Documents.AccessProfile}
	**/
	findAccessProfile(profileName: string): Documents.AccessProfile;
	/**
	 * Searches for CustomProperties. 
	 * 
	 * ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} filter
	* @returns {Documents.CustomPropertyIterator}
	**/
	findCustomProperties(filter: string): Documents.CustomPropertyIterator;
	/**
	 * Retrieve a user by his/her login. 
	 * 
	 * If the user does not exist, then the return value will be null. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} login
	* @returns {Documents.SystemUser}
	**/
	findSystemUser(login: string): Documents.SystemUser;
	/**
	 * Retrieve a user by an alias name. 
	 * 
	 * If the alias does not exist or is not connected to a user then the return value will be null. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} alias
	* @returns {Documents.SystemUser}
	**/
	findSystemUserByAlias(alias: string): Documents.SystemUser;
	/**
	 * Get an iterator with all access profiles of in the DOCUMENTS environment. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {boolean} includeInvisibleProfiles
	* @returns {Documents.AccessProfileIterator}
	**/
	getAccessProfiles(includeInvisibleProfiles?: boolean): Documents.AccessProfileIterator;
	/**
	 * Get an ArchiveConnection object. 
	 * 
	 * With this method you can get an ArchiveConnection object. This object offers several methods to use the EAS Interface, EBIS or the EASY ENTERPRISE XML-Server. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} archiveServerName
	* @returns {Documents.ArchiveConnection}
	**/
	getArchiveConnection(archiveServerName: string): Documents.ArchiveConnection;
	/**
	 * Get a file from the archive. 
	 * 
	 * With this method you can get a file from the archive using the archive key. You need the necessary access rights on the archive side. ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} key
	* @returns {Documents.DocFile}
	**/
	getArchiveFile(key: string): Documents.DocFile;
	/**
	 * Get an ArchiveServer identified by its name. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} name
	* @returns {Documents.ArchiveServer}
	**/
	getArchiveServer(name: string): Documents.ArchiveServer;
	/**
	 * Get an iterator with all ArchiveServers in the DOCUMENTS environment. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof Context
	* @returns {Documents.ArchiveServerIterator}
	**/
	getArchiveServers(): Documents.ArchiveServerIterator;
	/**
	 * Get the String value of a DOCUMENTS autotext. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} autoText
	* @returns {string}
	**/
	getAutoText(autoText: string): string;
	/**
	 * Get the abbreviation of the current user's portal language. 
	 * 
	 * If you want to return output messages through scripting, taking into account that your users might use different portal languages, this function is useful to gain knowledge about the portal language used by the current user, who is part of the script's runtime context. This function returns the current language as the two letter abbreviation as defined in the principal's settings in the Windows Portal Client (e.g. "de" for German). ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @returns {string}
	**/
	getClientLang(): string;
	/**
	 * Get the script's execution context portal language index. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @returns {number}
	**/
	getClientSystemLang(): number;
	/**
	 * Get the connection info of the client connection. 
	 * 
	 * You can analyze the connection info to identify e.g. a client thread of the HTML5 Web-Client ... 
	 */
	/**
	* @memberof Context
	* @returns {string}
	**/
	getClientType(): string;
	/**
	 * Get the String value of an attribute of the current user. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} attributeName
	* @returns {string}
	**/
	getCurrentUserAttribute(attributeName: string): string;
	/**
	 * Get a CustomPropertyIterator with global custom properties. 
	 * 
	 * ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} nameFilter
	* @param {string} typeFilter
	* @returns {Documents.CustomPropertyIterator}
	**/
	getCustomProperties(nameFilter?: string, typeFilter?: string): Documents.CustomPropertyIterator;
	/**
	 * Subtract two Date objects to get their difference. 
	 * 
	 * This function calculates the time difference between two Date objects, for example if you need to know how many days a business trip takes. By default this function takes the work calendar into account if it is configured and enabled for the principal. ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {Date} earlierDate
	* @param {Date} laterDate
	* @param {string} unit
	* @param {boolean} useWorkCalendar
	* @returns {number}
	**/
	getDatesDiff(earlierDate: Date, laterDate: Date, unit?: string, useWorkCalendar?: boolean): number;
	/**
	 * Get an array with the values of an enumeration autotext. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} autoText
	* @returns {Array<any>}
	**/
	getEnumAutoText(autoText: string): Array<any>;
	/**
	 * Get the ergonomic label of a multilanguage enumeration list value. 
	 * 
	 * Enumeration lists in multilanguage DOCUMENTS installations usually are translated into the different portal languages as well. This results in the effect that only a technical value for an enumeration is stored in the database. So, if you need to display the label which is usually visible instead in the enumeration field through scripting, this function is used to access that ergonomic label. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} fileType
	* @param {string} field
	* @param {string} techEnumValue
	* @param {string} locale
	* @returns {string}
	**/
	getEnumErgValue(fileType: string, field: string, techEnumValue: string, locale: string): string;
	/**
	 * Get an array with enumeration list entries. 
	 * 
	 * In some cases it might be useful not only to access the selected value of an enumeration file field, but the list of all possible field values as well. This function creates an Array of String values (zero-based), and each index is one available value of the enumeration field. If the enumeration field is configured to sort the values alphabetically, this option is respected. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} fileType
	* @param {string} field
	* @returns {string}
	**/
	getEnumValues(fileType: string, field: string): string;
	/**
	 * Get the ergonomic label of a file field. 
	 * 
	 * In multilanguage DOCUMENTS environments, usually the file fields are translated to the different locales by using the well known ergonomic label hack. The function is useful to output scripting generated information in the appropriate portal language of the web user who triggered the script execution. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} fileType
	* @param {string} field
	* @param {string} locale
	* @returns {string}
	**/
	getFieldErgName(fileType: string, field: string, locale: string): string;
	/**
	 * Get the file by its unique file-id. 
	 * 
	 * If the file does not exist or the user in whose context the script is executed is not allowed to access the file, then the return value will be null. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} idFile
	* @returns {Documents.DocFile}
	**/
	getFileById(idFile: string): Documents.DocFile;
	/**
	 * Get the ergonomic label of a filetype. 
	 * 
	 * In multilanguage DOCUMENTS environments, usually the filetypes are translated to the different locales by using the well known ergonomic label hack. The function is useful to output scripting generated information in the appropriate portal language of the web user who triggered the script execution. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} fileType
	* @param {string} locale
	* @returns {string}
	**/
	getFileTypeErgName(fileType: string, locale: string): string;
	/**
	 * Returns the object-id of a filetype. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} nameFiletype
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getFileTypeOID(nameFiletype: string, oidLow?: boolean): string;
	/**
	 * Retrieve the position of a top level folder in the global context. 
	 * 
	 * This method can be used to get the position of a top level folder (public, public dynamic or only subfolders folder with no parent) in the global context. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {any} folder
	* @returns {number}
	**/
	getFolderPosition(folder: Documents.Folder): number;
	/**
	 * Retrieve a list of folders with identical name. 
	 * 
	 * Different folders might match an identical pattern, e.g. "DE_20*" for each folder like "DE_2004", "DE_2005" and so on. If you need to perform some action with the different folders or their contents, it might be useful to retrieve an iterator (a list) of all these folders to loop through that list. ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} folderPattern
	* @param {string} type
	* @returns {Documents.FolderIterator}
	**/
	getFoldersByName(folderPattern: string, type: string): Documents.FolderIterator;
	/**
	 * Retrieve the desired entry of the system messages table. 
	 * 
	 * It might be inconvenient to maintain the different output Strings of localized PortalScripts, if this requires to edit the scripts themselves. This function adds a convenient way to directly access the system messages table which you may maintain in the Windows Portal Client. This enables you to add your own system message table entries in your different portal languages and to directly access them in your scripts. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} identifier
	* @returns {string}
	**/
	getFromSystemTable(identifier: string): string;
	/**
	 * Get a JS_Object by object id. 
	 * 
	 * With this method you can get a JS-Object by the object id. Depending of the class of the object you get a JS-Object of the classes AccessProfile, DocFile, Document, Folder, Register, SystemUser or WorkflowStep... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} oid
	* @returns {any}
	**/
	getJSObject(oid: string): any;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Get the String value of an attribute of the DOCUMENTS principal. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} attributeName
	* @returns {string}
	**/
	getPrincipalAttribute(attributeName: string): string;
	/**
	 * Gets the current progress value in % of the progress bar in the Documents-Manager during the PortalScript execution. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @returns {number}
	**/
	getProgressBar(): number;
	/**
	 * Get the actual search parameters within an "OnSearch" or "FillSearchScript" exit. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @returns {Documents.DocQueryParams}
	**/
	getQueryParams(): Documents.DocQueryParams;
	/**
	 * Get the ergonomic label of a register. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} fileTypeName
	* @param {string} registerName
	* @param {string} locale
	* @returns {string}
	**/
	getRegisterErgName(fileTypeName: string, registerName: string, locale: string): string;
	/**
	 * Create a String containing the installation path of the portal server. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Context
	* @returns {string}
	**/
	getServerInstallPath(): string;
	/**
	 * Get the current user as a SystemUser object. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @returns {Documents.SystemUser}
	**/
	getSystemUser(): Documents.SystemUser;
	/**
	 * Get a list of all users created in the system. 
	 * 
	 * ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {boolean} includeLockedUsers
	* @returns {Documents.SystemUserIterator}
	**/
	getSystemUsers(includeLockedUsers?: boolean): Documents.SystemUserIterator;
	/**
	 * Create a String containing a complete path and filename to a temporary file. 
	 * 
	 * The created file path may be used without any danger of corrupting any important data by accident, because DOCUMENTS assures that there is no such file with the created filename yet. ... ... ... 
	 */
	/**
	* @memberof Context
	* @returns {string}
	**/
	getTmpFilePath(): string;
	/**
	 * Get an ArchiveConnection object. 
	 * 
	 * With this method you can get an ArchiveConnection object. This object offers several methods to use the EAS Interface, EBIS or the EASY ENTERPRISE XML-Server. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} archiveServerName
	* @returns {Documents.ArchiveConnection}
	**/
	getXMLServer(archiveServerName: string): Documents.ArchiveConnection;
	/**
	 * Send a String as TCP-Request to a server. 
	 * 
	 * With this method it is possible to send a String via TCP to a server. The return value of the function is the response of the server. Optional you can define a timeout in ms this function waits for the response of a server ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} server
	* @param {number} port
	* @param {string} request
	* @param {number} responseTimeout
	* @returns {string}
	**/
	sendTCPStringRequest(server: string, port: number, request: string, responseTimeout?: number): string;
	/**
	 * Set the abbreviation of the current user's portal language. 
	 * 
	 * If you want to set the portal language different from the current users language, you can use this method. As parameter you have to use the two letter abbreviation as defined in the principal's settings in the Windows DOCUMENTS Manager (e.g. "de" for German). ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} locale
	* @returns {string}
	**/
	setClientLang(locale: string): string;
	/**
	 * Set the script's execution context portal language to the desired language. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {number} langIndex
	* @returns {boolean}
	**/
	setClientSystemLang(langIndex: number): boolean;
	/**
	 * Place a top level folder a at given position in the global context. 
	 * 
	 * This method can be used to set the position of a top level folder (public, public dynamic or only subfolders folder with no parent) in the global context. ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {any} folder
	* @param {number} position
	* @returns {boolean}
	**/
	setFolderPosition(folder: Documents.Folder, position: number): boolean;
	/**
	 * Creates or modifies a global custom property according the name and type. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} name
	* @param {string} type
	* @param {string} value
	* @returns {Documents.CustomProperty}
	**/
	setOrAddCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
	/**
	 * Set an attribute of the DOCUMENTS principal to the desired value. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} attributeName
	* @param {string} value
	* @returns {boolean}
	**/
	setPrincipalAttribute(attributeName: string, value: string): boolean;
	/**
	 * Sets the progress (%) of the progress bar in the Documents-Manager during the PortalScript execution. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {number} value
	* @returns {void}
	**/
	setProgressBar(value: number): void;
	/**
	 * Sets the progress bar text in the Documents-Manager during the PortalScript execution. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Context
	* @param {string} text
	* @returns {void}
	**/
	setProgressBarText(text: string): void;
	}
}
declare var context: Documents.Context;
declare var searchExpression: string;
interface FileTypeMapper {
	"DocFile": Documents.DocFile;
}


declare namespace Documents {
	/**
	 * The ControlFlow class has been added to the DOCUMENTS PortalScripting API to gain full control over a file's workflow by scripting means. 
	 * 
	 * You may access ControlFlow objects of a certain WorkflowStep by the different methods described in the WorkflowStep chapter. The objects of this class reflect only outgoing control flows of a WorkflowStep object. ... ... 
	 */
	export interface ControlFlow {
	/**
	 * String value containing the unique internal ID of the ControlFlow. 
	 * 
	 * ... ... ... 
	 */
	id: string;
	/**
	 * String value containing the ergonomic label of the ControlFlow. 
	 * 
	 * This is usually the label of the according button in the web surface. ... ... ... 
	 */
	label: string;
	/**
	 * String value containing the technical name of the ControlFlow. 
	 * 
	 * ... ... ... 
	 */
	name: string;
	/**
	 * Get the String value of an attribute of the ControlFlow. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof ControlFlow
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof ControlFlow
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Set the String value of an attribute of the ControlFlow to the desired value. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof ControlFlow
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	}
}

declare class ControlFlow implements Documents.ControlFlow {
	id: string;
	label: string;
	name: string;
	getAttribute(attribute: string): string;
	getLastError(): string;
	setAttribute(attribute: string, value: string): boolean;
}



declare namespace Documents {
	/**
	 * The ControlFlowIterator class has been added to the DOCUMENTS PortalScripting API to gain full control over a file's workflow by scripting means. 
	 * 
	 * You may access ControlFlowIterator objects of a certain WorkflowStep by the different methods described in the WorkflowStep chapter. The objects of this class reflect a list of outgoing control flows of a WorkflowStep object. ... ... 
	 */
	export interface ControlFlowIterator {
	/**
	 * Retrieve the first ControlFlow object in the ControlFlowIterator. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof ControlFlowIterator
	* @returns {Documents.ControlFlow}
	**/
	first(): Documents.ControlFlow;
	/**
	 * Retrieve the next ControlFlow object in the ControlFlowIterator. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof ControlFlowIterator
	* @returns {Documents.ControlFlow}
	**/
	next(): Documents.ControlFlow;
	/**
	 * Get the amount of ControlFlow objects in the ControlFlowIterator. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof ControlFlowIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class ControlFlowIterator implements Documents.ControlFlowIterator {
	first(): Documents.ControlFlow;
	next(): Documents.ControlFlow;
	size(): number;
}



declare namespace Documents {
	/**
	 * The CustomProperty class provides access to the user properties. 
	 * 
	 * The class CustomProperty provides a container where used specific data can be stored. E.g it will be used to store the last search masks. You can save project specific data using this class. The scripting classes SystemUser, AccessProfile and Context have the following access methods available: ... 
	 * In the DOCUMENTS-Manager you can find the CustomProperty on the relation-tab properties at the fellow and user account, access profiles and file types. The global custom properties are listed in Documents > Global properties. A global custom property must not belong to a SystemUser, an AccessProfile, a file type and another custom property. All custom properties are located in Documents > All properties. ... ... ... ... ... ... 
	 */
	export interface CustomProperty {
	/**
	 * String containing the name of the CustomProperty. 
	 */
	name: string;
	/**
	 * String containing the type of the CustomProperty. 
	 */
	type: string;
	/**
	 * String containing the value of the CustomProperty. 
	 */
	value: string;
	/**
	 * Creates a new subproperty for the custom property. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof CustomProperty
	* @param {string} name
	* @param {string} type
	* @param {string} value
	* @returns {Documents.CustomProperty}
	**/
	addSubProperty(name: string, type: string, value: string): Documents.CustomProperty;
	/**
	 * Deletes the CustomProperty. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof CustomProperty
	* @returns {boolean}
	**/
	deleteCustomProperty(): boolean;
	/**
	 * Get the String value of an attribute of the CustomProperty. 
	 * 
	 * Valid attribute names are name, type and value... ... ... 
	 */
	/**
	* @memberof CustomProperty
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof CustomProperty
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Get a CustomPropertyIterator with subproperties of the custom property. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof CustomProperty
	* @param {string} nameFilter
	* @param {string} typeFilter
	* @returns {Documents.CustomPropertyIterator}
	**/
	getSubProperties(nameFilter?: string, typeFilter?: string): Documents.CustomPropertyIterator;
	/**
	 * Connects a custom property to an AccessProfile. 
	 * 
	 * An empty profile name disconnects the AccessProfile
	 */
	/**
	* @memberof CustomProperty
	* @param {string} nameAccessProfile
	* @returns {boolean}
	**/
	setAccessProfile(nameAccessProfile?: string): boolean;
	/**
	 * Set the String value of an attribute of the CustomProperty to the desired value. 
	 * 
	 * Valid attribute names are name, type and value... ... ... 
	 */
	/**
	* @memberof CustomProperty
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	/**
	 * Connects a custom property to a filetype. 
	 */
	/**
	* @memberof CustomProperty
	* @param {string} nameFiletype
	* @returns {boolean}
	**/
	setFiletype(nameFiletype?: string): boolean;
	/**
	 * Creates a new subproperty or modifies a subproperty according the name and type for the custom property. 
	 * 
	 * This method creates or modifies a unique subproperty for the custom property. The combination of the name and the type make the subproperty unique for the custom property. ... ... ... ... ... ... 
	 */
	/**
	* @memberof CustomProperty
	* @param {string} name
	* @param {string} type
	* @param {string} value
	* @returns {Documents.CustomProperty}
	**/
	setOrAddSubProperty(name: string, type: string, value: string): Documents.CustomProperty;
	/**
	 * Connects a custom property to a SystemUser. 
	 * 
	 * An empty login disconnects the SystemUser
	 */
	/**
	* @memberof CustomProperty
	* @param {string} login
	* @returns {boolean}
	**/
	setSystemUser(login?: string): boolean;
	}
}

declare class CustomProperty implements Documents.CustomProperty {
	name: string;
	type: string;
	value: string;
	addSubProperty(name: string, type: string, value: string): Documents.CustomProperty;
	deleteCustomProperty(): boolean;
	getAttribute(attribute: string): string;
	getLastError(): string;
	getSubProperties(nameFilter?: string, typeFilter?: string): Documents.CustomPropertyIterator;
	setAccessProfile(nameAccessProfile?: string): boolean;
	setAttribute(attribute: string, value: string): boolean;
	setFiletype(nameFiletype?: string): boolean;
	setOrAddSubProperty(name: string, type: string, value: string): Documents.CustomProperty;
	setSystemUser(login?: string): boolean;
}



declare namespace Documents {
	/**
	 * The CustomPropertyIterator class is an iterator that holds a list of objects of the class CustomProperty. 
	 * 
	 * ... 
	 */
	export interface CustomPropertyIterator {
	/**
	 * Retrieve the first CustomProperty object in the CustomPropertyIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof CustomPropertyIterator
	* @returns {Documents.CustomProperty}
	**/
	first(): Documents.CustomProperty;
	/**
	 * Retrieve the next CustomProperty object in the CustomPropertyIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof CustomPropertyIterator
	* @returns {Documents.CustomProperty}
	**/
	next(): Documents.CustomProperty;
	/**
	 * Get the amount of CustomProperty objects in the CustomPropertyIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof CustomPropertyIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class CustomPropertyIterator implements Documents.CustomPropertyIterator {
	first(): Documents.CustomProperty;
	next(): Documents.CustomProperty;
	size(): number;
}



declare namespace Documents {
	/**
	 * The DBConnection class allows to connect to external databases. 
	 * 
	 * With the help of the DBResultSet class you can obtain information from these external databases, and it is possible to execute any other SQL statement on the external databases. ... ... ... 
	 */
	export interface DBConnection {
	/**
	 * Close the database connection and free the server ressources. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DBConnection
	* @returns {boolean}
	**/
	close(): boolean;
	/**
	 * Execute a SELECT statement and retrieve a DBResultSet containing the result rows found by the statement. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof DBConnection
	* @param {string} sqlStatement
	* @returns {Documents.DBResultSet}
	**/
	executeQuery(sqlStatement: string): Documents.DBResultSet;
	/**
	 * Execute a SELECT statement using a x64/UTF-8 DOCUMENTS and retrieve a DBResultSet containing the result rows found by the statement. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof DBConnection
	* @param {string} sqlStatement
	* @returns {Documents.DBResultSet}
	**/
	executeQueryUC(sqlStatement: string): Documents.DBResultSet;
	/**
	 * Execute any SQL statement on the external database. 
	 * 
	 * You can execute any SQL statement, as long as the database driver used for the connection supports the type of instruction. Use this method especially if you want to INSERT or UPDATE or DELETE data rows in tables of the external database. If you need to SELECT table rows, refer to the DBConnection.executeQuery() method. ... ... ... ... 
	 */
	/**
	* @memberof DBConnection
	* @param {string} sqlStatement
	* @returns {boolean}
	**/
	executeStatement(sqlStatement: string): boolean;
	/**
	 * Execute any SQL statement using a x64/UTF-8 DOCUMENTS on the external database. 
	 * 
	 * You can execute any SQL statement, as long as the database driver used for the connection supports the type of instruction. Use this method especially if you want to INSERT or UPDATE or DELETE data rows in tables of the external database. If you need to SELECT table rows, refer to the DBConnection.executeQueryUC() method. ... ... ... ... 
	 */
	/**
	* @memberof DBConnection
	* @param {string} sqlStatement
	* @returns {boolean}
	**/
	executeStatementUC(sqlStatement: string): boolean;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DBConnection
	* @returns {string}
	**/
	getLastError(): string;
	}
}

declare class DBConnection implements Documents.DBConnection {
	close(): boolean;
	constructor(connType: string, connString: string, user: string, password: string);
	constructor();
	executeQuery(sqlStatement: string): Documents.DBResultSet;
	executeQueryUC(sqlStatement: string): Documents.DBResultSet;
	executeStatement(sqlStatement: string): boolean;
	executeStatementUC(sqlStatement: string): boolean;
	getLastError(): string;
}



declare namespace Documents {
	/**
	 * The DBResultSet class contains a list of resultset rows. 
	 * 
	 * You need an active DBConnection object to execute an SQL query which is used to create a DBResultSet. ... ... ... ... 
	 */
	export interface DBResultSet {
	/**
	 * Close the DBResultSet and free the server ressources. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @returns {boolean}
	**/
	close(): boolean;
	/**
	 * Read the indicated column of the current row of the DBResultSet as a Boolean value. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @param {number} colNo
	* @returns {boolean}
	**/
	getBool(colNo: number): boolean;
	/**
	 * Function returns the name of a column. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @param {number} colNo
	* @returns {string}
	**/
	getColName(colNo: number): string;
	/**
	 * Read the indicated column of the current row of the DBResultSet as a Date object. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @param {number} colNo
	* @returns {Date}
	**/
	getDate(colNo: number): Date;
	/**
	 * Read the indicated column of the current row of the DBResultSet as a float value. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @param {number} colNo
	* @returns {number}
	**/
	getFloat(colNo: number): number;
	/**
	 * Read the indicated column of the current row of the DBResultSet as an integer value. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @param {number} colNo
	* @returns {number}
	**/
	getInt(colNo: number): number;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Function returns the amount of columns of the DBResultSet. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @returns {number}
	**/
	getNumCols(): number;
	/**
	 * Read the indicated column of the current row of the DBResultSet as a String. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @param {number} colNo
	* @returns {string}
	**/
	getString(colNo: number): string;
	/**
	 * Read the indicated column of the current row of the DBResultSet as a Date object including the time. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @param {number} colNo
	* @returns {Date}
	**/
	getTimestamp(colNo: number): Date;
	/**
	 * Read the indicated column of the current row of the DBResultSet on a x64/UTF-8 DOCUMENTS as a String. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @param {number} colNo
	* @returns {string}
	**/
	getUCString(colNo: number): string;
	/**
	 * Move the resultset pointer to the next row of the DBResultSet. 
	 * 
	 * The method must be called at least once after retrieving a DBResultSet, because the newly created object does not point to the first result row but to BOF (beginning of file). ... ... ... 
	 */
	/**
	* @memberof DBResultSet
	* @returns {boolean}
	**/
	next(): boolean;
	}
}

declare class DBResultSet implements Documents.DBResultSet {
	close(): boolean;
	getBool(colNo: number): boolean;
	getColName(colNo: number): string;
	getDate(colNo: number): Date;
	getFloat(colNo: number): number;
	getInt(colNo: number): number;
	getLastError(): string;
	getNumCols(): number;
	getString(colNo: number): string;
	getTimestamp(colNo: number): Date;
	getUCString(colNo: number): string;
	next(): boolean;
}



declare namespace Documents {
	/**
	 * The DocFile class implements the file object of DOCUMENTS. 
	 * 
	 * You may access a single DocFile with the help of the attribute context.file or by creating a FileResultset. There are no special properties available, but each field of a file is mapped to an according property. You can access the different field values with their technical names.
	 * 
	 * For this reason it is mandatory to use programming language friendly technical names, meaning ... ... 
	 */
	export interface DocFile {
	/**
	 * The technical name of a field. 
	 * 
	 * Each field of a DocFile is mapped to an according property. You can access the field value with the technical name. ... ... ... 
	 */
	fieldName: any;
	/**
	 * Cancel edit mode for a file. 
	 * 
	 * If you switched a file to edit mode with the startEdit() method and if you want to cancel this (e.g. due to some error that has occurred in the mean time) this function should be used to destroy the scratch copy which has been created by the startEdit() instruction. ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	abort(): boolean;
	/**
	 * Add a file as a new Document from the server's filesystem to a given Register. 
	 * 
	 * It is possible to parse Autotexts inside the source file to fill the Document with the contents of index fields of a DocFile object. The max. file size for the source file is 512 KB. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} pathDocument
	* @param {string} targetRegister
	* @param {string} targetFileName
	* @param {boolean} deleteDocumentAtFileSystem
	* @param {boolean} parseAutoText
	* @param {any} referencFileToParse
	* @returns {Documents.Document}
	**/
	addDocumentFromFileSystem(pathDocument: string, targetRegister: string, targetFileName: string, deleteDocumentAtFileSystem?: boolean, parseAutoText?: boolean, referencFileToParse?: Documents.DocFile): Documents.Document;
	/**
	 * Create a PDF file containing the current DocFile's contents and store it on a given document register. 
	 * 
	 * The different document types of your documents on your different tabs require the appropriate PDF filter programs to be installed and configured in DOCUMENTS. To successfully add the created PDF file to a register the DocFile needs to be in edit mode (via startEdit() method), and the changes have to be applied via commit(). ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} pathCoverXML
	* @param {boolean} createCover
	* @param {string} pdfFileName
	* @param {string} targetRegister
	* @param {Array<any>} sourceRegisterNames
	* @returns {boolean}
	**/
	addPDF(pathCoverXML: string, createCover: boolean, pdfFileName: string, targetRegister: string, sourceRegisterNames: Array<any>): boolean;
	/**
	 * Archive the DocFile object. 
	 * 
	 * The target archive has to be configured in the filetype definition (in the Windows Portal Client) as the default archive. If no default archive is defined, the execution of this operation will fail. ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	archive(): boolean;
	/**
	 * Archive the DocFile object to the desired archive. 
	 * 
	 * If the target archive key is misspelled or if the target archive does not exist, the operation will fall back to the default archive, as long as it is configured in the filetype definition. So the function will only fail if both the target archive and the default archive are missing. ... ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} archiveKey
	* @returns {boolean}
	**/
	archive(archiveKey: string): boolean;
	/**
	 * Archive the DocFile object according to the given ArchivingDescription object. 
	 * 
	 * This is the most powerful way to archive a file through scripting, since the ArchivingDescription object supports a convenient way to influence which parts of the DocFile should be archived. ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {any} desc
	* @returns {boolean}
	**/
	archive(desc: Documents.ArchivingDescription): boolean;
	/**
	 * Archive the DocFile object and remove the DOCUMENTS file. 
	 * 
	 * The target archive has to be configured in the filetype definition (in the Windows Portal Client) as the default archive. It depends on the filetype settings as well, whether Status and Monitor will be archived as well. If no default archive is defined, the execution of this operation will fail. ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	archiveAndDelete(): boolean;
	/**
	 * Cancel the current workflow for the file. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	cancelWorkflow(): boolean;
	/**
	 * Change the filetype of this file. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} nameFiletype
	* @returns {boolean}
	**/
	changeFiletype(nameFiletype: string): boolean;
	/**
	 * Checks the receive signals of the workflow for the DocFile object. 
	 * 
	 * This method can only be used for a DocFile, that runs in a workflow and the workflow has receive signals. Usually the receive signals of the workflow step will be checked by a periodic job. Use this method to trigger the check of the receive signals for the DocFile. ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	checkWorkflowReceiveSignal(): boolean;
	/**
	 * Clear a followup date for a desired user. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {any} pUser
	* @returns {boolean}
	**/
	clearFollowUpDate(pUser: Documents.SystemUser): boolean;
	/**
	 * Commit any changes to the DocFile object. 
	 * 
	 * This method is mandatory to apply changes to a file that has been switched to edit mode with the startEdit() method. It is strictly prohibited to execute the commit() method in a script which is attached to the onSave scripting hook. ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	commit(): boolean;
	/**
	 * Store a reference to the current file in the desired target folder. 
	 * 
	 * The (public) folder must be a real folder, it must not be a dynamic filter, nor a "only subfolder" object. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {any} fObj
	* @returns {boolean}
	**/
	connectFolder(fObj: Documents.Folder): boolean;
	/**
	 * Count fields with a desired name in the file. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} fieldName
	* @returns {number}
	**/
	countFields(fieldName: string): number;
	/**
	 * Creates a workflow monitor file in the server's file system. 
	 * 
	 * This method creates a monitor file in the server's file system with the workflow monitor content of the DocFile. The file will be created as a html-file. ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {boolean} asPDF
	* @param {string} locale
	* @returns {string}
	**/
	createMonitorFile(asPDF?: boolean, locale?: string): string;
	/**
	 * Creates a status file in the server's file system. 
	 * 
	 * This method creates a status file in the server's file system with the status content of the DocFile. The file will be created as a html-file. ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {boolean} asPDF
	* @param {string} locale
	* @returns {string}
	**/
	createStatusFile(asPDF?: boolean, locale?: string): string;
	/**
	 * Delete the DocFile object. 
	 * 
	 * If there's another PortalScript attached to the onDelete scripting hook, it will be executed right before the deletion takes place. ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {boolean} moveTrash
	* @param {boolean} movePool
	* @param {boolean} allVersions
	* @returns {boolean}
	**/
	deleteFile(moveTrash?: boolean, movePool?: boolean, allVersions?: boolean): boolean;
	/**
	 * Uncouple an active file from the archived version. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	disconnectArchivedFile(): boolean;
	/**
	 * Remove a reference to the current file out of the desired target folder. 
	 * 
	 * The (public) folder must be a real folder, it must not be a dynamic filter, nor a "only subfolder" object. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {any} fObj
	* @returns {boolean}
	**/
	disconnectFolder(fObj: Documents.Folder): boolean;
	/**
	 * Export the file as an XML file. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} pathXML
	* @param {boolean} withDocuments
	* @param {boolean} withStatus
	* @param {boolean} withMonitor
	* @returns {boolean}
	**/
	exportXML(pathXML: string, withDocuments: boolean, withStatus?: boolean, withMonitor?: boolean): boolean;
	/**
	 * Forward file in its workflow via the given control flow. 
	 * 
	 * This method only works if the file is inside a workflow and inside a workflow action that is accessible by a user of the web interface. Based on that current workflowstep you need to gather the ID of one of the outgoing control flows of that step. The access privileges of the current user who tries to execute the script are taken into account. Forwarding the file will only work if that control flow is designed to forward without query. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} controlFlowId
	* @param {string} comment
	* @returns {boolean}
	**/
	forwardFile(controlFlowId: string, comment: string): boolean;
	/**
	 * Get a list of all locking workflow step that currently lock the file. 
	 * 
	 * The locking workflow steps do not need to be locked by the current user executing the script, this function as well returns all locking steps which refer to different users. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {Documents.WorkflowStepIterator}
	**/
	getAllLockingWorkflowSteps(): Documents.WorkflowStepIterator;
	/**
	 * Get a list of all workflow step of the file. 
	 * 
	 * The methd will return all workflow steps, the currently locking and the previous ones. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {Documents.WorkflowStepIterator}
	**/
	getAllWorkflowSteps(): Documents.WorkflowStepIterator;
	/**
	 * After archiving of a file this method returns the key of the file in the archive. 
	 * 
	 * ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {boolean} withServer
	* @returns {string}
	**/
	getArchiveKey(withServer?: boolean): string;
	/**
	 * Create a PDF file containing the current DocFile's contents and returns the path in the file system. 
	 * 
	 * The different document types of your documents on your different tabs require the appropriate PDF filter programs to be installed and configured in DOCUMENTS. ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} nameCoverTemplate
	* @param {boolean} createCover
	* @param {Array<any>} sourceRegisterNames
	* @returns {string}
	**/
	getAsPDF(nameCoverTemplate: string, createCover: boolean, sourceRegisterNames: Array<any>): string;
	/**
	 * Get the String value of an attribute of the file. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * Get the String value of a DOCUMENTS autotext. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} autoText
	* @returns {string}
	**/
	getAutoText(autoText: string): string;
	/**
	 * Duplicate a file. 
	 * 
	 * This function creates a real 1:1 copy of the current file which may be submitted to its own workflow. ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} copyMode
	* @returns {Documents.DocFile}
	**/
	getCopy(copyMode: string): Documents.DocFile;
	/**
	 * Returns the creation date (timestamp) of a DocFile. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {Date}
	**/
	getCreationDate(): Date;
	/**
	 * Returns the SystemUser object or fullname as String of the creator of the DocFile. 
	 * 
	 * ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {boolean} asObject
	* @returns {any}
	**/
	getCreator(asObject?: boolean): any;
	/**
	 * Get the current workflow step of the current user locking the file. 
	 * 
	 * The function returns a valid WorkflowStep object if there exists one for the current user. If the current user does not lock the file, the function returns null instead. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {Documents.WorkflowStep}
	**/
	getCurrentWorkflowStep(): Documents.WorkflowStep;
	/**
	 * Get an array with the values of an enumeration autotext. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} autoText
	* @returns {Array<any>}
	**/
	getEnumAutoText(autoText: string): Array<any>;
	/**
	 * Get the String value of an attribute of the desired file field. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} fieldName
	* @param {string} attrName
	* @returns {string}
	**/
	getFieldAttribute(fieldName: string, attrName: string): string;
	/**
	 * Returns an AutoText value of a specified field of the DocFile. 
	 * 
	 * The following AutoTexts are available ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} fieldName
	* @param {string} autoText
	* @returns {string}
	**/
	getFieldAutoText(fieldName: string, autoText?: string): string;
	/**
	 * Get the technical name of the n-th field of the file. 
	 * 
	 * This allows generic scripts to be capable of different versions of the same filetype, e.g. if you changed details of the filetype, but there are still older files of the filetype in the system. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {number} index
	* @returns {string}
	**/
	getFieldName(index: number): string;
	/**
	 * Get the value of the desired file field. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} fieldName
	* @returns {any}
	**/
	getFieldValue(fieldName: string): any;
	/**
	 * Get the file owner of the file. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {Documents.SystemUser}
	**/
	getFileOwner(): Documents.SystemUser;
	/**
	 * Get the first locking workflow step that currently locks the file. 
	 * 
	 * The first locking workflow step does not need to be locked by the current user executing the script, this function as well returns the first locking step if it is locked by a different user. If no locking step is found at all, the function returns null instead. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {Documents.WorkflowStep}
	**/
	getFirstLockingWorkflowStep(): Documents.WorkflowStep;
	/**
	 * Returns the file id of the DocFile. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {string}
	**/
	getid(): string;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Returns the last modification date (timestamp) of a DocFile. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {Date}
	**/
	getLastModificationDate(): Date;
	/**
	 * Returns the fullname as String of the last editor of the DocFile. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {string}
	**/
	getLastModifier(): string;
	/**
	 * Returns the object-id. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getOID(oidLow?: boolean): string;
	/**
	 * Get the orginal file for a scratch copy. 
	 * 
	 * If you run a scipt on a scratch copy (e.g. a onSave script), you can get the orginal file with this function. ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {Documents.DocFile}
	**/
	getOriginal(): Documents.DocFile;
	/**
	 * Get the file referred by a reference field in the current file. 
	 * 
	 * If the current file's filetype is connected to a superior filetype by a reference field, this function allows to easily access the referred file, e.g. if you are in an invoice file and you want to access data of the referring company. ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} referenceFileField
	* @returns {Documents.DocFile}
	**/
	getReferenceFile(referenceFileField: string): Documents.DocFile;
	/**
	 * 
	 * ... ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} registerName
	* @param {boolean} checkAccessRight
	* @returns {Documents.Register}
	**/
	getRegisterByName(registerName: string, checkAccessRight?: boolean): Documents.Register;
	/**
	 * Get an iterator with the registers of the file for the specified type. 
	 * 
	 * ... ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} type
	* @param {boolean} checkAccessRight
	* @returns {Documents.RegisterIterator}
	**/
	getRegisters(type?: string, checkAccessRight?: boolean): Documents.RegisterIterator;
	/**
	 * Returns the title of the DocFile. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} locale
	* @returns {string}
	**/
	getTitle(locale?: string): string;
	/**
	 * Get the status of the file for a desired user. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} login
	* @returns {string}
	**/
	getUserStatus(login: string): string;
	/**
	 * Gather information whether the current file has the field with the desired name. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} fieldName
	* @returns {boolean}
	**/
	hasField(fieldName: string): boolean;
	/**
	 * Add an entry to the status tab of the file. 
	 * 
	 * This function is especially useful in connection with PortalScripts being used as decision guards in workflows, because this allows to comment and describe the decisions taken by the scripts. This increases transparency concerning the life cycle of a file in DOCUMENTS. ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} action
	* @param {string} comment
	* @returns {boolean}
	**/
	insertStatusEntry(action: string, comment: string): boolean;
	/**
	 * Gather information whether the current file is an archive file. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	isArchiveFile(): boolean;
	/**
	 * Gather information whether the current file is a deleted file of a trash folder. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	isDeletedFile(): boolean;
	/**
	 * Gather information whether the current file is a new file. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	isNewFile(): boolean;
	/**
	 * Reactivate an archive file to a file of the correspondending filetype. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	reactivate(): boolean;
	/**
	 * Send the DocFile directly. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {Array<any>} receivers
	* @param {string} sendMode
	* @param {string} task
	* @param {boolean} backWhenFinished
	* @returns {boolean}
	**/
	sendFileAdHoc(receivers: Array<any>, sendMode: string, task: string, backWhenFinished: boolean): boolean;
	/**
	 * Send the file as email to somebody. 
	 * 
	 * You must define an email template in the Windows Portal Client at the filetype of your DocFile object. This template may contain autotexts that can be parsed and replaced with their appropriate field values. ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} from
	* @param {string} templateName
	* @param {string} to
	* @param {string} cc
	* @param {boolean} addDocs
	* @param {string} bcc
	* @returns {boolean}
	**/
	sendMail(from: string, templateName: string, to: string, cc: string, addDocs: boolean, bcc: string): boolean;
	/**
	 * Set the String value of an attribute of the file to the desired value. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	/**
	 * Set the value of an attribute of the desired file field. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} fieldName
	* @param {string} attrName
	* @param {string} value
	* @returns {boolean}
	**/
	setFieldAttribute(fieldName: string, attrName: string, value: string): boolean;
	/**
	 * Set the value of the desired file field. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} fieldName
	* @param {any} value
	* @returns {boolean}
	**/
	setFieldValue(fieldName: string, value: any): boolean;
	/**
	 * Set the file owner of the file to the desired user. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {any} owner
	* @returns {boolean}
	**/
	setFileOwner(owner: Documents.SystemUser): boolean;
	/**
	 * Set a followup date for a desired user. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {any} pUser
	* @param {Date} followUpDate
	* @param {string} comment
	* @returns {boolean}
	**/
	setFollowUpDate(pUser: Documents.SystemUser, followUpDate: Date, comment: string): boolean;
	/**
	 * Mark the file as read or unread for the desired user. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} login
	* @param {boolean} fileRead
	* @returns {boolean}
	**/
	setUserRead(login: string, fileRead: boolean): boolean;
	/**
	 * Set the status of the file for a desired user to a desired value. 
	 * 
	 * The file icon in the list view and file view depends on this status. ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} login
	* @param {string} status
	* @returns {boolean}
	**/
	setUserStatus(login: string, status: string): boolean;
	/**
	 * Switch a DocFile to edit mode. 
	 * 
	 * Switching a file to edit mode with this function has the same effect as the "Edit" button in the web surface of DOCUMENTS. This means, a scratch copy of the file is created, and any changes you apply to the file are temporarily stored in the scratch copy - until you commit() your changes back to the original file. There are a few scripting event hooks which disallow the use of this function at all costs: ... 
	 * You should avoid using this function in scripts that are executed inside a workflow (signal exits, decisions etc.). ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	startEdit(): boolean;
	/**
	 * Start a workflow for the DocFile object. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {string} workflowName
	* @returns {boolean}
	**/
	startWorkflow(workflowName: string): boolean;
	/**
	 * Synchronize any changes to the DocFile object back to the real file. 
	 * 
	 * If you want to apply changes to file fields through a script that is executed as a signal exit inside a workflow, you should rather prefer sync() than the startEdit() / commit() instruction pair. ... ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @param {boolean} checkHistoryFields
	* @param {boolean} notifyHitlistChange
	* @param {boolean} updateRefFields
	* @param {boolean} updateModifiedDate
	* @returns {boolean}
	**/
	sync(checkHistoryFields?: boolean, notifyHitlistChange?: boolean, updateRefFields?: boolean, updateModifiedDate?: boolean): boolean;
	/**
	 * Relive a deleted file. 
	 * 
	 * Sets the status active to a file and redraws it from the trash folder. Deleted files are not searchable by a FileResultSet. You can only retrieve deleted files by iterating throw the trash-folder of the users ... ... ... 
	 */
	/**
	* @memberof DocFile
	* @returns {boolean}
	**/
	undeleteFile(): boolean;
	}
}

declare class DocFile implements Documents.DocFile {
	fieldName: any;
	abort(): boolean;
	addDocumentFromFileSystem(pathDocument: string, targetRegister: string, targetFileName: string, deleteDocumentAtFileSystem?: boolean, parseAutoText?: boolean, referencFileToParse?: Documents.DocFile): Documents.Document;
	addPDF(pathCoverXML: string, createCover: boolean, pdfFileName: string, targetRegister: string, sourceRegisterNames: Array<any>): boolean;
	archive(): boolean;
	archive(archiveKey: string): boolean;
	archive(desc: Documents.ArchivingDescription): boolean;
	archiveAndDelete(): boolean;
	cancelWorkflow(): boolean;
	changeFiletype(nameFiletype: string): boolean;
	checkWorkflowReceiveSignal(): boolean;
	clearFollowUpDate(pUser: Documents.SystemUser): boolean;
	commit(): boolean;
	connectFolder(fObj: Documents.Folder): boolean;
	countFields(fieldName: string): number;
	createMonitorFile(asPDF?: boolean, locale?: string): string;
	createStatusFile(asPDF?: boolean, locale?: string): string;
	deleteFile(moveTrash?: boolean, movePool?: boolean, allVersions?: boolean): boolean;
	disconnectArchivedFile(): boolean;
	disconnectFolder(fObj: Documents.Folder): boolean;
	exportXML(pathXML: string, withDocuments: boolean, withStatus?: boolean, withMonitor?: boolean): boolean;
	forwardFile(controlFlowId: string, comment: string): boolean;
	getAllLockingWorkflowSteps(): Documents.WorkflowStepIterator;
	getAllWorkflowSteps(): Documents.WorkflowStepIterator;
	getArchiveKey(withServer?: boolean): string;
	getAsPDF(nameCoverTemplate: string, createCover: boolean, sourceRegisterNames: Array<any>): string;
	getAttribute(attribute: string): string;
	getAutoText(autoText: string): string;
	getCopy(copyMode: string): Documents.DocFile;
	getCreationDate(): Date;
	getCreator(asObject?: boolean): any;
	getCurrentWorkflowStep(): Documents.WorkflowStep;
	getEnumAutoText(autoText: string): Array<any>;
	getFieldAttribute(fieldName: string, attrName: string): string;
	getFieldAutoText(fieldName: string, autoText?: string): string;
	getFieldName(index: number): string;
	getFieldValue(fieldName: string): any;
	getFileOwner(): Documents.SystemUser;
	getFirstLockingWorkflowStep(): Documents.WorkflowStep;
	getid(): string;
	getLastError(): string;
	getLastModificationDate(): Date;
	getLastModifier(): string;
	getOID(oidLow?: boolean): string;
	getOriginal(): Documents.DocFile;
	getReferenceFile(referenceFileField: string): Documents.DocFile;
	getRegisterByName(registerName: string, checkAccessRight?: boolean): Documents.Register;
	getRegisters(type?: string, checkAccessRight?: boolean): Documents.RegisterIterator;
	getTitle(locale?: string): string;
	getUserStatus(login: string): string;
	hasField(fieldName: string): boolean;
	insertStatusEntry(action: string, comment: string): boolean;
	isArchiveFile(): boolean;
	isDeletedFile(): boolean;
	isNewFile(): boolean;
	reactivate(): boolean;
	sendFileAdHoc(receivers: Array<any>, sendMode: string, task: string, backWhenFinished: boolean): boolean;
	sendMail(from: string, templateName: string, to: string, cc: string, addDocs: boolean, bcc: string): boolean;
	setAttribute(attribute: string, value: string): boolean;
	setFieldAttribute(fieldName: string, attrName: string, value: string): boolean;
	setFieldValue(fieldName: string, value: any): boolean;
	setFileOwner(owner: Documents.SystemUser): boolean;
	setFollowUpDate(pUser: Documents.SystemUser, followUpDate: Date, comment: string): boolean;
	setUserRead(login: string, fileRead: boolean): boolean;
	setUserStatus(login: string, status: string): boolean;
	startEdit(): boolean;
	startWorkflow(workflowName: string): boolean;
	sync(checkHistoryFields?: boolean, notifyHitlistChange?: boolean, updateRefFields?: boolean, updateModifiedDate?: boolean): boolean;
	undeleteFile(): boolean;
}



declare namespace Documents {
	/**
	 * The DocHit class presents the hit object collected by a HitResultset. 
	 * 
	 * Objects of this class cannot be created directly. You may access a single DocHit by creating a HitResultset, which provides functions to retrieve its hit entries. ... ... ... 
	 */
	export interface DocHit {
	/**
	 * Field value, addressed by a known column name. 
	 * 
	 * Each field in a DocHit is mapped to an according property. You can read the value on the basis of the column name. ... ... ... ... 
	 */
	columnName: any;
	/**
	 * Get a file from the archive associated to the archive hit. 
	 * 
	 * You need the necessary access rights on the archive side. ... ... ... ... 
	 */
	/**
	* @memberof DocHit
	* @returns {Documents.DocFile}
	**/
	getArchiveFile(): Documents.DocFile;
	/**
	 * Retrieve the key of the associated archive file object. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DocHit
	* @param {boolean} withServer
	* @returns {string}
	**/
	getArchiveKey(withServer?: boolean): string;
	/**
	 * Function to get the blob info of the hit as xml. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof DocHit
	* @returns {string}
	**/
	getBlobInfo(): string;
	/**
	 * Get the file associated to the hit. 
	 * 
	 * If the file does not exist or the user in whose context the script is executed is not allowed to access the file, then the return value will be NULL. ... ... ... 
	 */
	/**
	* @memberof DocHit
	* @returns {Documents.DocFile}
	**/
	getFile(): Documents.DocFile;
	/**
	 * Get the file id of the associated file object. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocHit
	* @returns {string}
	**/
	getFileId(): string;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof DocHit
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Get the local value of an available column. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocHit
	* @param {number} colIndex
	* @returns {string}
	**/
	getLocalValue(colIndex: number): string;
	/**
	 * Get the local value of an available column. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocHit
	* @param {string} colName
	* @returns {string}
	**/
	getLocalValueByName(colName: string): string;
	/**
	 * Get a schema identifier of the archive hit. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocHit
	* @returns {string}
	**/
	getSchema(): string;
	/**
	 * Get the technical value of an available column. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocHit
	* @param {number} colIndex
	* @returns {string}
	**/
	getTechValue(colIndex: number): string;
	/**
	 * Get the technical value of an available column. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof DocHit
	* @param {string} colName
	* @returns {string}
	**/
	getTechValueByName(colName: string): string;
	/**
	 * Function to test whether the associated file is an archive file. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof DocHit
	* @returns {boolean}
	**/
	isArchiveHit(): boolean;
	}
}

declare class DocHit implements Documents.DocHit {
	columnName: any;
	getArchiveFile(): Documents.DocFile;
	getArchiveKey(withServer?: boolean): string;
	getBlobInfo(): string;
	getFile(): Documents.DocFile;
	getFileId(): string;
	getLastError(): string;
	getLocalValue(colIndex: number): string;
	getLocalValueByName(colName: string): string;
	getSchema(): string;
	getTechValue(colIndex: number): string;
	getTechValueByName(colName: string): string;
	isArchiveHit(): boolean;
}



declare namespace Documents {
	/**
	 * This class encapsulates the basic parameters of a Documents search request. 
	 * 
	 * Only the script-exits "OnSearch" and "FillSearchMask" provide access to such an object. See also Context.getQueryParams().
	 */
	export interface DocQueryParams {
	/**
	 * The number of filled in search fields in the query (read-only). 
	 * 
	 * This is in other words the number of conditions in the query. ... ... 
	 */
	filledSearchFieldCount: number;
	/**
	 * The type (or trigger) of the search request (read-only). 
	 * 
	 * See the enumeration constants in this class. If Documents encounters a request, which it cannot categorize exactly, it will return the nearest match with respect to the server's internal interfaces. ... 
	 */
	requestType: number;
	/**
	 * The number of declared search fields in the query (read-only). 
	 * 
	 * This count may include fields from a search mask, which have not been filled in. ... 
	 */
	searchFieldCount: number;
	/**
	 * The (technical) name of the selected search mask, if available (read only). 
	 * 
	 * ... ... ... 
	 */
	searchMaskName: string;
	/**
	 * The number of searchable resources involved in the query (read-only). 
	 * 
	 * ... 
	 */
	sourceCount: number;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof DocQueryParams
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Get a descriptive object of one of the search fields (conditions), which are declared in the query. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DocQueryParams
	* @param {number} index
	* @param {boolean} skipEmpty
	* @returns {Documents.RetrievalField}
	**/
	getSearchField(index: number, skipEmpty: boolean): Documents.RetrievalField;
	/**
	 * Get a descriptive object of one selected search resource. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocQueryParams
	* @param {number} index
	* @returns {Documents.RetrievalSource}
	**/
	getSource(index: number): Documents.RetrievalSource;
	/**
	 * Remove a search resource from the query. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DocQueryParams
	* @param {any} refSource
	* @returns {boolean}
	**/
	removeSource(refSource: any): boolean;
	}
}

declare class DocQueryParams implements Documents.DocQueryParams {
	filledSearchFieldCount: number;
	requestType: number;
	searchFieldCount: number;
	searchMaskName: string;
	sourceCount: number;
	getLastError(): string;
	getSearchField(index: number, skipEmpty: boolean): Documents.RetrievalField;
	getSource(index: number): Documents.RetrievalSource;
	removeSource(refSource: any): boolean;
}



declare namespace Documents {
	/**
	 * The Document class has been added to the DOCUMENTS PortalScripting API to gain full access to the documents stored on registers of a DOCUMENTS file by scripting means. 
	 * 
	 * ... ... 
	 */
	export interface Document {
	/**
	 * The file size of the Document object. 
	 * 
	 * ... ... 
	 */
	bytes: string;
	/**
	 * Info, if the blob is encrypted in the repository. 
	 * 
	 * ... ... 
	 */
	encrypted: boolean;
	/**
	 * The extension of the Document object. 
	 * 
	 * ... ... ... 
	 */
	extension: string;
	/**
	 * The complete filename (name plus extension) of the Document object. 
	 * 
	 * ... ... ... 
	 */
	fullname: string;
	/**
	 * The name (without extension) of the Document object. 
	 * 
	 * ... ... ... 
	 */
	name: string;
	/**
	 * The file size of the Document object. 
	 * 
	 * ... ... ... 
	 */
	size: string;
	/**
	 * Delete the Document object. 
	 * 
	 * With the necessary rights you can delete a document of the file. Do this only on scratch copies (startEdit, commit) ... ... ... ... ... 
	 */
	/**
	* @memberof Document
	* @returns {boolean}
	**/
	deleteDocument(): boolean;
	/**
	 * Download the Document to the server's filesystem for further use. 
	 * 
	 * ... ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof Document
	* @param {string} filePath
	* @param {string} version
	* @returns {string}
	**/
	downloadDocument(filePath?: string, version?: string): string;
	/**
	 * Create a PDF file containing the current Document's contents and return the path in the file system. 
	 * 
	 * The different document types of your documents require the appropriate PDF filter programs to be installed and configured in DOCUMENTS. ... ... ... 
	 */
	/**
	* @memberof Document
	* @returns {string}
	**/
	getAsPDF(): string;
	/**
	 * Get the String value of an attribute of the Document. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Document
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Document
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Returns the object-id. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Document
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getOID(oidLow?: boolean): string;
	/**
	 * Move the Document to another document Register of the file. 
	 * 
	 * With the necessary rights you can move the Document to another document Register of the file. ... ... ... ... ... 
	 */
	/**
	* @memberof Document
	* @param {any} regObj
	* @returns {boolean}
	**/
	moveToRegister(regObj: Documents.Register): boolean;
	/**
	 * Set the String value of an attribute of the Document to the desired value. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Document
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	/**
	 * Upload a file stored on the server's filesystem for replacing or versioning this Document. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Document
	* @param {string} sourceFilePath
	* @param {boolean} versioning
	* @returns {boolean}
	**/
	uploadDocument(sourceFilePath: string, versioning?: boolean): boolean;
	}
}

declare class Document implements Documents.Document {
	bytes: string;
	encrypted: boolean;
	extension: string;
	fullname: string;
	name: string;
	size: string;
	deleteDocument(): boolean;
	downloadDocument(filePath?: string, version?: string): string;
	getAsPDF(): string;
	getAttribute(attribute: string): string;
	getLastError(): string;
	getOID(oidLow?: boolean): string;
	moveToRegister(regObj: Documents.Register): boolean;
	setAttribute(attribute: string, value: string): boolean;
	uploadDocument(sourceFilePath: string, versioning?: boolean): boolean;
}



declare namespace Documents {
	/**
	 * The DocumentIterator class has been added to the DOCUMENTS PortalScripting API to gain full access to the documents stored on registers of a DOCUMENTS file by scripting means. 
	 * 
	 * ... ... ... 
	 */
	export interface DocumentIterator {
	/**
	 * Retrieve the first Document object in the DocumentIterator. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocumentIterator
	* @returns {Documents.Document}
	**/
	first(): Documents.Document;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocumentIterator
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Retrieve the next Document object in the DocumentIterator. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocumentIterator
	* @returns {Documents.Document}
	**/
	next(): Documents.Document;
	/**
	 * Get the amount of Document objects in the DocumentIterator. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DocumentIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class DocumentIterator implements Documents.DocumentIterator {
	first(): Documents.Document;
	getLastError(): string;
	next(): Documents.Document;
	size(): number;
}



declare namespace Documents {
	/**
	 * This class models a single attribute of a DOMElement. 
	 */
	export interface DOMAttr {
	/**
	 * The name of the attribute. 
	 * 
	 * This property is readonly. ... 
	 */
	name: string;
	/**
	 * A flag to test, whether the attribute's value has been explicitly specified. 
	 * 
	 * The flag is true, if the value was explicitly contained in a parsed document. The flag is also true, if the script has set the property "value" of this DOMAttr object. The flag is false, if the value came from a default value declared in a DTD. The flag is readonly. ... 
	 */
	specified: boolean;
	/**
	 * The value of the attribute as a string. 
	 * 
	 * Character and general entity references are replaced with their values. ... ... 
	 */
	value: string;
	}
}

declare class DOMAttr implements Documents.DOMAttr {
	name: string;
	specified: boolean;
	value: string;
}



declare namespace Documents {
	/**
	 * DOMCharacterData represents text-like nodes in the DOM tree. 
	 */
	export interface DOMCharacterData {
	/**
	 * The text data in the node. 
	 * 
	 * ... ... 
	 */
	data: string;
	/**
	 * The text length in the node. 
	 * 
	 * This property is readonly. ... 
	 */
	length: number;
	/**
	 * Append some string to the text. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DOMCharacterData
	* @param {string} arg
	* @returns {void}
	**/
	appendData(arg: string): void;
	/**
	 * Delete a section of the text. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DOMCharacterData
	* @param {number} offset
	* @param {number} count
	* @returns {void}
	**/
	deleteData(offset: number, count: number): void;
	/**
	 * Insert some string into the text. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DOMCharacterData
	* @param {number} offset
	* @param {string} arg
	* @returns {void}
	**/
	insertData(offset: number, arg: string): void;
	/**
	 * Replace a section of the text with a new string. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DOMCharacterData
	* @param {number} offset
	* @param {number} count
	* @param {string} arg
	* @returns {void}
	**/
	replaceData(offset: number, count: number, arg: string): void;
	/**
	 * Split a text node into two. 
	 * 
	 * The new node becomes the next sibling of this node in the tree, and it has got the same nodeType. ... ... ... ... ... 
	 */
	/**
	* @memberof DOMCharacterData
	* @param {number} offset
	* @returns {Documents.DOMCharacterData}
	**/
	splitText(offset: number): Documents.DOMCharacterData;
	/**
	 * Extract a substring of the node's text. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMCharacterData
	* @param {number} offset
	* @param {number} count
	* @returns {string}
	**/
	substringData(offset: number, count: number): string;
	}
}

declare class DOMCharacterData implements Documents.DOMCharacterData {
	data: string;
	length: number;
	appendData(arg: string): void;
	deleteData(offset: number, count: number): void;
	insertData(offset: number, arg: string): void;
	replaceData(offset: number, count: number, arg: string): void;
	splitText(offset: number): Documents.DOMCharacterData;
	substringData(offset: number, count: number): string;
}



declare namespace Documents {
	/**
	 * The DOMDocument is the root of a DOM tree. 
	 * 
	 * The constructor of this class always creates an empty document structure. Use the class DOMParser to obtain the structure of an existing XML. To create any new child nodes, a script must call the appropriate create method of the DOMDocument. It is not possible to create child nodes standalone.
	 */
	export interface DOMDocument {
	/**
	 * The node, which represents the outermost structure element of the document. 
	 * 
	 * This property is readonly. ... ... 
	 */
	documentElement: Documents.DOMElement;
	/**
	 * Create a new atttribute within this document. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DOMDocument
	* @param {string} name
	* @returns {Documents.DOMAttr}
	**/
	createAttribute(name: string): Documents.DOMAttr;
	/**
	 * Create a new CDATA section within this document. 
	 * 
	 * ... ... ... ... ... 
	 * 
	 *  The W3C specifies the return type as "CDATASection". Considering code size (and work) the actual implementation omits a class CDATASection and presents the only additional member (splitText(), inherited from "Text") directly in the second level base class. Scripts can examine DOMNode.nodeType to distinguish different types of character data, if necessary. ... 
	 */
	/**
	* @memberof DOMDocument
	* @param {string} data
	* @returns {Documents.DOMCharacterData}
	**/
	createCDATASection(data: string): Documents.DOMCharacterData;
	/**
	 * Create a new comment node within this document. 
	 * 
	 * ... ... ... ... 
	 * 
	 *  The W3C specifies the return type as "Comment". Considering code size (and work) the actual implementation omits a class DOMComment, which would not get any more members apart from the inherited ones. Scripts can examine DOMNode.nodeType to distinguish different types of character data, if necessary. ... 
	 */
	/**
	* @memberof DOMDocument
	* @param {string} data
	* @returns {Documents.DOMCharacterData}
	**/
	createComment(data: string): Documents.DOMCharacterData;
	/**
	 * Create a new DOMElement within this document. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof DOMDocument
	* @param {string} tagName
	* @returns {Documents.DOMElement}
	**/
	createElement(tagName: string): Documents.DOMElement;
	/**
	 * Create a new text node within this document. 
	 * 
	 * ... ... ... ... 
	 * 
	 *  The W3C specifies the return type as "Text". Considering code size (and work) the actual implementation omits a class DOMText and presents the only additional member (splitText()) directly in the base class. Scripts can examine DOMNode.nodeType to distinguish different types of character data, if necessary. ... 
	 */
	/**
	* @memberof DOMDocument
	* @param {string} data
	* @returns {Documents.DOMCharacterData}
	**/
	createTextNode(data: string): Documents.DOMCharacterData;
	/**
	 * List all DOMElements in the document with a certain tag name. 
	 * 
	 * The order of the elements in the returned list corresponds to a preorder traversal of the DOM tree. ... ... ... ... 
	 */
	/**
	* @memberof DOMDocument
	* @param {string} tagName
	* @returns {Documents.DOMNodeList}
	**/
	getElementsByTagName(tagName: string): Documents.DOMNodeList;
	}
}

declare class DOMDocument implements Documents.DOMDocument {
	documentElement: Documents.DOMElement;
	createAttribute(name: string): Documents.DOMAttr;
	createCDATASection(data: string): Documents.DOMCharacterData;
	createComment(data: string): Documents.DOMCharacterData;
	createElement(tagName: string): Documents.DOMElement;
	createTextNode(data: string): Documents.DOMCharacterData;
	constructor(rootElementName: string);
	getElementsByTagName(tagName: string): Documents.DOMNodeList;
}



declare namespace Documents {
	/**
	 * An object of this class represents a HTML or XML element in the DOM. 
	 */
	export interface DOMElement {
	/**
	 * The name of the element. 
	 * 
	 * This property is readonly. ... 
	 */
	tagName: string;
	/**
	 * Get the string value of an attribute of this element. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DOMElement
	* @param {string} name
	* @returns {string}
	**/
	getAttribute(name: string): string;
	/**
	 * Get an attribute of this element. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof DOMElement
	* @param {string} name
	* @returns {Documents.DOMAttr}
	**/
	getAttributeNode(name: string): Documents.DOMAttr;
	/**
	 * List all DOMElements in the subtree with a certain tag name. 
	 * 
	 * The order of the elements in the returned list corresponds to a preorder traversal of the DOM tree. ... ... ... ... 
	 */
	/**
	* @memberof DOMElement
	* @param {string} tagName
	* @returns {Documents.DOMNodeList}
	**/
	getElementsByTagName(tagName: string): Documents.DOMNodeList;
	/**
	 * Remove an attribute from this element by name. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DOMElement
	* @param {string} name
	* @returns {void}
	**/
	removeAttribute(name: string): void;
	/**
	 * Remove an attribute node from this element. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMElement
	* @param {any} oldAttr
	* @returns {Documents.DOMAttr}
	**/
	removeAttributeNode(oldAttr: Documents.DOMAttr): Documents.DOMAttr;
	/**
	 * Set an attribute of this element by string. 
	 * 
	 * If an attribute of the given name exists, the method only updates its value. Otherwise it creates the attribute. ... ... ... 
	 */
	/**
	* @memberof DOMElement
	* @param {string} name
	* @param {string} value
	* @returns {void}
	**/
	setAttribute(name: string, value: string): void;
	/**
	 * Attach an attribute node to this element. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMElement
	* @param {any} newAttr
	* @returns {Documents.DOMAttr}
	**/
	setAttributeNode(newAttr: Documents.DOMAttr): Documents.DOMAttr;
	}
}

declare class DOMElement implements Documents.DOMElement {
	tagName: string;
	getAttribute(name: string): string;
	getAttributeNode(name: string): Documents.DOMAttr;
	getElementsByTagName(tagName: string): Documents.DOMNodeList;
	removeAttribute(name: string): void;
	removeAttributeNode(oldAttr: Documents.DOMAttr): Documents.DOMAttr;
	setAttribute(name: string, value: string): void;
	setAttributeNode(newAttr: Documents.DOMAttr): Documents.DOMAttr;
}



declare namespace Documents {
	/**
	 * Many of the DOM API functions throw a DOMException, when an error has occurred. 
	 * 
	 * ... 
	 * 
	 *  The class implements the DOMException exception type with the error codes specified in DOM level 2. ... 
	 */
	export interface DOMException {
	/**
	 * An error code. 
	 * 
	 * See the error constants in this class. ... 
	 */
	code: number;
	/**
	 * An error message. 
	 * 
	 * ... 
	 */
	message: string;
	}
}

declare class DOMException implements Documents.DOMException {
	code: number;
	message: string;
}



declare namespace Documents {
	/**
	 * A DOMNamedNodeMap is a kind of index for a set of DOMNodes, in which each node has got a unique name. 
	 * 
	 * The attributes of a DOMElement are organized in a DOMNamedNodeMap. See DOMElement.attributes. The attached nodes can be accessed either by the name or by an integer index. When using an index, the output order of the nodes is not determined. Objects of this class cannot be created directly.
	 */
	export interface DOMNamedNodeMap {
	/**
	 * The number of nodes in the map. 
	 * 
	 * This property is readonly. ... 
	 */
	length: number;
	/**
	 * Get a node from the map by its unique name. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof DOMNamedNodeMap
	* @param {string} name
	* @returns {Documents.DOMNode}
	**/
	getNamedItem(name: string): Documents.DOMNode;
	/**
	 * Get the a node from the map at a certain position. 
	 * 
	 * This is useful only to iterate over all nodes in the map. ... ... ... ... 
	 */
	/**
	* @memberof DOMNamedNodeMap
	* @param {number} index
	* @returns {Documents.DOMNode}
	**/
	item(index: number): Documents.DOMNode;
	/**
	 * Remove a node from the map. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMNamedNodeMap
	* @param {string} name
	* @returns {Documents.DOMNode}
	**/
	removeNamedItem(name: string): Documents.DOMNode;
	/**
	 * Add a node to the map or replace an existing one. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMNamedNodeMap
	* @param {any} arg
	* @returns {Documents.DOMNode}
	**/
	setNamedItem(arg: Documents.DOMNode): Documents.DOMNode;
	}
}

declare class DOMNamedNodeMap implements Documents.DOMNamedNodeMap {
	length: number;
	getNamedItem(name: string): Documents.DOMNode;
	item(index: number): Documents.DOMNode;
	removeNamedItem(name: string): Documents.DOMNode;
	setNamedItem(arg: Documents.DOMNode): Documents.DOMNode;
}



declare namespace Documents {
	/**
	 * DOMNode is the base class of all tree elements in a DOMDocument. 
	 * 
	 * DOMNodes cannot be created with new. Different create methods of DOMDocument can be used to create different types of nodes. ... ... 
	 * 
	 *  The class covers the Node interface of DOM level 1. The underlying native library already supports at least level 2. ... 
	 */
	export interface DOMNode {
	/**
	 * A map of DOM attributes. If this node is not a DOMElement, the value is null. The property is readonly. 
	 */
	attributes: Documents.DOMNamedNodeMap;
	/**
	 * A list of all children of this node. The property is readonly. 
	 */
	childNodes: Documents.DOMNodeList;
	/**
	 * The first child node, otherwise null. The property is readonly. 
	 */
	firstChild: Documents.DOMNode;
	/**
	 * The last child node, otherwise null. The property is readonly. 
	 */
	lastChild: Documents.DOMNode;
	/**
	 * The next sibling node, otherwise null. The property is readonly. 
	 */
	nextSibling: Documents.DOMNode;
	/**
	 * The name of this node. The property is readonly. 
	 */
	nodeName: string;
	/**
	 * The type or subclass of a this node, encoded as an integer. The property is readonly. 
	 */
	nodeType: number;
	/**
	 * The value of the node, which depends on the type. 
	 * 
	 * For several node types, the value is constantly an empty string. See also the ... . ... 
	 */
	nodeValue: string;
	/**
	 * The document, which owns this node. The property is readonly. 
	 */
	ownerDocument: Documents.DOMDocument;
	/**
	 * The parent node or null. The property is readonly. 
	 */
	parentNode: Documents.DOMNode;
	/**
	 * The previous sibling node, otherwise null. The property is readonly. 
	 */
	previousSibling: Documents.DOMNode;
	/**
	 * Append a new node to the list of child nodes. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMNode
	* @param {any} newChild
	* @returns {Documents.DOMNode}
	**/
	appendChild(newChild: Documents.DOMNode): Documents.DOMNode;
	/**
	 * Create a duplicate of this node. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMNode
	* @param {boolean} deep
	* @returns {Documents.DOMNode}
	**/
	cloneNode(deep: boolean): Documents.DOMNode;
	/**
	 * Test, whether a node has got any associated attributes. 
	 * 
	 * ... 
	 */
	/**
	* @memberof DOMNode
	* @returns {boolean}
	**/
	hasAttributes(): boolean;
	/**
	 * Test, whether a node has got any associated child nodes. 
	 * 
	 * ... 
	 */
	/**
	* @memberof DOMNode
	* @returns {boolean}
	**/
	hasChildNodes(): boolean;
	/**
	 * Insert a new node into the list of child nodes. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMNode
	* @param {any} newChild
	* @param {any} refChild
	* @returns {Documents.DOMNode}
	**/
	insertBefore(newChild: Documents.DOMNode, refChild: Documents.DOMNode): Documents.DOMNode;
	/**
	 * Normalize the node ans its subtree. 
	 * 
	 * This method restructures a DOMDocument (or a subtree of it) as if the document was written to a string and reparsed from it. Subsequent "Text" nodes without any interjacent markup are combined into one node, for example. ... 
	 */
	/**
	* @memberof DOMNode
	* @returns {void}
	**/
	normalize(): void;
	/**
	 * Remove a node from the list of child nodes. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMNode
	* @param {any} oldChild
	* @returns {Documents.DOMNode}
	**/
	removeChild(oldChild: Documents.DOMNode): Documents.DOMNode;
	/**
	 * Replace a node in the list of child nodes. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMNode
	* @param {any} newChild
	* @param {any} oldChild
	* @returns {Documents.DOMNode}
	**/
	replaceChild(newChild: Documents.DOMNode, oldChild: Documents.DOMNode): Documents.DOMNode;
	}
}

declare class DOMNode implements Documents.DOMNode {
	attributes: Documents.DOMNamedNodeMap;
	childNodes: Documents.DOMNodeList;
	firstChild: Documents.DOMNode;
	lastChild: Documents.DOMNode;
	nextSibling: Documents.DOMNode;
	nodeName: string;
	nodeType: number;
	nodeValue: string;
	ownerDocument: Documents.DOMDocument;
	parentNode: Documents.DOMNode;
	previousSibling: Documents.DOMNode;
	appendChild(newChild: Documents.DOMNode): Documents.DOMNode;
	cloneNode(deep: boolean): Documents.DOMNode;
	hasAttributes(): boolean;
	hasChildNodes(): boolean;
	insertBefore(newChild: Documents.DOMNode, refChild: Documents.DOMNode): Documents.DOMNode;
	normalize(): void;
	removeChild(oldChild: Documents.DOMNode): Documents.DOMNode;
	replaceChild(newChild: Documents.DOMNode, oldChild: Documents.DOMNode): Documents.DOMNode;
}



declare namespace Documents {
	/**
	 * A dynamic, ordered list of DOMNodes. 
	 * 
	 * These lists always reflect the actual state of the DOM tree, which can differ from that state, when the list has been created. Getting the nodes from the list works with an integer index in square brackets, as if the list object would be an Array. DOMNodeLists cannot be created directly. Some methods or properties of DOMNode and its subclasses can create them.
	 */
	export interface DOMNodeList {
	/**
	 * The actual number of nodes in the list. 
	 * 
	 * ... 
	 */
	length: number;
	/**
	 * Returns the element at a certain position. 
	 * 
	 * This is just the same as using the square brackets on the object. ... ... ... 
	 */
	/**
	* @memberof DOMNodeList
	* @param {number} index
	* @returns {Documents.DOMNode}
	**/
	item(index: number): Documents.DOMNode;
	}
}

declare class DOMNodeList implements Documents.DOMNodeList {
	length: number;
	item(index: number): Documents.DOMNode;
}



declare namespace Documents {
	/**
	 * This class provides basic methods to parse or synthesize XML documents using the Document Object Model (DOM). 
	 * 
	 * ... ... 
	 */
	export interface DOMParser {
	/**
	 * This returns the root of the DOM tree after a successful call of parse(), otherwise null. 
	 */
	/**
	* @memberof DOMParser
	* @returns {Documents.DOMDocument}
	**/
	getDocument(): Documents.DOMDocument;
	/**
	 * This returns the text of the last occurred error. 
	 */
	/**
	* @memberof DOMParser
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Parse an XML document, either from a String or from a local file. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof DOMParser
	* @param {string} xml
	* @param {boolean} fromFile
	* @returns {number}
	**/
	parse(xml: string, fromFile: boolean): number;
	/**
	 * Build an XML document from a DOM tree. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof DOMParser
	* @param {any} node
	* @param {string} path
	* @param {string} encoding
	* @param {boolean} prettyPrint
	* @returns {any}
	**/
	write(node: Documents.DOMNode, path: string, encoding: string, prettyPrint: boolean): any;
	}
}

declare class DOMParser implements Documents.DOMParser {
	constructor();
	getDocument(): Documents.DOMDocument;
	getLastError(): string;
	parse(xml: string, fromFile: boolean): number;
	write(node: Documents.DOMNode, path: string, encoding: string, prettyPrint: boolean): any;
}



declare namespace Documents {
	/**
	 * 
	 * ... Use DOMParser instead. 
	 */
	export interface E4X {
	}
}

declare class E4X implements Documents.E4X {
}



declare namespace Documents {
	/**
	 * The Email class allows to create and send an email. 
	 * 
	 * All the email settings for the principal (such as SMTP server and authentication) are used when sending an email. ... ... 
	 */
	export interface Email {
	/**
	 * Add an attachment to the email. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Email
	* @param {any} attachment
	* @param {string} sourceFilePath
	* @returns {boolean}
	**/
	addAttachment(attachment: any, sourceFilePath: string): boolean;
	/**
	 * Get the description of the last error that occurred. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof Email
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Send the email to recipients. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Email
	* @returns {boolean}
	**/
	send(): boolean;
	/**
	 * Set blind carbon-copy recipients of the email. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Email
	* @param {string} bcc
	* @returns {boolean}
	**/
	setBCC(bcc: string): boolean;
	/**
	 * Set the content of the email. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Email
	* @param {string} body
	* @returns {boolean}
	**/
	setBody(body: string): boolean;
	/**
	 * Set carbon-copy recipients of the email. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Email
	* @param {string} cc
	* @returns {boolean}
	**/
	setCC(cc: string): boolean;
	/**
	 * Decide on whether the email is to be deleted after successful sending. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Email
	* @param {boolean} deleteAfterSending
	* @returns {boolean}
	**/
	setDeleteAfterSending(deleteAfterSending: boolean): boolean;
	/**
	 * Set the sender's email address. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Email
	* @param {string} from
	* @returns {boolean}
	**/
	setFrom(from: string): boolean;
	/**
	 * Set sending time of the email. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Email
	* @param {Date} sendingTime
	* @returns {boolean}
	**/
	setSendingTime(sendingTime: Date): boolean;
	/**
	 * Set the subject of the email. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Email
	* @param {string} subject
	* @returns {boolean}
	**/
	setSubject(subject: string): boolean;
	/**
	 * Set the primary recipients of the email. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Email
	* @param {string} to
	* @returns {boolean}
	**/
	setTo(to: string): boolean;
	}
}

declare class Email implements Documents.Email {
	addAttachment(attachment: any, sourceFilePath: string): boolean;
	constructor(to: string, from: string, subject: string, body: string, cc: string, bcc: string, sendingTime: Date, deleteAfterSending: boolean);
	getLastError(): string;
	send(): boolean;
	setBCC(bcc: string): boolean;
	setBody(body: string): boolean;
	setCC(cc: string): boolean;
	setDeleteAfterSending(deleteAfterSending: boolean): boolean;
	setFrom(from: string): boolean;
	setSendingTime(sendingTime: Date): boolean;
	setSubject(subject: string): boolean;
	setTo(to: string): boolean;
}



declare namespace Documents {
	/**
	 * The File class allows full access to files stored on the Portal Server's filesystem. 
	 * 
	 * ... 
	 */
	export interface File {
	/**
	 * Close the file handle. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof File
	* @returns {boolean}
	**/
	close(): boolean;
	/**
	 * Report whether the file pointer points to EOF (end of file). 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof File
	* @returns {boolean}
	**/
	eof(): boolean;
	/**
	 * Retrieve the error message of the last file access error as String. 
	 * 
	 * The error message (as long there is one) and its language depend on the operating system used on the Portal Server's machine. If there is no error, the method returns null. ... ... 
	 */
	/**
	* @memberof File
	* @returns {string}
	**/
	error(): string;
	/**
	 * Report whether an error occurred while accessing the file handle. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof File
	* @returns {boolean}
	**/
	ok(): boolean;
	/**
	 * Retrieve a block of data from the file, containing a maximum of charsNo byte. 
	 * 
	 * After the method has been performed, the data pointer of the file handle is moved right after the block which has been read. This might as well trigger the EOF flag, if the end of file has been reached. ... ... ... 
	 */
	/**
	* @memberof File
	* @param {number} charsNo
	* @returns {string}
	**/
	read(charsNo: number): string;
	/**
	 * Retrieve one line of data from the file. 
	 * 
	 * This method requires to have the file opened in text mode to work flawlessly, because the end of line is recognized by the linefeed character. After the readLine() method has been performed, the data pointer of the file handle is moved to the beginning of the next line of data. ... ... 
	 */
	/**
	* @memberof File
	* @returns {string}
	**/
	readLine(): string;
	/**
	 * Write binary data to the file. 
	 * 
	 * This requires to have the file handle opened with write access (meaning modes r+, w/w+, a/a+) and binary mode b. ... ... ... ... ... 
	 */
	/**
	* @memberof File
	* @param {number []} byteArray
	* @returns {boolean}
	**/
	write(byteArray: number []): boolean;
	/**
	 * Write data to the file. 
	 * 
	 * This requires to have the file handle opened with write access (meaning modes r+, w/w+, a/a+). You may concatenate as many strings as you want. ... ... ... 
	 */
	/**
	* @memberof File
	* @param {string} a
	* @param {string} b
	* @param {...} 
	* @returns {boolean}
	**/
	write(a: string, b: string, ...restParams: any[]): boolean;
	/**
	 * Write data to the file. 
	 * 
	 * This requires to have the file handle opened with write access (meaning modes r+, w/w+, a/a+). ... ... ... 
	 */
	/**
	* @memberof File
	* @param {string} data
	* @param {number} charsNo
	* @returns {boolean}
	**/
	writeBuffer(data: string, charsNo: number): boolean;
	}
}

declare class File implements Documents.File {
	close(): boolean;
	eof(): boolean;
	error(): string;
	constructor(pathFileName: string, mode: string);
	ok(): boolean;
	read(charsNo: number): string;
	readLine(): string;
	write(byteArray: number []): boolean;
	write(a: string, b: string, ...restParams: any[]): boolean;
	writeBuffer(data: string, charsNo: number): boolean;
}



declare namespace Documents {
	/**
	 * The FileResultset class supports basic functions to loop through a list of DocFile objects. 
	 * 
	 * You can manually create a FileResultset as well as access the (selected) files of a (public) Folder. 
	 */
	export interface FileResultset {
	/**
	 * Retrieve the first DocFile object in the FileResultset. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof FileResultset
	* @returns {Documents.DocFile}
	**/
	first(): Documents.DocFile;
	/**
	 * Returns an array with all file ids in the FileResultset. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof FileResultset
	* @returns {number}
	**/
	getIds(): number;
	/**
	 * Retrieve the last DocFile object in the FileResultset. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof FileResultset
	* @returns {Documents.DocFile}
	**/
	last(): Documents.DocFile;
	/**
	 * Retrieve the next DocFile object in the FileResultset. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof FileResultset
	* @returns {Documents.DocFile}
	**/
	next(): Documents.DocFile;
	/**
	 * Get the amount of DocFile objects in the FileResultset. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof FileResultset
	* @returns {number}
	**/
	size(): number;
	}
}

declare class FileResultset implements Documents.FileResultset {
	first(): Documents.DocFile;
	getIds(): number;
	last(): Documents.DocFile;
	constructor(fileType: string, filter: string, sortOrder: string);
	next(): Documents.DocFile;
	size(): number;
}



declare namespace Documents {
	/**
	 * The Folder class has been added to the DOCUMENTS PortalScripting API to gain full access to the DOCUMENTS folders by scripting means. 
	 * 
	 * ... 
	 */
	export interface Folder {
	/**
	 * This property specifies whether the action 'Archive' is available for the folder. 
	 * 
	 * ... ... 
	 */
	allowArchive: boolean;
	/**
	 * This property specifies whether the action 'Copy to' is available for the folder. 
	 * 
	 * ... ... 
	 */
	allowCopyTo: boolean;
	/**
	 * This property specifies whether the action 'PDF creation (Print)' is available for the folder. 
	 * 
	 * ... ... 
	 */
	allowCreatePDF: boolean;
	/**
	 * This property specifies whether the action 'Delete' is available for the folder. 
	 * 
	 * ... ... 
	 */
	allowDelete: boolean;
	/**
	 * This property specifies whether the action 'Export' is available for the folder. 
	 * 
	 * ... ... 
	 */
	allowExport: boolean;
	/**
	 * This property specifies whether the action 'Forward' is available for the folder. 
	 * 
	 * ... ... 
	 */
	allowForward: boolean;
	/**
	 * This property specifies whether the action 'Store in' is available for the folder. 
	 * 
	 * ... ... 
	 */
	allowMoveTo: boolean;
	/**
	 * The comparator for the first filter of the Folder object. 
	 * 
	 * ... ... 
	 */
	comparator1: string;
	/**
	 * The comparator for the second filter of the Folder object. 
	 * 
	 * ... ... 
	 */
	comparator2: string;
	/**
	 * The comparator for the third filter of the Folder object. 
	 * 
	 * ... ... 
	 */
	comparator3: string;
	/**
	 * The expression of the filter of the folder. 
	 * 
	 * ... ... ... ... 
	 */
	filterExpression: string;
	/**
	 * The field to use for the first filter of the Folder object. 
	 * 
	 * ... ... 
	 */
	filterfieldname1: string;
	/**
	 * The field to use for the second filter of the Folder object. 
	 * 
	 * ... ... 
	 */
	filterfieldname2: string;
	/**
	 * The field to use for the third filter of the Folder object. 
	 * 
	 * ... ... 
	 */
	filterfieldname3: string;
	/**
	 * The filter style of the folder. 
	 * 
	 * There are two filter styles available: ... ... ... 
	 */
	filterStyle: string;
	/**
	 * The icon to use in the folder tree. 
	 * 
	 * ... ... 
	 */
	icon: string;
	/**
	 * The internal id of the Folder object. 
	 * 
	 * ... ... 
	 */
	id: string;
	/**
	 * This property specifies whether the folder is invisible to the users. 
	 * 
	 * ... ... ... 
	 */
	invisible: boolean;
	/**
	 * The entire label defined for the Folder object. 
	 * 
	 * ... ... ... 
	 */
	label: string;
	/**
	 * The technical name of the Folder object. 
	 * 
	 * ... ... 
	 */
	name: string;
	/**
	 * This property specifies whether the folder is available to the users. 
	 * 
	 * ... ... 
	 */
	released: boolean;
	/**
	 * The column used to sort the entries in the folder. 
	 * 
	 * The following sort columns are available: ... ... ... 
	 */
	sortColumn: string;
	/**
	 * This property specifies the sort order of the entries in the folder. 
	 * 
	 * ... ... 
	 */
	sortDescending: boolean;
	/**
	 * The technical name of the custom field used to sort the entries in the folder. 
	 * 
	 * ... ... ... 
	 */
	sortFieldName: string;
	/**
	 * The type of the Folder object. 
	 * 
	 * ... ... 
	 */
	type: string;
	/**
	 * The desired field value to use for the first filter of the Folder object. 
	 * 
	 * ... ... 
	 */
	value1: string;
	/**
	 * The desired field value to use for the second filter of the Folder object. 
	 * 
	 * ... ... 
	 */
	value2: string;
	/**
	 * The desired field value to use for the third filter of the Folder object. 
	 * 
	 * ... ... 
	 */
	value3: string;
	/**
	 * Add a folder access right for the user group defined by an access profile to the folder. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} accessProfileName
	* @param {boolean} allowInsertFiles
	* @param {boolean} allowRemoveFiles
	* @returns {boolean}
	**/
	addAccessProfile(accessProfileName: string, allowInsertFiles: boolean, allowRemoveFiles: boolean): boolean;
	/**
	 * Store a reference to a desired DocFile object in the current Folder. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {any} docFile
	* @returns {boolean}
	**/
	addFile(docFile: Documents.DocFile): boolean;
	/**
	 * Add an EDA server to the filter of the folder. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} serverName
	* @returns {boolean}
	**/
	addFilterEDAServer(serverName: string): boolean;
	/**
	 * Add an EE.i archive to the filter of the folder. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} archiveKey
	* @returns {boolean}
	**/
	addFilterEEiArchive(archiveKey: string): boolean;
	/**
	 * Add an EE.x view to the filter of the folder. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} viewKey
	* @returns {boolean}
	**/
	addFilterEExView(viewKey: string): boolean;
	/**
	 * Add a file type to the filter of the folder. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} fileType
	* @returns {boolean}
	**/
	addFilterFileType(fileType: string): boolean;
	/**
	 * Add a folder access right for a system user to the folder. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} loginName
	* @param {boolean} allowInsertFiles
	* @param {boolean} allowRemoveFiles
	* @returns {boolean}
	**/
	addSystemUser(loginName: string, allowInsertFiles: boolean, allowRemoveFiles: boolean): boolean;
	/**
	 * Add the folder to an outbar. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} outbarName
	* @returns {boolean}
	**/
	addToOutbar(outbarName: string): boolean;
	/**
	 * The current Folder object is duplicated to create a new Folder object. 
	 * 
	 * The new Folder object is placed at the same hierarchical stage as the Folder used as its source object. After the duplication of the Folder you can change all its public attributes, e.g. to modify the filter definition of a dynamic public folder. ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {boolean} includeSubFolders
	* @param {boolean} copyRights
	* @param {boolean} copyActions
	* @returns {Documents.Folder}
	**/
	copyFolder(includeSubFolders: boolean, copyRights: boolean, copyActions: boolean): Documents.Folder;
	/**
	 * Create a new subfolder of the specified folder type. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} name
	* @param {string} type
	* @returns {Documents.Folder}
	**/
	createSubFolder(name: string, type: string): Documents.Folder;
	/**
	 * Delete the folder in DOCUMENTS. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @returns {boolean}
	**/
	deleteFolder(): boolean;
	/**
	 * Retrieve a user-defined action of the Folder. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} actionName
	* @returns {Documents.UserAction}
	**/
	getActionByName(actionName: string): Documents.UserAction;
	/**
	 * Get the String value of an attribute of the Folder. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * Retrieve a FileResultset of all the DocFile objects stored in the Folder. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Folder
	* @returns {Documents.FileResultset}
	**/
	getFiles(): Documents.FileResultset;
	/**
	 * Retrieve the filter file types of the folder. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Folder
	* @returns {Array<any>}
	**/
	getFilterFileTypes(): Array<any>;
	/**
	 * Create a HitResultset, which summarizes all DocFiles in the folder. 
	 * 
	 * This function executes an empty (=unfiltered) search in the folder. It creates a HitResultset, which summarizes all the Folder's files. The Resultset contains the same columns as the folder's default web view. ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @returns {Documents.HitResultset}
	**/
	getHitResultset(): Documents.HitResultset;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Folder
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Get the ergonomic label of the Folder. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} locale
	* @returns {string}
	**/
	getLocaleLabel(locale: string): string;
	/**
	 * Returns the object-id. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getOID(oidLow?: boolean): string;
	/**
	 * Retrieve the position of a subfolder within the subfolder list. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {any} subFolder
	* @returns {number}
	**/
	getPosition(subFolder: Documents.Folder): number;
	/**
	 * Retrieve a FolderIterator containing all Folder objects which represent subfolders of the given Folder. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof Folder
	* @returns {Documents.FolderIterator}
	**/
	getSubFolders(): Documents.FolderIterator;
	/**
	 * Retrieve information whether the Folder is empty or not. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof Folder
	* @returns {boolean}
	**/
	hasFiles(): boolean;
	/**
	 * Remove all folder access rights of the user group defined by an access profile from the folder. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} accessProfileName
	* @returns {boolean}
	**/
	removeAccessProfile(accessProfileName: string): boolean;
	/**
	 * Remove the reference to a desired DocFile object out of the current Folder. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {any} docFile
	* @returns {boolean}
	**/
	removeFile(docFile: Documents.DocFile): boolean;
	/**
	 * Remove an EDA server from the filter of the folder. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} serverName
	* @returns {boolean}
	**/
	removeFilterEDAServer(serverName: string): boolean;
	/**
	 * Remove an EE.i archive from the filter of the folder. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} archiveKey
	* @returns {boolean}
	**/
	removeFilterEEiArchive(archiveKey: string): boolean;
	/**
	 * Remove an EE.x view from the filter of the folder. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} viewKey
	* @returns {boolean}
	**/
	removeFilterEExView(viewKey: string): boolean;
	/**
	 * Remove a file type from the filter of the folder. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} fileType
	* @returns {boolean}
	**/
	removeFilterFileType(fileType: string): boolean;
	/**
	 * Remove the folder from an outbar. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} outbarName
	* @returns {boolean}
	**/
	removeFromOutbar(outbarName: string): boolean;
	/**
	 * Remove all folder access rights of a system user from the folder. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} loginName
	* @returns {boolean}
	**/
	removeSystemUser(loginName: string): boolean;
	/**
	 * Set the script containing the allowed user-defined actions. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} scriptName
	* @returns {boolean}
	**/
	setAllowedActionScript(scriptName: string): boolean;
	/**
	 * Set the String value of an attribute of the Folder to the desired value. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	/**
	 * Set the parent folder of the current folder. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {any} parentFolder
	* @returns {boolean}
	**/
	setParentFolder(parentFolder: Documents.Folder): boolean;
	/**
	 * Place a subfolder at the given position in the subfolder list. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof Folder
	* @param {any} subFolder
	* @param {number} position
	* @returns {boolean}
	**/
	setPosition(subFolder: Documents.Folder, position: number): boolean;
	}
}

declare class Folder implements Documents.Folder {
	allowArchive: boolean;
	allowCopyTo: boolean;
	allowCreatePDF: boolean;
	allowDelete: boolean;
	allowExport: boolean;
	allowForward: boolean;
	allowMoveTo: boolean;
	comparator1: string;
	comparator2: string;
	comparator3: string;
	filterExpression: string;
	filterfieldname1: string;
	filterfieldname2: string;
	filterfieldname3: string;
	filterStyle: string;
	icon: string;
	id: string;
	invisible: boolean;
	label: string;
	name: string;
	released: boolean;
	sortColumn: string;
	sortDescending: boolean;
	sortFieldName: string;
	type: string;
	value1: string;
	value2: string;
	value3: string;
	addAccessProfile(accessProfileName: string, allowInsertFiles: boolean, allowRemoveFiles: boolean): boolean;
	addFile(docFile: Documents.DocFile): boolean;
	addFilterEDAServer(serverName: string): boolean;
	addFilterEEiArchive(archiveKey: string): boolean;
	addFilterEExView(viewKey: string): boolean;
	addFilterFileType(fileType: string): boolean;
	addSystemUser(loginName: string, allowInsertFiles: boolean, allowRemoveFiles: boolean): boolean;
	addToOutbar(outbarName: string): boolean;
	copyFolder(includeSubFolders: boolean, copyRights: boolean, copyActions: boolean): Documents.Folder;
	createSubFolder(name: string, type: string): Documents.Folder;
	deleteFolder(): boolean;
	getActionByName(actionName: string): Documents.UserAction;
	getAttribute(attribute: string): string;
	getFiles(): Documents.FileResultset;
	getFilterFileTypes(): Array<any>;
	getHitResultset(): Documents.HitResultset;
	getLastError(): string;
	getLocaleLabel(locale: string): string;
	getOID(oidLow?: boolean): string;
	getPosition(subFolder: Documents.Folder): number;
	getSubFolders(): Documents.FolderIterator;
	hasFiles(): boolean;
	removeAccessProfile(accessProfileName: string): boolean;
	removeFile(docFile: Documents.DocFile): boolean;
	removeFilterEDAServer(serverName: string): boolean;
	removeFilterEEiArchive(archiveKey: string): boolean;
	removeFilterEExView(viewKey: string): boolean;
	removeFilterFileType(fileType: string): boolean;
	removeFromOutbar(outbarName: string): boolean;
	removeSystemUser(loginName: string): boolean;
	setAllowedActionScript(scriptName: string): boolean;
	setAttribute(attribute: string, value: string): boolean;
	setParentFolder(parentFolder: Documents.Folder): boolean;
	setPosition(subFolder: Documents.Folder, position: number): boolean;
}



declare namespace Documents {
	/**
	 * The FolderIterator class has been added to the DOCUMENTS PortalScripting API to gain full access to the DOCUMENTS folders by scripting means. 
	 * 
	 * ... ... 
	 */
	export interface FolderIterator {
	/**
	 * Retrieve the first Folder object in the FolderIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof FolderIterator
	* @returns {Documents.Folder}
	**/
	first(): Documents.Folder;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof FolderIterator
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Retrieve the next Folder object in the FolderIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof FolderIterator
	* @returns {Documents.Folder}
	**/
	next(): Documents.Folder;
	/**
	 * Get the amount of Folder objects in the FolderIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof FolderIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class FolderIterator implements Documents.FolderIterator {
	first(): Documents.Folder;
	getLastError(): string;
	next(): Documents.Folder;
	size(): number;
}



declare namespace Documents {
	/**
	 * The HitResultset class allows comprehensive search operations in Documents and in connected archives. 
	 * 
	 * While the constructor of this class launches a search operation, the created object stores the results and exposes them as a list of DocHit objects. Compared with the classes FileResultset and ArchiveFileResultset this class has got the following characteristics.... 
	 */
	export interface HitResultset {
	/**
	 * Free most of the memory of the HitResultset. 
	 * 
	 * This function explicitly frees the memory used by the object. The Resultset itself becomes empty. All extracted DocHit objects become invalid and must no longer be used. Long-running scripts should use this function instead of waiting for the garbage collector to clean up. ... ... 
	 */
	/**
	* @memberof HitResultset
	* @returns {any}
	**/
	dispose(): any;
	/**
	 * Get the number of already loaded hits in the set. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof HitResultset
	* @returns {number}
	**/
	fetchedSize(): number;
	/**
	 * Load the next page of hits into the Resultset. 
	 * 
	 * If the object has been created with a non-zero page size, each call of this function appends another page of hits to the resultset until all hits are loaded. ... ... 
	 */
	/**
	* @memberof HitResultset
	* @returns {boolean}
	**/
	fetchNextPage(): boolean;
	/**
	 * Retrieve the first DocHit in the HitResultset. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof HitResultset
	* @returns {Documents.DocHit}
	**/
	first(): Documents.DocHit;
	/**
	 * Retrieve the DocHit object at a given position in the HitResultset. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof HitResultset
	* @param {number} pos
	* @returns {Documents.DocHit}
	**/
	getAt(pos: number): Documents.DocHit;
	/**
	 * Get the number of available columns in the set of hits. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof HitResultset
	* @returns {number}
	**/
	getColumnCount(): number;
	/**
	 * Find the index of a column with a defined name. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof HitResultset
	* @param {string} colName
	* @returns {number}
	**/
	getColumnIndex(colName: string): number;
	/**
	 * List the names of all columns in the set of hits. 
	 * 
	 * ... ... ... 
	 * Columns, which correspond to a DocFile attribute may be given a special constant name instead of the name in an archive's scheme. "TITLE" on EE.x and "110" on EE.i may be presented as "DlcFile_Title", for example. ... 
	 */
	/**
	* @memberof HitResultset
	* @param {boolean} local
	* @returns {Array<any>}
	**/
	getColumnNames(local?: boolean): Array<any>;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof HitResultset
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Function to get a numeric code of the last error, that occurred. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof HitResultset
	* @returns {number}
	**/
	getLastErrorCode(): number;
	/**
	 * Retrieve the next DocHit in the HitResultset. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof HitResultset
	* @returns {Documents.DocHit}
	**/
	next(): Documents.DocHit;
	/**
	 * Get the total amount of hits in the set. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof HitResultset
	* @returns {number}
	**/
	size(): number;
	}
}

declare class HitResultset implements Documents.HitResultset {
	dispose(): any;
	fetchedSize(): number;
	fetchNextPage(): boolean;
	first(): Documents.DocHit;
	getAt(pos: number): Documents.DocHit;
	getColumnCount(): number;
	getColumnIndex(colName: string): number;
	getColumnNames(local?: boolean): Array<any>;
	getLastError(): string;
	getLastErrorCode(): number;
	constructor(searchResources: any, filter: string, sortOrder: string, hitlist: any, pageSize?: number, unlimitedHits?: boolean, fullColumnLength?: boolean, withBlobInfo?: boolean);
	next(): Documents.DocHit;
	size(): number;
}



declare namespace Documents {
	/**
	 * The PropertyCache class is a util class that allows it to store / cache data over the end of the run time of a script. 
	 * 
	 * There is exactly one global implicit object of the class PropertyCache which is named propCache. At the SystemUser and the AccessProfile are also PropertyCache objects (SystemUser.propCache, AccessProfile.propCache). ... ... ... ... 
	 */
	export interface PropertyCache {
	/**
	 * Function to check if a named property exists in the PropertyCache. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof PropertyCache
	* @param {string} name
	* @returns {boolean}
	**/
	hasProperty(name: string): boolean;
	/**
	 * Function to delete a named property exists in the PropertyCache. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof PropertyCache
	* @param {string} name
	* @returns {boolean}
	**/
	removeProperty(name: string): boolean;
	}
}

declare class PropertyCache implements Documents.PropertyCache {
	hasProperty(name: string): boolean;
	removeProperty(name: string): boolean;
}



declare namespace Documents {
	/**
	 * The Register class has been added to the DOCUMENTS PortalScripting API to gain full access to the registers of a DOCUMENTS file by scripting means. 
	 * 
	 * ... 
	 */
	export interface Register {
	/**
	 * The ergonomic label of the Register object. 
	 * 
	 * ... ... ... ... 
	 */
	label: string;
	/**
	 * The technical name of the Register object. 
	 * 
	 * ... ... ... ... 
	 */
	name: string;
	/**
	 * The type of the Register object. 
	 * 
	 * The possible values of the type attribute are listed below: ... ... ... ... ... 
	 */
	type: string;
	/**
	 * Delete a Document at the Register. 
	 * 
	 * With the necessary access rights the user can delete a Document at the Register. ... ... ... ... 
	 */
	/**
	* @memberof Register
	* @param {any} doc
	* @returns {boolean}
	**/
	deleteDocument(doc: Documents.Document): boolean;
	/**
	 * Get the String value of an attribute of the Register. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Register
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * Retrieve a list of all Documents stored on the given Register. 
	 * 
	 * This method is available for documents registers only. You cannot use it with different types of Register objects. ... ... ... ... 
	 */
	/**
	* @memberof Register
	* @returns {Documents.DocumentIterator}
	**/
	getDocuments(): Documents.DocumentIterator;
	/**
	 * Retrieve a FileResultset of all DocFile objects linked to the register. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Register
	* @returns {Documents.FileResultset}
	**/
	getFiles(): Documents.FileResultset;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Register
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Returns the object-id. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Register
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getOID(oidLow?: boolean): string;
	/**
	 * Set the String value of an attribute of the Register to the desired value. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Register
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	/**
	 * Upload a new Document stored on the server's filesystem to the Register. 
	 * 
	 * The filePath parameter must contain not only the directory path but the filename as well. Otherwise the server will take the first file to be found in the given filePath. The registerFileName parameter has the purpose to allow to rename the Document already while uploading it. ... ... ... ... ... ... 
	 */
	/**
	* @memberof Register
	* @param {string} filePath
	* @param {string} registerFileName
	* @returns {Documents.Document}
	**/
	uploadDocument(filePath: string, registerFileName: string): Documents.Document;
	}
}

declare class Register implements Documents.Register {
	label: string;
	name: string;
	type: string;
	deleteDocument(doc: Documents.Document): boolean;
	getAttribute(attribute: string): string;
	getDocuments(): Documents.DocumentIterator;
	getFiles(): Documents.FileResultset;
	getLastError(): string;
	getOID(oidLow?: boolean): string;
	setAttribute(attribute: string, value: string): boolean;
	uploadDocument(filePath: string, registerFileName: string): Documents.Document;
}



declare namespace Documents {
	/**
	 * The RegisterIterator class has been added to the DOCUMENTS PortalScripting API to gain full access to the registers of a DOCUMENTS file by scripting means. 
	 * 
	 * ... ... ... 
	 */
	export interface RegisterIterator {
	/**
	 * Retrieve the first Register object in the RegisterIterator. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof RegisterIterator
	* @returns {Documents.Register}
	**/
	first(): Documents.Register;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof RegisterIterator
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Retrieve the next Register object in the RegisterIterator. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof RegisterIterator
	* @returns {Documents.Register}
	**/
	next(): Documents.Register;
	/**
	 * Get the amount of Register objects in the RegisterIterator. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof RegisterIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class RegisterIterator implements Documents.RegisterIterator {
	first(): Documents.Register;
	getLastError(): string;
	next(): Documents.Register;
	size(): number;
}



declare namespace Documents {
	/**
	 * This class represents one search field or one conditon within a DOCUMENTS search request. 
	 * 
	 * ... ... 
	 */
	export interface RetrievalField {
	/**
	 * The comparison operator / relational operator as a String. 
	 * 
	 * For a list of valid operators see the page: Using filter expressions with FileResultSets. ... ... 
	 */
	compOp: string;
	/**
	 * The actual default value of the field (read-only). 
	 * 
	 * ... ... 
	 */
	defaultValue: string;
	/**
	 * The UI write protection state of the defautValue (read-only) 
	 * 
	 * ... ... 
	 */
	defValWriteProt: boolean;
	/**
	 * The localized label of the field. Maybe an empty String. 
	 * 
	 * ... ... 
	 */
	label: string;
	/**
	 * The name of the look-up field (read-only). 
	 * 
	 * ... 
	 */
	name: string;
	/**
	 * The field type coded as an integer (read-only). 
	 * 
	 * See the enumeration constants in this class. ... 
	 */
	type: number;
	/**
	 * The value sought after. If the operator is "~", it can be a composed value expression. 
	 * 
	 * ... ... 
	 */
	valueExpr: string;
	/**
	 * Place a default value in a search field. 
	 * 
	 * A "FillSearchMask" script-exit can call this function to place default values in an extended search formular. Calls from other scripts will rather deposit a "LastError" message in the superior DocQueryParams object. ... ... ... ... 
	 */
	/**
	* @memberof RetrievalField
	* @param {string} value
	* @param {boolean} writeProtect
	* @returns {any}
	**/
	setDefault(value: string, writeProtect: boolean): any;
	}
}

declare class RetrievalField implements Documents.RetrievalField {
	compOp: string;
	defaultValue: string;
	defValWriteProt: boolean;
	label: string;
	name: string;
	type: number;
	valueExpr: string;
	setDefault(value: string, writeProtect: boolean): any;
}



declare namespace Documents {
	/**
	 * This class describes a searchable resource in the DOCUMENTS retrieval system. 
	 * 
	 * ... 
	 */
	export interface RetrievalSource {
	/**
	 * A identifier of the resource. 
	 * 
	 * For conventional file type resources the identifier equals the technical name of the file type. Archive related identifiers consist of a software dependent key or name plus an "@serverName" appendix. ... ... 
	 */
	resId: string;
	/**
	 * For archive resources: the technical name of the archive server. Otherwise empty. 
	 * 
	 * ... ... 
	 */
	server: string;
	/**
	 * The resource type encoded as an integer. See the enumeration constants in this class. 
	 * 
	 * ... ... 
	 */
	type: number;
	}
}

declare class RetrievalSource implements Documents.RetrievalSource {
	resId: string;
	server: string;
	type: number;
}



declare namespace Documents {
	/**
	 * This class allows asynchronous calling a script from another script. 
	 * 
	 * You should deliberate whether a script call can be waitable or not. Only waitable script calls can be managed e.g. waiting for a script call to finish or checking whether a call is still running. ... 
	 */
	export interface ScriptCall {
	/**
	 * Add a parameter to the called script. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @param {string} name
	* @param {string} value
	* @returns {boolean}
	**/
	addParameter(name: string, value: string): boolean;
	/**
	 * Get the description of the last error that occurred. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Get the return value of the called script. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @returns {string}
	**/
	getReturnValue(): string;
	/**
	 * Check whether the script call is running. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @returns {boolean}
	**/
	isRunning(): boolean;
	/**
	 * Launch the script call. 
	 * 
	 * In case of successful launch the script will be executed in an own context. ... ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @returns {boolean}
	**/
	launch(): boolean;
	/**
	 * Set the execution context file of the called script. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @param {any} docFile
	* @returns {boolean}
	**/
	setDocFile(docFile: Documents.DocFile): boolean;
	/**
	 * Set the execution context document of the called script. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @param {any} doc
	* @returns {boolean}
	**/
	setDocument(doc: Documents.Document): boolean;
	/**
	 * Set the execution context event of the called script. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @param {string} scriptEvent
	* @returns {boolean}
	**/
	setEvent(scriptEvent: string): boolean;
	/**
	 * Set the execution context register of the called script. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @param {any} register
	* @returns {boolean}
	**/
	setRegister(register: Documents.Register): boolean;
	/**
	 * Wait for the script call to finish. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof ScriptCall
	* @returns {boolean}
	**/
	waitForFinish(): boolean;
	}
}

declare class ScriptCall implements Documents.ScriptCall {
	addParameter(name: string, value: string): boolean;
	getLastError(): string;
	getReturnValue(): string;
	isRunning(): boolean;
	launch(): boolean;
	constructor(systemUser: any, scriptName: string, waitable: boolean);
	setDocFile(docFile: Documents.DocFile): boolean;
	setDocument(doc: Documents.Document): boolean;
	setEvent(scriptEvent: string): boolean;
	setRegister(register: Documents.Register): boolean;
	waitForFinish(): boolean;
}



declare namespace Documents {
	/**
	 * The SystemUser class has been added to the DOCUMENTS PortalScripting API to gain full access to the DOCUMENTS users by scripting means. 
	 * 
	 * There are several functions implemented in different classes to retrieve a SystemUser object. ... 
	 */
	export interface SystemUser {
	/**
	 * Annotations right flag in the access mask. 
	 * 
	 * ... ... ... 
	 */
	ANNOTATIONS: number;
	/**
	 * Archive right flag in the access mask. 
	 * 
	 * The bit that specifies the right to archive files. ... ... ... 
	 */
	ARCHIVE: number;
	/**
	 * Change filetype right flag in the access mask. 
	 * 
	 * The bit that specifies the right to change the filetype of a file. ... ... ... 
	 */
	CHANGE_TYPE: number;
	/**
	 * Change workflow right flag in the access mask. 
	 * 
	 * The bit that specifies the right to change a workflow assigned to a file. ... ... ... 
	 */
	CHANGE_WORKFLOW: number;
	/**
	 * Copy right flag in the access mask. 
	 * 
	 * The bit that specifies the right to copy files to a personal or public folder. ... ... ... 
	 */
	COPY: number;
	/**
	 * Create right flag in the access mask. 
	 * 
	 * The bit that specifies the right to create new files. ... ... ... 
	 */
	CREATE: number;
	/**
	 * Create workflow right flag in the access mask. 
	 * 
	 * ... ... ... 
	 */
	CREATE_WORKFLOW: number;
	/**
	 * String value containing the email address of the SystemUser. 
	 * 
	 * ... ... 
	 */
	email: string;
	/**
	 * String value containing the first name of the SystemUser. 
	 * 
	 * ... ... 
	 */
	firstName: string;
	/**
	 * String value containing the last name of the SystemUser. 
	 * 
	 * ... ... 
	 */
	lastName: string;
	/**
	 * String value containing the unique login name of the SystemUser. 
	 * 
	 * ... ... 
	 */
	login: string;
	/**
	 * Mail right flag in the access mask. 
	 * 
	 * The bit that specifies the right to send files via an e-mail system. ... ... ... 
	 */
	MAIL: number;
	/**
	 * Move right flag in the access mask. 
	 * 
	 * The bit that specifies the right to move files to a personal or public folder. ... ... ... 
	 */
	MOVE: number;
	/**
	 * Create PDF right flag in the access mask. 
	 * 
	 * The bit that specifies the right to create a PDF of a file. ... ... ... 
	 */
	PDF: number;
	/**
	 * Access to the property cache of the SystemUser. 
	 * 
	 * ... ... ... ... 
	 */
	propCache: Documents.PropertyCache;
	/**
	 * Read right flag in the access mask. 
	 * 
	 * The bit that specifies the right to see files. ... ... ... 
	 */
	READ: number;
	/**
	 * Remove right flag in the access mask. 
	 * 
	 * The bit that specifies the right to delete files. ... ... ... 
	 */
	REMOVE: number;
	/**
	 * Start workflow flag in the access mask. 
	 * 
	 * ... ... ... 
	 */
	START_WORKFLOW: number;
	/**
	 * Versioning right flag in the access mask. 
	 * 
	 * ... ... ... 
	 */
	VERSION: number;
	/**
	 * Write right flag in the access mask. 
	 * 
	 * The bit that specifies the right for changing index fields or documents in files. ... ... ... 
	 */
	WRITE: number;
	/**
	 * Creates a new CustomProperty for the user. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} name
	* @param {string} type
	* @param {string} value
	* @returns {Documents.CustomProperty}
	**/
	addCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
	/**
	 * Create file type agents for the user. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {any} fileTypes
	* @param {Array<any>} loginNames
	* @returns {boolean}
	**/
	addFileTypeAgent(fileTypes: any, loginNames: Array<any>): boolean;
	/**
	 * Create file type agents for the user, whereby the agents are specified by the desired script. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {any} fileTypes
	* @param {string} scriptName
	* @returns {boolean}
	**/
	addFileTypeAgentScript(fileTypes: any, scriptName: string): boolean;
	/**
	 * Make the SystemUser a member of the desired AccessProfile. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {any} ap
	* @returns {boolean}
	**/
	addToAccessProfile(ap: Documents.AccessProfile): boolean;
	/**
	 * Evaluate if the password is correct. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} passwd
	* @returns {boolean}
	**/
	checkPassword(passwd: string): boolean;
	/**
	 * Move the files from the inbox of an absent user to his agent. 
	 * 
	 * If a Systemuser is set to absent, then all new files are redirected to his agent. The currently existing files (that came into the inbox before the was absent) can be moved to the agent with this method. If the user is not absent this method returns an error. ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {boolean}
	**/
	delegateFilesOfAbsentUser(): boolean;
	/**
	 * Retrieve an access mask whose bits correspond to the user's access rights supported by the given DocFile or filetype. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {any} docFile
	* @returns {number}
	**/
	getAccess(docFile: Documents.DocFile): number;
	/**
	 * Retrieve an AccessProfileIterator representing a list of all AccessProfiles the user is a member of. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {Documents.AccessProfileIterator}
	**/
	getAccessProfiles(): Documents.AccessProfileIterator;
	/**
	 * Get a SystemUserIterator with the agents of the user. 
	 * 
	 * This method returns a SystemUserIterator with the agents of the user, if the user is absent. ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {Documents.SystemUserIterator}
	**/
	getAgents(): Documents.SystemUserIterator;
	/**
	 * Retrieve a list of private and public Folders of the Systemuser. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {Documents.FolderIterator}
	**/
	getAllFolders(): Documents.FolderIterator;
	/**
	 * Get the String value of an attribute of the SystemUser. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * Get back the delegated files. 
	 * 
	 * If the user is not present this method returns an error. ... ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {boolean} removeFromAgentInbox
	* @returns {boolean}
	**/
	getBackDelegatedFiles(removeFromAgentInbox: boolean): boolean;
	/**
	 * Get a CustomPropertyIterator with all CustomProperty of the user. 
	 * 
	 * This method returns a CustomPropertyIterator with the CustomProperty of the user. ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} nameFilter
	* @param {string} typeFilter
	* @returns {Documents.CustomPropertyIterator}
	**/
	getCustomProperties(nameFilter?: string, typeFilter?: string): Documents.CustomPropertyIterator;
	/**
	 * Retrieve a list of individual Folders of the Systemuser. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {Documents.FolderIterator}
	**/
	getIndividualFolders(): Documents.FolderIterator;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Returns the object-id. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getOID(oidLow?: boolean): string;
	/**
	 * Try to retrieve a particular private Folder of the Systemuser. 
	 * 
	 * In addition to the public folders you may define in DOCUMENTS, each DOCUMENTS user has a set of private folders. You might need to access a particular private folder to access its contents, for example. ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} folderType
	* @returns {Documents.Folder}
	**/
	getPrivateFolder(folderType: string): Documents.Folder;
	/**
	 * Get the SystemUser object representing the superior of the user. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {Documents.SystemUser}
	**/
	getSuperior(): Documents.SystemUser;
	/**
	 * Retrieve a list of userdefined inbox Folders of the Systemuser. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {Documents.FolderIterator}
	**/
	getUserdefinedInboxFolders(): Documents.FolderIterator;
	/**
	 * Retrieve information whether the SystemUser is a member of a particular AccessProfile which is identified by its technical name. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} profileName
	* @returns {boolean}
	**/
	hasAccessProfile(profileName: string): boolean;
	/**
	 * Invalidates the server sided cache of the access profiles for the SystemUser. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {boolean}
	**/
	invalidateAccessProfileCache(): boolean;
	/**
	 * Retrieve a list of file types for them an agent exists. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {Array<any>}
	**/
	listAgentFileTypes(): Array<any>;
	/**
	 * Retrieve a list of all agents for the desired file type of the user. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} fileType
	* @returns {Array<any>}
	**/
	listFileTypeAgents(fileType: string): Array<any>;
	/**
	 * Define whether to notify the user by e-mail of files returned from sending. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {boolean} notifying
	* @returns {boolean}
	**/
	notifyFileReturnedFromSending(notifying?: boolean): boolean;
	/**
	 * Define whether to notify the user by e-mail of new files in inbox. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {boolean} notifying
	* @returns {boolean}
	**/
	notifyNewFileInInbox(notifying?: boolean): boolean;
	/**
	 * Remove file type agents from the user. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {any} fileTypes
	* @returns {boolean}
	**/
	removeFileTypeAgent(fileTypes: any): boolean;
	/**
	 * Clear the SystemUser's membership in the given AccessProfile. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {any} ap
	* @returns {boolean}
	**/
	removeFromAccessProfile(ap: Documents.AccessProfile): boolean;
	/**
	 * Clear the user's relation to a superior. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof SystemUser
	* @returns {boolean}
	**/
	resetSuperior(): boolean;
	/**
	 * Set a Systemuser absent or present. 
	 * 
	 * If a Systemuser is on holiday with this function it is possible to set the user absent. After his return you can set him present. You can also define one or more agents for the absent user. The agent will get new files for the absent user in substitution. With the agent list you set the agents for the user (you overwrite the existing agents!). With an empty agent list you remove all agents. ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {boolean} absent
	* @param {boolean} filesDueAbsenceToInfo
	* @param {string []} agents
	* @param {boolean} removeFromAgentInbox
	* @param {Date} from
	* @param {Date} until
	* @returns {boolean}
	**/
	setAbsent(absent: boolean, filesDueAbsenceToInfo?: boolean, agents?: string [], removeFromAgentInbox?: boolean, from?: Date, until?: Date): boolean;
	/**
	 * Define if an absence mail for the absent user will be sent to the sender of the file. 
	 * 
	 * If a Systemuser is absent and get a file in the inbox, an absence mail to the sender of this file can be send. ... ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {boolean} sendMail
	* @param {string} message
	* @returns {boolean}
	**/
	setAbsentMail(sendMail: boolean, message?: string): boolean;
	/**
	 * Set the String value of an attribute of the SystemUser to the desired value. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	/**
	 * Creates a new CustomProperty or modifies a CustomProperty according the name and type for the user. 
	 * 
	 * This method creates or modifies a unique CustomProperty for the user. The combination of the name and the type make the CustomProperty unique for the user. ... ... ... ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} name
	* @param {string} type
	* @param {string} value
	* @returns {Documents.CustomProperty}
	**/
	setOrAddCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
	/**
	 * Set the password of the user represented by the SystemUser object to the desired new value. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {string} newPwd
	* @returns {boolean}
	**/
	setPassword(newPwd: string): boolean;
	/**
	 * Set the SystemUser object representing the superior of the user to the desired object. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUser
	* @param {any} sup
	* @returns {boolean}
	**/
	setSuperior(sup: Documents.SystemUser): boolean;
	}
}

declare class SystemUser implements Documents.SystemUser {
	ANNOTATIONS: number;
	ARCHIVE: number;
	CHANGE_TYPE: number;
	CHANGE_WORKFLOW: number;
	COPY: number;
	CREATE: number;
	CREATE_WORKFLOW: number;
	email: string;
	firstName: string;
	lastName: string;
	login: string;
	MAIL: number;
	MOVE: number;
	PDF: number;
	propCache: Documents.PropertyCache;
	READ: number;
	REMOVE: number;
	START_WORKFLOW: number;
	VERSION: number;
	WRITE: number;
	addCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
	addFileTypeAgent(fileTypes: any, loginNames: Array<any>): boolean;
	addFileTypeAgentScript(fileTypes: any, scriptName: string): boolean;
	addToAccessProfile(ap: Documents.AccessProfile): boolean;
	checkPassword(passwd: string): boolean;
	delegateFilesOfAbsentUser(): boolean;
	getAccess(docFile: Documents.DocFile): number;
	getAccessProfiles(): Documents.AccessProfileIterator;
	getAgents(): Documents.SystemUserIterator;
	getAllFolders(): Documents.FolderIterator;
	getAttribute(attribute: string): string;
	getBackDelegatedFiles(removeFromAgentInbox: boolean): boolean;
	getCustomProperties(nameFilter?: string, typeFilter?: string): Documents.CustomPropertyIterator;
	getIndividualFolders(): Documents.FolderIterator;
	getLastError(): string;
	getOID(oidLow?: boolean): string;
	getPrivateFolder(folderType: string): Documents.Folder;
	getSuperior(): Documents.SystemUser;
	getUserdefinedInboxFolders(): Documents.FolderIterator;
	hasAccessProfile(profileName: string): boolean;
	invalidateAccessProfileCache(): boolean;
	listAgentFileTypes(): Array<any>;
	listFileTypeAgents(fileType: string): Array<any>;
	notifyFileReturnedFromSending(notifying?: boolean): boolean;
	notifyNewFileInInbox(notifying?: boolean): boolean;
	removeFileTypeAgent(fileTypes: any): boolean;
	removeFromAccessProfile(ap: Documents.AccessProfile): boolean;
	resetSuperior(): boolean;
	setAbsent(absent: boolean, filesDueAbsenceToInfo?: boolean, agents?: string [], removeFromAgentInbox?: boolean, from?: Date, until?: Date): boolean;
	setAbsentMail(sendMail: boolean, message?: string): boolean;
	setAttribute(attribute: string, value: string): boolean;
	setOrAddCustomProperty(name: string, type: string, value: string): Documents.CustomProperty;
	setPassword(newPwd: string): boolean;
	setSuperior(sup: Documents.SystemUser): boolean;
}



declare namespace Documents {
	/**
	 * The SystemUserIterator class has been added to the DOCUMENTS PortalScripting API to gain full access to the DOCUMENTS users by scripting means. 
	 * 
	 * The objects of this class represent lists of Systemuser objects and allow to loop through such a list of users. ... 
	 */
	export interface SystemUserIterator {
	/**
	 * Retrieve the first SystemUser object in the SystemUserIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof SystemUserIterator
	* @returns {Documents.SystemUser}
	**/
	first(): Documents.SystemUser;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof SystemUserIterator
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Retrieve the next SystemUser object in the SystemUserIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof SystemUserIterator
	* @returns {Documents.SystemUser}
	**/
	next(): Documents.SystemUser;
	/**
	 * Get the amount of SystemUser objects in the SystemUserIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof SystemUserIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class SystemUserIterator implements Documents.SystemUserIterator {
	first(): Documents.SystemUser;
	getLastError(): string;
	next(): Documents.SystemUser;
	size(): number;
}



declare namespace Documents {
	/**
	 * The UserAction class represents the user-defined action of DOCUMENTS. 
	 * 
	 * ... ... 
	 */
	export interface UserAction {
	/**
	 * The entire label defined for the UserAction object. 
	 * 
	 * ... ... 
	 */
	label: string;
	/**
	 * The technical name of the UserAction object. 
	 * 
	 * ... ... 
	 */
	name: string;
	/**
	 * The scope of the UserAction object. 
	 * 
	 * ... ... 
	 */
	scope: string;
	/**
	 * The type of the UserAction object. 
	 * 
	 * ... ... 
	 */
	type: string;
	/**
	 * The widget identifier of the UserAction object. 
	 * 
	 * ... ... 
	 */
	widget: string;
	/**
	 * Add the user action to a Folder. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof UserAction
	* @param {any} folder
	* @returns {boolean}
	**/
	addToFolder(folder: Documents.Folder): boolean;
	/**
	 * Get the description of the last error that occurred. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof UserAction
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Returns the object-id. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof UserAction
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getOID(oidLow?: boolean): string;
	/**
	 * Retrieve the position of the user action within the user-defined action list of the parent object. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof UserAction
	* @returns {number}
	**/
	getPosition(): number;
	/**
	 * Remove the user action from the parent object. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof UserAction
	* @returns {boolean}
	**/
	remove(): boolean;
	/**
	 * Set the context for a user action of type JSP. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof UserAction
	* @param {string} context
	* @returns {boolean}
	**/
	setContext(context: string): boolean;
	/**
	 * Set the flag whether to create the default workflow for a user action of type NewFile. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof UserAction
	* @param {boolean} createDefaultWorkflow
	* @returns {boolean}
	**/
	setCreateDefaultWorkflow(createDefaultWorkflow: boolean): boolean;
	/**
	 * Set the file type for a user action of type NewFile. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof UserAction
	* @param {string} fileType
	* @returns {boolean}
	**/
	setFileTypeForNewFile(fileType: string): boolean;
	/**
	 * Set the portal script for a user action of type PortalScript. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof UserAction
	* @param {string} scriptName
	* @returns {boolean}
	**/
	setPortalScript(scriptName: string): boolean;
	/**
	 * Place the user action at the given position in the user-defined action list of the parent object. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof UserAction
	* @param {number} position
	* @returns {boolean}
	**/
	setPosition(position: number): boolean;
	}
}

declare class UserAction implements Documents.UserAction {
	label: string;
	name: string;
	scope: string;
	type: string;
	widget: string;
	addToFolder(folder: Documents.Folder): boolean;
	getLastError(): string;
	getOID(oidLow?: boolean): string;
	getPosition(): number;
	remove(): boolean;
	setContext(context: string): boolean;
	setCreateDefaultWorkflow(createDefaultWorkflow: boolean): boolean;
	setFileTypeForNewFile(fileType: string): boolean;
	setPortalScript(scriptName: string): boolean;
	setPosition(position: number): boolean;
	constructor(name: string, label?: string, widget?: string, type?: string, scope?: string);
}



declare namespace Documents {
	/**
	 * The Util class supports some functions that do not need any user or file context. 
	 * 
	 * These functions allow customizable Date/String conversions and other useful stuff. There is exactly ONE implicit object of the class Util which is named util. ... 
	 */
	export interface Util {
	/**
	 * Build version number of the PortalServer. 
	 */
	buildNo: number;
	/**
	 * Database using by the PortalServer. 
	 * 
	 * The following databases are supported by the PortalServer: ... ... ... ... 
	 */
	DB: string;
	/**
	 * Memory model of the PortalServer. 
	 */
	memoryModel: string;
	/**
	 * Main version number of the PortalServer. 
	 * 
	 * This property allows to retrieve the version number of the PortalServer to customize your PortalScripts in dependence of the used PortalServer. For example: ... ... ... ... ... 
	 */
	version: number;
	/**
	 * Decodes a base64 string and returns a string or byte-array. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} value
	* @param {boolean} returnArray
	* @returns {any}
	**/
	base64Decode(value: string, returnArray?: boolean): any;
	/**
	 * Encodes a byte-array or string to base64 and returns the base 64 string. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {any} value
	* @param {boolean} returnArray
	* @returns {string}
	**/
	base64Encode(value: any, returnArray?: boolean): string;
	/**
	 * Plays a beep sound at the PortalServer's system. 
	 * 
	 * For testing purposes a beep sound can be played at the server ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {number} frequency
	* @param {number} duration
	* @returns {void}
	**/
	beep(frequency: number, duration: number): void;
	/**
	 * Concatenate the given PDFs together into one PDF. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {Array<any>} pdfFilePaths
	* @param {boolean} deleteSinglePdfs
	* @returns {string}
	**/
	concatPDF(pdfFilePaths: Array<any>, deleteSinglePdfs?: boolean): string;
	/**
	 * Convert a file to a PDF file and return the path in the file system. 
	 * 
	 * The different file types require the appropriate PDF filter programs to be installed and configured in DOCUMENTS. ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} sourceFilePath
	* @returns {string}
	**/
	convertBlobToPDF(sourceFilePath: string): string;
	/**
	 * Convert a Date object representing a date into a String. 
	 * 
	 * The output String may have any format you like. The second parameter defines the format to configure which part of the date String should match the according properties of the Date object. ... ... ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {Date} timeStamp
	* @param {string} format
	* @returns {string}
	**/
	convertDateToString(timeStamp: Date, format: string): string;
	/**
	 * Convert a String representing a date into a Date object. 
	 * 
	 * The String may contain a date or timestamp in any date format you like. The second parameter defines the format to configure which part of the date String should match the according properties of the Date object. ... ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} dateOrTimeStamp
	* @param {string} format
	* @returns {Date}
	**/
	convertStringToDate(dateOrTimeStamp: string, format: string): Date;
	/**
	 * Encrypt a plain password into an MD5 hash. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} pwPlain
	* @returns {string}
	**/
	cryptPassword(pwPlain: string): string;
	/**
	 * Decode URL parameter from DOCUMENTS Urls. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} encodedParam
	* @returns {string}
	**/
	decodeUrlCompatible(encodedParam: string): string;
	/**
	 * Decrypts a String value hat was encrypted with the method Util.encryptString(String input)
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} input
	* @returns {string}
	**/
	decryptString(input: string): string;
	/**
	 * Delete a file (file system object) at the PortalServer's system. 
	 * 
	 * This functions provides a simple delete method for files on the server's file system. ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} filePath
	* @returns {string}
	**/
	deleteFile(filePath: string): string;
	/**
	 * Encode URL parameter for DOCUMENTS Urls. 
	 * 
	 * Some parameters in DOCUMENTS urls must be encoded. E.g. the archive keys can contain invalid characters like / etc. ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} param
	* @returns {string}
	**/
	encodeUrlCompatible(param: string): string;
	/**
	 * Encrypts a String value with the AES 256 CBC algorithm for symmetric encryption/decryption. 
	 * 
	 * The length of the input String is limited to 1024 bytes. The encrypted value depends on the principal name. Usage is e.g. storing of passwords in the database for authorization against 3rd party web services. ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} input
	* @returns {string}
	**/
	encryptString(input: string): string;
	/**
	 * Copy a file (file system object) at the PortalServer's system. 
	 * 
	 * This functions provides a simple copy method for files on the server's file system. ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} sourceFilePath
	* @param {string} targetFilePath
	* @returns {string}
	**/
	fileCopy(sourceFilePath: string, targetFilePath: string): string;
	/**
	 * Move a file (file system object) at the PortalServer's system from a source file path to the target file path. 
	 * 
	 * This functions provides a simple move method for files on the server's file system. ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} sourceFilePath
	* @param {string} targetFilePath
	* @returns {string}
	**/
	fileMove(sourceFilePath: string, targetFilePath: string): string;
	/**
	 * Retrieve the filesize of a file (file system object) at the PortalServer's system. 
	 * 
	 * This functions returns the filesize of a file. ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} filePath
	* @returns {number}
	**/
	fileSize(filePath: string): number;
	/**
	 * Creates a MD5 checksum for the String value. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} input
	* @returns {string}
	**/
	generateChecksum(input: string): string;
	/**
	 * Retrieving files and subdirectories of a specified directory. 
	 * 
	 * This function retrieve the content (files, subdirectories) of a specified directory of the PortalServer's file system. It expected two empty Arrays, which the function fill with the filenames and subdirectory names. The names will not contain the full path, only the name itself. This function will not work recursively. ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} dirname
	* @param {Array<any>} files
	* @param {Array<any>} subDirs
	* @returns {string}
	**/
	getDir(dirname: string, files: Array<any>, subDirs: Array<any>): string;
	/**
	 * Reads an environment variable of the PortalServer's system. 
	 * 
	 * With this function an environment variable in the server's context can be read. ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} variableName
	* @returns {string}
	**/
	getEnvironment(variableName: string): string;
	/**
	 * Get the content of a file at the PortalServer's system as string in base64 format. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} filePath
	* @returns {string}
	**/
	getFileContentAsString(filePath: string): string;
	/**
	 * Returns the input string enclosed in either double or single quotation marks. 
	 */
	/**
	* @memberof Util
	* @param {string} input
	* @returns {string}
	**/
	getQuoted(input: string): string;
	/**
	 * Retrieve the scriptName with the current line no of this methed. 
	 * 
	 * This functions returns the scriptName and line no for debugging or logging purposes ... ... 
	 */
	/**
	* @memberof Util
	* @returns {string}
	**/
	getSourceLineInfo(): string;
	/**
	 * Get the path to the temporary directory on the Portalserver. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Util
	* @returns {string}
	**/
	getTmpPath(): string;
	/**
	 * Get a unique id from the system. 
	 * 
	 * The length of the id is 40 characters and the id contains only the characters 'a' to 'z'. This unique id can e.g. be used for file names etc. ... ... ... 
	 */
	/**
	* @memberof Util
	* @returns {string}
	**/
	getUniqueId(): string;
	/**
	 * Returns the current usage of private bytes memory of the documensserver process. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof Util
	* @returns {number}
	**/
	getUsedPrivateBytes(): number;
	/**
	 * Generates a hash-based message authentication code (hmac) of a message string using a secret key. 
	 * 
	 * These hash functions are supported: ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} hashfunction
	* @param {string} key
	* @param {string} message
	* @param {boolean} rawOutput
	* @returns {string}
	**/
	hmac(hashfunction: string, key: string, message: string, rawOutput?: boolean): string;
	/**
	 * Checks, if the current blob is encrypted (Repository encryption) or not. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} blobFilePath
	* @returns {boolean}
	**/
	isEncryptedBlob(blobFilePath: string): boolean;
	/**
	 * Returns the number of characters of a UTF-8 string. 
	 * 
	 * You can use this function in a x64 / UTF-8 server to count the characters in a UTF-8 string. ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} value
	* @returns {number}
	**/
	length_u(value: string): number;
	/**
	 * Log a String to the DOCUMENTS server window. 
	 * 
	 * Same as util.out() with additional debugging information (script name and line number) You may output whatever information you want. This function is useful especially for debugging purposes. Be aware that you should run the Portalserver as an application if you want to make use of the out() function, otherwise the output is stored in the Windows Eventlog instead. ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} output
	* @returns {any}
	**/
	log(output: string): any;
	/**
	 * Creates a directory with subdirectories at the PortalServer's file system. 
	 * 
	 * This functions provides a simple method for directory creation on the file system. ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} dirPath
	* @returns {string}
	**/
	makeFullDir(dirPath: string): string;
	/**
	 * Masks all HTML-elements of a String. 
	 * 
	 * This function masks the following characters for HTML output: ... 
	 * If the String is in UTF-8 Format, all UTF-8 characters will be replaced with the according HTML entities. ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} val
	* @param {boolean} isUTF8
	* @returns {string}
	**/
	makeHTML(val: string, isUTF8?: boolean): string;
	/**
	 * Output a String to the Portalserver window. 
	 * 
	 * You may output whatever information you want. This function is useful especially for debugging purposes. Be aware that you should run the Portalserver as an application if you want to make use of the out() function, otherwise the output is stored in the Windows Eventlog instead. ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} output
	* @returns {any}
	**/
	out(output: string): any;
	/**
	 * Search for a String in an Array. 
	 * 
	 * This functions provides a simple search method for Arrays to find the position of a string in an array. ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {Array<any>} theArray
	* @param {string} searchedString
	* @param {number} occurence
	* @returns {number}
	**/
	searchInArray(theArray: Array<any>, searchedString: string, occurence?: number): number;
	/**
	 * Generates the SHA256 hash of any string. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} message
	* @returns {string}
	**/
	sha256(message: string): string;
	/**
	 * Let the PortalScript sleep for a defined duration. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof Util
	* @param {number} duration
	* @returns {void}
	**/
	sleep(duration: number): void;
	/**
	 * Returns a substring of a UTF-8 string. 
	 * 
	 * You can use this function in a x64 / UTF-8 server to get a substring of a UTF-8 string. ... ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} value
	* @param {number} startIndex
	* @param {number} length
	* @returns {string}
	**/
	substr_u(value: string, startIndex: number, length: number): string;
	/**
	 * Transcode a String from encoding a to encoding b. 
	 */
	/**
	* @memberof Util
	* @param {string} nameSourceEncoding
	* @param {string} text
	* @param {string} nameTargetEncoding
	* @returns {string}
	**/
	transcode(nameSourceEncoding: string, text: string, nameTargetEncoding: string): string;
	/**
	 * Delete a physical file on the server's file system. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof Util
	* @param {string} filePath
	* @returns {boolean}
	**/
	unlinkFile(filePath: string): boolean;
	}
}
declare var util: Documents.Util;


declare namespace Documents {
	/**
	 * The WorkflowStep class allows access to the according object type of DOCUMENTS. 
	 * 
	 * You may access WorkflowStep objects by the different methods described in the DocFile chapter. ... 
	 */
	export interface WorkflowStep {
	/**
	 * String value containing the locking user group of the WorkflowStep. 
	 * 
	 * ... ... ... 
	 */
	executiveGroup: string;
	/**
	 * String value containing the type of recipient of the WorkflowStep. 
	 * 
	 * ... ... ... 
	 */
	executiveType: string;
	/**
	 * String value containing the locking user of the WorkflowStep. 
	 * 
	 * ... ... ... 
	 */
	executiveUser: string;
	/**
	 * String value containing the unique internal ID of the first outgoing ControlFlow. 
	 * 
	 * ... ... ... 
	 */
	firstControlFlow: string;
	/**
	 * String value containing the unique internal ID of the WorkflowStep. 
	 * 
	 * ... ... ... 
	 */
	id: string;
	/**
	 * String value containing the technical name of the WorkflowStep. 
	 * 
	 * ... ... ... 
	 */
	name: string;
	/**
	 * String value containing the status of the WorkflowStep. 
	 * 
	 * ... ... ... 
	 */
	status: string;
	/**
	 * String value containing the unique internal ID of the Workflow template. 
	 * 
	 * ... ... ... 
	 */
	templateId: string;
	/**
	 * Forward the file to its next WorkflowStep. 
	 * 
	 * This requires the internal ID (as a String value) of the ControlFlow you want the file to pass through. The optional comment parameter will be stored as a comment in the file's monitor. ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @param {string} controlFlowId
	* @param {string} comment
	* @returns {boolean}
	**/
	forwardFile(controlFlowId: string, comment?: string): boolean;
	/**
	 * Get the String value of an attribute of the WorkflowStep. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @param {string} attribute
	* @returns {string}
	**/
	getAttribute(attribute: string): string;
	/**
	 * Retrieve an iterator representing a list of all outgoing ControlFlows of the WorkflowStep. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @returns {Documents.ControlFlowIterator}
	**/
	getControlFlows(): Documents.ControlFlowIterator;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Returns the object-id. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @param {boolean} oidLow
	* @returns {string}
	**/
	getOID(oidLow?: boolean): string;
	/**
	 * Retrieve the name of the workflow, the WorkflowStep belongs to. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @returns {string}
	**/
	getWorkflowName(): string;
	/**
	 * Retrieve a property value of the workflow action, the WorkflowStep belongs to. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @param {string} propertyName
	* @returns {string}
	**/
	getWorkflowProperty(propertyName: string): string;
	/**
	 * Retrieve the version number of the workflow, the WorkflowStep belongs to. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @returns {string}
	**/
	getWorkflowVersion(): string;
	/**
	 * Set the String value of an attribute of the WorkflowStep to the desired value. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @param {string} attribute
	* @param {string} value
	* @returns {boolean}
	**/
	setAttribute(attribute: string, value: string): boolean;
	/**
	 * Reassign the current WorkflowStep object to the given user group. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @param {string} accessProfileName
	* @returns {boolean}
	**/
	setNewExecutiveGroup(accessProfileName: string): boolean;
	/**
	 * Reassigns the current WorkflowStep object to the given user. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof WorkflowStep
	* @param {string} loginUser
	* @returns {boolean}
	**/
	setNewExecutiveUser(loginUser: string): boolean;
	}
}

declare class WorkflowStep implements Documents.WorkflowStep {
	executiveGroup: string;
	executiveType: string;
	executiveUser: string;
	firstControlFlow: string;
	id: string;
	name: string;
	status: string;
	templateId: string;
	forwardFile(controlFlowId: string, comment?: string): boolean;
	getAttribute(attribute: string): string;
	getControlFlows(): Documents.ControlFlowIterator;
	getLastError(): string;
	getOID(oidLow?: boolean): string;
	getWorkflowName(): string;
	getWorkflowProperty(propertyName: string): string;
	getWorkflowVersion(): string;
	setAttribute(attribute: string, value: string): boolean;
	setNewExecutiveGroup(accessProfileName: string): boolean;
	setNewExecutiveUser(loginUser: string): boolean;
}



declare namespace Documents {
	/**
	 * The WorkflowStepIterator class has been added to the DOCUMENTS PortalScripting API to gain full control over a file's workflow by scripting means. 
	 * 
	 * You may access WorkflowStepIterator objects by the getAllLockingWorkflowSteps() method described in the DocFile chapter. ... ... 
	 */
	export interface WorkflowStepIterator {
	/**
	 * Retrieve the first WorkflowStep object in the WorkflowStepIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof WorkflowStepIterator
	* @returns {Documents.WorkflowStep}
	**/
	first(): Documents.WorkflowStep;
	/**
	 * Retrieve the next WorkflowStep object in the WorkflowStepIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof WorkflowStepIterator
	* @returns {Documents.WorkflowStep}
	**/
	next(): Documents.WorkflowStep;
	/**
	 * Get the amount of WorkflowStep objects in the WorkflowStepIterator. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof WorkflowStepIterator
	* @returns {number}
	**/
	size(): number;
	}
}

declare class WorkflowStepIterator implements Documents.WorkflowStepIterator {
	first(): Documents.WorkflowStep;
	next(): Documents.WorkflowStep;
	size(): number;
}



declare namespace Documents {
	/**
	 * The XMLExport class allows to export DOCUMENTS elements as an XML file by scripting means. 
	 * 
	 * The exported XML structure may then, for example, be used for further manipulation by an external ERP environment. The following elements can be exported: ... 
	 * The XML files may also be reimported into another (or the same) Portal environment by the Docimport application for DocFile objects and by the XML-import of DOCUMENTS Manager for the remaining elements, respectively. ... ... ... ... ... 
	 */
	export interface XMLExport {
	/**
	 * Add the desired access profile to the XMLExport. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {any} accessProfile
	* @returns {boolean}
	**/
	addAccessProfile(accessProfile: any): boolean;
	/**
	 * Add the desired alias to the XMLExport. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} aliasName
	* @returns {boolean}
	**/
	addAlias(aliasName: string): boolean;
	/**
	 * Add the desired distribution list to the XMLExport. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} distributionListName
	* @returns {boolean}
	**/
	addDistributionList(distributionListName: string): boolean;
	/**
	 * Add the DOCUMENTS settings data to the XMLExport. 
	 * 
	 * ... ... 
	 */
	/**
	* @memberof XMLExport
	* @returns {boolean}
	**/
	addDocumentsSettings(): boolean;
	/**
	 * Add the desired editor (fellow) to the XMLExport. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {any} editor
	* @param {boolean} includePrivateFolders
	* @returns {boolean}
	**/
	addFellow(editor: any, includePrivateFolders?: boolean): boolean;
	/**
	 * Add the desired DocFile object to the XMLExport. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {any} docFile
	* @param {any} exportCondition
	* @returns {boolean}
	**/
	addFile(docFile: Documents.DocFile, exportCondition?: any): boolean;
	/**
	 * Add the desired file type to the XMLExport. 
	 * 
	 * The XML output is able to update the same file type (Update-XML). ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} fileTypeName
	* @returns {boolean}
	**/
	addFileType(fileTypeName: string): boolean;
	/**
	 * Add the desired filing plan to the XMLExport. 
	 * 
	 * The XML output is able to update the same filing plan (Update-XML). ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} filingPlanName
	* @returns {boolean}
	**/
	addFilingPlan(filingPlanName: string): boolean;
	/**
	 * Add the desired Folder object to the XMLExport. 
	 * 
	 * This function is able to add the folder structure or the files in the folder to the XMLExport. ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {any} folder
	* @param {boolean} exportStructure
	* @param {any} exportCondition
	* @returns {boolean}
	**/
	addFolder(folder: Documents.Folder, exportStructure: boolean, exportCondition: any): boolean;
	/**
	 * Add the desired number range alias to the XMLExport. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} name
	* @param {boolean} withCounter
	* @returns {boolean}
	**/
	addNumberRange(name: string, withCounter?: boolean): boolean;
	/**
	 * Add the desired outbar to the XMLExport. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} outbarName
	* @returns {boolean}
	**/
	addOutbar(outbarName: string): boolean;
	/**
	 * Add the desired user account (not fellow) to the XMLExport. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {any} userAccount
	* @param {boolean} includePrivateFolders
	* @returns {boolean}
	**/
	addPartnerAccount(userAccount: any, includePrivateFolders?: boolean): boolean;
	/**
	 * Add all PortalScripts with the desired name pattern to the XMLExport. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} namePattern
	* @param {string} format
	* @returns {boolean}
	**/
	addPortalScript(namePattern: string, format?: string): boolean;
	/**
	 * Defines a PortalScript, that will be executed after the XML-import. 
	 * 
	 * This method does not export the content of a PortalScript (see XMLExport.addPortalScript()), but executes a PortalScript at the end of the XML-Import of the whole xml file. ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} nameScript
	* @returns {boolean}
	**/
	addPortalScriptCall(nameScript: string): boolean;
	/**
	 * Add all PortalScripts belonging to the desired category to the XMLExport. 
	 * 
	 * ... ... ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} nameCategory
	* @param {string} format
	* @returns {boolean}
	**/
	addPortalScriptsFromCategory(nameCategory: string, format?: string): boolean;
	/**
	 * Add the desired SystemUser (user account or fellow) to the XMLExport. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {any} systemUser
	* @param {boolean} includePrivateFolders
	* @returns {boolean}
	**/
	addSystemUser(systemUser: any, includePrivateFolders?: boolean): boolean;
	/**
	 * Add the desired workflow to the XMLExport. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @param {string} workflowName
	* @returns {boolean}
	**/
	addWorkflow(workflowName: string): boolean;
	/**
	 * Remove all references to DocFile objects from the XMLExport object. 
	 * 
	 * After the execution of this method the XMLExport object is in the same state as right after its construction. ... ... 
	 */
	/**
	* @memberof XMLExport
	* @returns {boolean}
	**/
	clearXML(): boolean;
	/**
	 * Function to get the description of the last error that occurred. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof XMLExport
	* @returns {string}
	**/
	getLastError(): string;
	/**
	 * Retrieve the XML structure of the DocFile objects already added to the XMLExport. 
	 * 
	 * The XML structure is returned as a String, so it is possible to further manipulate it (e.g. with the E4X scripting extension (not discussed in this documentation) before outputting it to its final destination. ... ... 
	 */
	/**
	* @memberof XMLExport
	* @returns {string}
	**/
	getXML(): string;
	/**
	 * Performs the final save process of the XML structure. 
	 * 
	 * Not earlier than when executing this instruction the XML file is created in the target file path. ... ... 
	 */
	/**
	* @memberof XMLExport
	* @returns {boolean}
	**/
	saveXML(): boolean;
	}
}

declare class XMLExport implements Documents.XMLExport {
	addAccessProfile(accessProfile: any): boolean;
	addAlias(aliasName: string): boolean;
	addDistributionList(distributionListName: string): boolean;
	addDocumentsSettings(): boolean;
	addFellow(editor: any, includePrivateFolders?: boolean): boolean;
	addFile(docFile: Documents.DocFile, exportCondition?: any): boolean;
	addFileType(fileTypeName: string): boolean;
	addFilingPlan(filingPlanName: string): boolean;
	addFolder(folder: Documents.Folder, exportStructure: boolean, exportCondition: any): boolean;
	addNumberRange(name: string, withCounter?: boolean): boolean;
	addOutbar(outbarName: string): boolean;
	addPartnerAccount(userAccount: any, includePrivateFolders?: boolean): boolean;
	addPortalScript(namePattern: string, format?: string): boolean;
	addPortalScriptCall(nameScript: string): boolean;
	addPortalScriptsFromCategory(nameCategory: string, format?: string): boolean;
	addSystemUser(systemUser: any, includePrivateFolders?: boolean): boolean;
	addWorkflow(workflowName: string): boolean;
	clearXML(): boolean;
	getLastError(): string;
	getXML(): string;
	constructor(pathFileName: string, exportDocFile?: boolean);
	saveXML(): boolean;
}



declare namespace Documents {
	/**
	 * The XMLExportDescription class has been added to the DOCUMENTS PortalScripting API to improve the XML Export process of DOCUMENTS files by scripting means. 
	 * 
	 * For instance this allows to use different target archives for each file as well as to influence the archiving process by the file's contents itself. The XMLExportDescription object can only be used as parameter for the method XMLExport::addFile(XMLExportDescription) ... 
	 */
	export interface XMLExportDescription {
	/**
	 * Boolean value whether export the create timestamp of the file. 
	 * 
	 * ... 
	 */
	exportCreatedAt: boolean;
	/**
	 * Boolean value whether export the id of the file. 
	 * 
	 * ... 
	 */
	exportFileId: boolean;
	/**
	 * Boolean value whether export the timestamp of the last modification of the file. 
	 * 
	 * ... 
	 */
	exportLastModifiedAt: boolean;
	/**
	 * Boolean value whether export the name of the last editor of the file. 
	 * 
	 * ... 
	 */
	exportLastModifiedBy: boolean;
	/**
	 * Boolean value whether export the name of the owner of the file. 
	 * 
	 * ... 
	 */
	exportOwner: boolean;
	}
}

declare class XMLExportDescription implements Documents.XMLExportDescription {
	exportCreatedAt: boolean;
	exportFileId: boolean;
	exportLastModifiedAt: boolean;
	exportLastModifiedBy: boolean;
	exportOwner: boolean;
	constructor();
}



declare namespace Documents {
	/**
	 * The XMLHTTPRequest class represents a HTTP request. 
	 * 
	 * Though the name of this class traditionally refers to XML, it can be used to transfer arbitrary strings or binary data. The interface is based on the definition of the class IXMLHTTPRequest from MSXML. To send a HTTP request the following steps are needed: ... ... ... ... ... 
	 */
	export interface XMLHTTPRequest {
	/**
	 * Flag indicating whether asynchronous requests are possible on the used plattform. 
	 * 
	 * ... ... 
	 */
	canAsync: boolean;
	/**
	 * Flag indicating whether the implementation on the used plattform allows the direct specifying of a proxy server. 
	 * 
	 * ... ... 
	 */
	canProxy: boolean;
	/**
	 * The constant 4 for XMLHTTPRequest.readyState. 
	 */
	COMPLETED: number;
	/**
	 * Optional File size indicator for sending pure sequential files. 
	 * 
	 * When uploading files, the send() function usually detects the file size and forwards it to lower APIs. This is helpful in most cases, because old simple HTTP servers do not support the transfer mode "chunked". Web services may reject uploads without an announced content-length, too. 
	 * 
	 *  However, the auto-detection will fail, if a given file is not rewindable (a named pipe, for instance). To avoid errors this property should be set before sending such a special file. After the transmission the property should be either set to "-1" or deleted. 
	 * 
	 * The value is interpreted in the following way.... 
	 */
	FileSizeHint: number;
	/**
	 * The constant 3 for XMLHTTPRequest.readyState. 
	 */
	INTERACTIVE: number;
	/**
	 * The constant 1 for XMLHTTPRequest.readyState. 
	 */
	NOTSENT: number;
	/**
	 * The current state of the asynchronous request. 
	 * 
	 * The following states are available: ... ... ... 
	 */
	readyState: number;
	/**
	 * The response received from the HTTP server or null if no response is received. 
	 * 
	 * ... ... ... ... 
	 */
	response: any;
	/**
	 * An optional writable file for streaming a large response. 
	 * 
	 * To achieve an efficient download scripts can create a writable File an attach it to the request. The complete response will then be written into this file. The value of the response property, however, will be truncated after the first few kBytes.
	 */
	responseFile: Documents.File;
	/**
	 * Preferred output format of the response property (optional). 
	 * 
	 * By default, the object expects text responses and stores them in a String. If the application expects binary data, it may request an ArrayBuffer by setting this property to "arraybuffer". ... ... ... 
	 */
	responseType: string;
	/**
	 * The constant 2 for XMLHTTPRequest.readyState. 
	 */
	SENT: number;
	/**
	 * The HTTP status code of the request. 
	 * 
	 * ... ... ... 
	 */
	status: number;
	/**
	 * The HTTP status text of the request. 
	 * 
	 * ... ... ... 
	 */
	statusText: string;
	/**
	 * The constant 0 for XMLHTTPRequest.readyState. 
	 * 
	 * In this state the method open() has not been called.
	 */
	UNINITIALIZED: number;
	/**
	 * Abort an asynchronous request if it already has been sent. 
	 * 
	 * ... ... ... 
	 */
	/**
	* @memberof XMLHTTPRequest
	* @returns {boolean}
	**/
	abort(): boolean;
	/**
	 * Add a HTTP header to the request to be sent. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof XMLHTTPRequest
	* @param {string} name
	* @param {string} value
	* @returns {boolean}
	**/
	addRequestHeader(name: string, value: string): boolean;
	/**
	 * Get all response headers as a string. 
	 */
	/**
	* @memberof XMLHTTPRequest
	* @returns {string}
	**/
	getAllResponseHeaders(): string;
	/**
	 * Get the value of the specified response header. 
	 * 
	 * ... ... ... ... 
	 */
	/**
	* @memberof XMLHTTPRequest
	* @param {string} name
	* @returns {string}
	**/
	getResponseHeader(name: string): string;
	/**
	 * Initialize a HTTP request. 
	 * 
	 * ... ... ... ... ... 
	 */
	/**
	* @memberof XMLHTTPRequest
	* @param {string} method
	* @param {string} url
	* @param {boolean} async
	* @param {string} user
	* @param {string} passwd
	* @returns {boolean}
	**/
	open(method: string, url: string, async?: boolean, user?: string, passwd?: string): boolean;
	/**
	 * Send the request to the HTTP server. 
	 * 
	 * The request must be prepared via open() before.
	 */
	/**
	* @memberof XMLHTTPRequest
	* @param {string} content
	* @returns {boolean}
	**/
	send(content?: string): boolean;
	}
}

declare class XMLHTTPRequest implements Documents.XMLHTTPRequest {
	canAsync: boolean;
	canProxy: boolean;
	COMPLETED: number;
	FileSizeHint: number;
	INTERACTIVE: number;
	NOTSENT: number;
	readyState: number;
	response: any;
	responseFile: Documents.File;
	responseType: string;
	SENT: number;
	status: number;
	statusText: string;
	UNINITIALIZED: number;
	abort(): boolean;
	addRequestHeader(name: string, value: string): boolean;
	getAllResponseHeaders(): string;
	getResponseHeader(name: string): string;
	open(method: string, url: string, async?: boolean, user?: string, passwd?: string): boolean;
	send(content?: string): boolean;
	constructor(proxy?: string, proxyPort?: number, proxyUser?: string, proxyPasswd?: string);
}

