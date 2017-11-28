export const mapping = {
  "name": [
    "AccessProfile",
    "ArchiveServer",
    "UserAction",
    "ArchiveConnectionBlob",
    "ControlFlow",
    "CustomProperty",
    "Document",
    "DOMAttr",
    "Folder",
    "Register",
    "RetrievalField",
    "WorkflowStep"
  ],
  "propCache": [
    "AccessProfile",
    "SystemUser"
  ],
  "addCustomProperty": [
    "AccessProfile",
    "module:context",
    "SystemUser"
  ],
  "getAttribute": [
    "AccessProfile",
    "ArchiveServer",
    "ControlFlow",
    "CustomProperty",
    "DocFile",
    "Document",
    "DOMElement",
    "Folder",
    "Register",
    "SystemUser",
    "WorkflowStep"
  ],
  "getCustomProperties": [
    "AccessProfile",
    "module:context",
    "SystemUser"
  ],
  "getLastError": [
    "AccessProfile",
    "ArchiveConnection",
    "ArchiveFileResultset",
    "ArchiveServer",
    "ArchiveServerIterator",
    "DBConnection",
    "DBResultSet",
    "DOMParser",
    "Email",
    "HitResultset",
    "ScriptCall",
    "UserAction",
    "XMLExport",
    "module:context",
    "AccessProfileIterator",
    "ArchiveConnectionBlob",
    "ControlFlow",
    "CustomProperty",
    "DocFile",
    "DocHit",
    "DocQueryParams",
    "Document",
    "DocumentIterator",
    "Folder",
    "FolderIterator",
    "Register",
    "RegisterIterator",
    "SystemUser",
    "SystemUserIterator",
    "WorkflowStep"
  ],
  "getOID": [
    "AccessProfile",
    "ArchiveServer",
    "UserAction",
    "DocFile",
    "Document",
    "Folder",
    "Register",
    "SystemUser",
    "WorkflowStep"
  ],
  "getSystemUsers": [
    "AccessProfile",
    "module:context"
  ],
  "setAttribute": [
    "AccessProfile",
    "ArchiveServer",
    "ControlFlow",
    "CustomProperty",
    "DocFile",
    "Document",
    "DOMElement",
    "Folder",
    "Register",
    "SystemUser",
    "WorkflowStep"
  ],
  "setOrAddCustomProperty": [
    "AccessProfile",
    "module:context",
    "SystemUser"
  ],
  "id": [
    "ArchiveConnection",
    "ControlFlow",
    "Folder",
    "WorkflowStep"
  ],
  "downloadBlob": [
    "ArchiveConnection"
  ],
  "downloadBlobs": [
    "ArchiveConnection"
  ],
  "putBlob": [
    "ArchiveConnection"
  ],
  "queryRawEEx": [
    "ArchiveConnection"
  ],
  "sendEbisRequest": [
    "ArchiveConnection"
  ],
  "sendRequest": [
    "ArchiveConnection"
  ],
  "first": [
    "ArchiveFileResultset",
    "ArchiveServerIterator",
    "FileResultset",
    "HitResultset",
    "AccessProfileIterator",
    "ArchiveConnectionBlobIterator",
    "ControlFlowIterator",
    "CustomPropertyIterator",
    "DocumentIterator",
    "FolderIterator",
    "RegisterIterator",
    "SystemUserIterator",
    "WorkflowStepIterator"
  ],
  "last": [
    "ArchiveFileResultset",
    "FileResultset"
  ],
  "next": [
    "ArchiveFileResultset",
    "ArchiveServerIterator",
    "DBResultSet",
    "FileResultset",
    "HitResultset",
    "AccessProfileIterator",
    "ArchiveConnectionBlobIterator",
    "ControlFlowIterator",
    "CustomPropertyIterator",
    "DocumentIterator",
    "FolderIterator",
    "RegisterIterator",
    "SystemUserIterator",
    "WorkflowStepIterator"
  ],
  "size": [
    "ArchiveFileResultset",
    "ArchiveServerIterator",
    "FileResultset",
    "HitResultset",
    "AccessProfileIterator",
    "ArchiveConnectionBlob",
    "ArchiveConnectionBlobIterator",
    "ControlFlowIterator",
    "CustomPropertyIterator",
    "Document",
    "DocumentIterator",
    "FolderIterator",
    "RegisterIterator",
    "SystemUserIterator",
    "WorkflowStepIterator"
  ],
  "getArchiveConnection": [
    "ArchiveServer",
    "module:context"
  ],
  "submitChanges": [
    "ArchiveServer"
  ],
  "archiveMonitor": [
    "ArchivingDescription"
  ],
  "archiveServer": [
    "ArchivingDescription"
  ],
  "archiveStatus": [
    "ArchivingDescription"
  ],
  "targetArchive": [
    "ArchivingDescription"
  ],
  "targetSchema": [
    "ArchivingDescription"
  ],
  "targetView": [
    "ArchivingDescription"
  ],
  "versioning": [
    "ArchivingDescription"
  ],
  "addRegister": [
    "ArchivingDescription"
  ],
  "close": [
    "DBConnection",
    "DBResultSet",
    "File"
  ],
  "executeQuery": [
    "DBConnection"
  ],
  "executeQueryUC": [
    "DBConnection"
  ],
  "executeStatement": [
    "DBConnection"
  ],
  "executeStatementUC": [
    "DBConnection"
  ],
  "getBool": [
    "DBResultSet"
  ],
  "getColName": [
    "DBResultSet"
  ],
  "getDate": [
    "DBResultSet"
  ],
  "getFloat": [
    "DBResultSet"
  ],
  "getInt": [
    "DBResultSet"
  ],
  "getNumCols": [
    "DBResultSet"
  ],
  "getString": [
    "DBResultSet"
  ],
  "getTimestamp": [
    "DBResultSet"
  ],
  "getUCString": [
    "DBResultSet"
  ],
  "documentElement": [
    "DOMDocument"
  ],
  "createAttribute": [
    "DOMDocument"
  ],
  "createCDATASection": [
    "DOMDocument"
  ],
  "createComment": [
    "DOMDocument"
  ],
  "createElement": [
    "DOMDocument"
  ],
  "createTextNode": [
    "DOMDocument"
  ],
  "getElementsByTagName": [
    "DOMDocument",
    "DOMElement"
  ],
  "ErrorConstants": [
    "DOMParser"
  ],
  "getDocument": [
    "DOMParser"
  ],
  "parse": [
    "DOMParser"
  ],
  "write": [
    "DOMParser",
    "File",
    "File"
  ],
  "addAttachment": [
    "Email"
  ],
  "send": [
    "Email",
    "XMLHTTPRequest"
  ],
  "setBCC": [
    "Email"
  ],
  "setBody": [
    "Email"
  ],
  "setCC": [
    "Email"
  ],
  "setDeleteAfterSending": [
    "Email"
  ],
  "setFrom": [
    "Email"
  ],
  "setSendingTime": [
    "Email"
  ],
  "setSubject": [
    "Email"
  ],
  "setTo": [
    "Email"
  ],
  "eof": [
    "File"
  ],
  "error": [
    "File"
  ],
  "ok": [
    "File"
  ],
  "read": [
    "File"
  ],
  "readLine": [
    "File"
  ],
  "writeBuffer": [
    "File"
  ],
  "getIds": [
    "FileResultset"
  ],
  "dispose": [
    "HitResultset"
  ],
  "fetchedSize": [
    "HitResultset"
  ],
  "fetchNextPage": [
    "HitResultset"
  ],
  "getAt": [
    "HitResultset"
  ],
  "getColumnCount": [
    "HitResultset"
  ],
  "getColumnIndex": [
    "HitResultset"
  ],
  "getColumnNames": [
    "HitResultset"
  ],
  "getLastErrorCode": [
    "HitResultset"
  ],
  "addParameter": [
    "ScriptCall"
  ],
  "getReturnValue": [
    "ScriptCall"
  ],
  "isRunning": [
    "ScriptCall"
  ],
  "launch": [
    "ScriptCall"
  ],
  "setDocFile": [
    "ScriptCall"
  ],
  "setDocument": [
    "ScriptCall"
  ],
  "setEvent": [
    "ScriptCall"
  ],
  "setRegister": [
    "ScriptCall"
  ],
  "waitForFinish": [
    "ScriptCall"
  ],
  "label": [
    "UserAction",
    "ControlFlow",
    "Folder",
    "Register",
    "RetrievalField"
  ],
  "scope": [
    "UserAction"
  ],
  "type": [
    "UserAction",
    "CustomProperty",
    "Folder",
    "Register",
    "RetrievalField",
    "RetrievalSource"
  ],
  "widget": [
    "UserAction"
  ],
  "addToFolder": [
    "UserAction"
  ],
  "getPosition": [
    "UserAction",
    "Folder"
  ],
  "remove": [
    "UserAction"
  ],
  "setContext": [
    "UserAction"
  ],
  "setCreateDefaultWorkflow": [
    "UserAction"
  ],
  "setFileTypeForNewFile": [
    "UserAction"
  ],
  "setPortalScript": [
    "UserAction"
  ],
  "setPosition": [
    "UserAction",
    "Folder"
  ],
  "addAccessProfile": [
    "XMLExport",
    "Folder"
  ],
  "addAlias": [
    "XMLExport"
  ],
  "addDistributionList": [
    "XMLExport"
  ],
  "addDocumentsSettings": [
    "XMLExport"
  ],
  "addFellow": [
    "XMLExport"
  ],
  "addFile": [
    "XMLExport",
    "Folder"
  ],
  "addFileType": [
    "XMLExport"
  ],
  "addFilingPlan": [
    "XMLExport"
  ],
  "addFolder": [
    "XMLExport"
  ],
  "addNumberRange": [
    "XMLExport"
  ],
  "addOutbar": [
    "XMLExport"
  ],
  "addPartnerAccount": [
    "XMLExport"
  ],
  "addPortalScript": [
    "XMLExport"
  ],
  "addPortalScriptCall": [
    "XMLExport"
  ],
  "addPortalScriptsFromCategory": [
    "XMLExport"
  ],
  "addSystemUser": [
    "XMLExport",
    "Folder"
  ],
  "addWorkflow": [
    "XMLExport"
  ],
  "clearXML": [
    "XMLExport"
  ],
  "getXML": [
    "XMLExport"
  ],
  "saveXML": [
    "XMLExport"
  ],
  "exportCreatedAt": [
    "XMLExportDescription"
  ],
  "exportFileId": [
    "XMLExportDescription"
  ],
  "exportLastModifiedAt": [
    "XMLExportDescription"
  ],
  "exportLastModifiedBy": [
    "XMLExportDescription"
  ],
  "exportOwner": [
    "XMLExportDescription"
  ],
  "canAsync": [
    "XMLHTTPRequest"
  ],
  "canProxy": [
    "XMLHTTPRequest"
  ],
  "COMPLETED": [
    "XMLHTTPRequest"
  ],
  "FileSizeHint": [
    "XMLHTTPRequest"
  ],
  "INTERACTIVE": [
    "XMLHTTPRequest"
  ],
  "NOTSENT": [
    "XMLHTTPRequest"
  ],
  "readyState": [
    "XMLHTTPRequest"
  ],
  "response": [
    "XMLHTTPRequest"
  ],
  "responseFile": [
    "XMLHTTPRequest"
  ],
  "responseType": [
    "XMLHTTPRequest"
  ],
  "SENT": [
    "XMLHTTPRequest"
  ],
  "status": [
    "XMLHTTPRequest",
    "WorkflowStep"
  ],
  "statusText": [
    "XMLHTTPRequest"
  ],
  "UNINITIALIZED": [
    "XMLHTTPRequest"
  ],
  "abort": [
    "XMLHTTPRequest",
    "DocFile"
  ],
  "addRequestHeader": [
    "XMLHTTPRequest"
  ],
  "getAllResponseHeaders": [
    "XMLHTTPRequest"
  ],
  "getResponseHeader": [
    "XMLHTTPRequest"
  ],
  "open": [
    "XMLHTTPRequest"
  ],
  "clientId": [
    "module:context"
  ],
  "currentUser": [
    "module:context"
  ],
  "document": [
    "module:context"
  ],
  "errorMessage": [
    "module:context"
  ],
  "event": [
    "module:context"
  ],
  "file": [
    "module:context"
  ],
  "fileType": [
    "module:context"
  ],
  "folderFiles": [
    "module:context"
  ],
  "folderName": [
    "module:context"
  ],
  "register": [
    "module:context"
  ],
  "returnType": [
    "module:context"
  ],
  "scriptName": [
    "module:context"
  ],
  "selectedArchiveFiles": [
    "module:context"
  ],
  "selectedArchiveKeys": [
    "module:context"
  ],
  "selectedDocuments": [
    "module:context"
  ],
  "selectedFiles": [
    "module:context"
  ],
  "sourceCode": [
    "module:context"
  ],
  "workflowActionId": [
    "module:context"
  ],
  "workflowActionName": [
    "module:context"
  ],
  "workflowControlFlowId": [
    "module:context"
  ],
  "workflowControlFlowName": [
    "module:context"
  ],
  "workflowStep": [
    "module:context"
  ],
  "addTimeInterval": [
    "module:context"
  ],
  "changeScriptUser": [
    "module:context"
  ],
  "clearEnumvalCache": [
    "module:context"
  ],
  "convertDateToString": [
    "module:context",
    "module:util"
  ],
  "convertNumericToString": [
    "module:context",
    "module:context"
  ],
  "convertStringToDate": [
    "module:context",
    "module:util"
  ],
  "convertStringToNumeric": [
    "module:context",
    "module:context"
  ],
  "countPoolFiles": [
    "module:context"
  ],
  "createAccessProfile": [
    "module:context"
  ],
  "createArchiveServer": [
    "module:context"
  ],
  "createFellow": [
    "module:context"
  ],
  "createFile": [
    "module:context"
  ],
  "createFolder": [
    "module:context"
  ],
  "createPoolFile": [
    "module:context"
  ],
  "createSystemUser": [
    "module:context"
  ],
  "deleteAccessProfile": [
    "module:context"
  ],
  "deleteFolder": [
    "module:context",
    "Folder"
  ],
  "deleteSystemUser": [
    "module:context"
  ],
  "doMaintenance": [
    "module:context"
  ],
  "extCall": [
    "module:context"
  ],
  "extProcess": [
    "module:context"
  ],
  "findAccessProfile": [
    "module:context"
  ],
  "findCustomProperties": [
    "module:context"
  ],
  "findSystemUser": [
    "module:context"
  ],
  "findSystemUserByAlias": [
    "module:context"
  ],
  "getAccessProfiles": [
    "module:context",
    "SystemUser"
  ],
  "getArchiveFile": [
    "module:context",
    "DocHit"
  ],
  "getArchiveServer": [
    "module:context"
  ],
  "getArchiveServers": [
    "module:context"
  ],
  "getAutoText": [
    "module:context",
    "DocFile"
  ],
  "getClientLang": [
    "module:context"
  ],
  "getClientSystemLang": [
    "module:context"
  ],
  "getClientType": [
    "module:context"
  ],
  "getCurrentUserAttribute": [
    "module:context"
  ],
  "getDatesDiff": [
    "module:context"
  ],
  "getEnumAutoText": [
    "module:context",
    "DocFile"
  ],
  "getEnumErgValue": [
    "module:context"
  ],
  "getEnumValues": [
    "module:context"
  ],
  "getFieldErgName": [
    "module:context"
  ],
  "getFileById": [
    "module:context"
  ],
  "getFileTypeErgName": [
    "module:context"
  ],
  "getFileTypeOID": [
    "module:context"
  ],
  "getFolderPosition": [
    "module:context"
  ],
  "getFoldersByName": [
    "module:context"
  ],
  "getFromSystemTable": [
    "module:context"
  ],
  "getJSObject": [
    "module:context"
  ],
  "getPrincipalAttribute": [
    "module:context"
  ],
  "getProgressBar": [
    "module:context"
  ],
  "getQueryParams": [
    "module:context"
  ],
  "getRegisterErgName": [
    "module:context"
  ],
  "getServerInstallPath": [
    "module:context"
  ],
  "getSystemUser": [
    "module:context"
  ],
  "getTmpFilePath": [
    "module:context"
  ],
  "getXMLServer": [
    "module:context"
  ],
  "sendTCPStringRequest": [
    "module:context"
  ],
  "setClientLang": [
    "module:context"
  ],
  "setClientSystemLang": [
    "module:context"
  ],
  "setFolderPosition": [
    "module:context"
  ],
  "setPrincipalAttribute": [
    "module:context"
  ],
  "setProgressBar": [
    "module:context"
  ],
  "setProgressBarText": [
    "module:context"
  ],
  "buildNo": [
    "module:util"
  ],
  "DB": [
    "module:util"
  ],
  "memoryModel": [
    "module:util"
  ],
  "version": [
    "module:util"
  ],
  "base64Decode": [
    "module:util"
  ],
  "base64Encode": [
    "module:util"
  ],
  "beep": [
    "module:util"
  ],
  "concatPDF": [
    "module:util"
  ],
  "convertBlobToPDF": [
    "module:util"
  ],
  "cryptPassword": [
    "module:util"
  ],
  "decodeUrlCompatible": [
    "module:util"
  ],
  "decryptString": [
    "module:util"
  ],
  "deleteFile": [
    "module:util",
    "DocFile"
  ],
  "encodeUrlCompatible": [
    "module:util"
  ],
  "encryptString": [
    "module:util"
  ],
  "fileCopy": [
    "module:util"
  ],
  "fileMove": [
    "module:util"
  ],
  "fileSize": [
    "module:util"
  ],
  "generateChecksum": [
    "module:util"
  ],
  "getDir": [
    "module:util"
  ],
  "getEnvironment": [
    "module:util"
  ],
  "getFileContentAsString": [
    "module:util"
  ],
  "getQuoted": [
    "module:util"
  ],
  "getSourceLineInfo": [
    "module:util"
  ],
  "getTmpPath": [
    "module:util"
  ],
  "getUniqueId": [
    "module:util"
  ],
  "getUsedPrivateBytes": [
    "module:util"
  ],
  "hmac": [
    "module:util"
  ],
  "isEncryptedBlob": [
    "module:util"
  ],
  "length_u": [
    "module:util"
  ],
  "log": [
    "module:util"
  ],
  "makeFullDir": [
    "module:util"
  ],
  "makeHTML": [
    "module:util"
  ],
  "out": [
    "module:util"
  ],
  "searchInArray": [
    "module:util"
  ],
  "sha256": [
    "module:util"
  ],
  "sleep": [
    "module:util"
  ],
  "substr_u": [
    "module:util"
  ],
  "transcode": [
    "module:util"
  ],
  "unlinkFile": [
    "module:util"
  ],
  "bytes": [
    "ArchiveConnectionBlob",
    "Document"
  ],
  "docKey": [
    "ArchiveConnectionBlob"
  ],
  "downloaded": [
    "ArchiveConnectionBlob"
  ],
  "fileKey": [
    "ArchiveConnectionBlob"
  ],
  "localPath": [
    "ArchiveConnectionBlob"
  ],
  "mimeType": [
    "ArchiveConnectionBlob"
  ],
  "download": [
    "ArchiveConnectionBlob"
  ],
  "value": [
    "CustomProperty",
    "DOMAttr"
  ],
  "addSubProperty": [
    "CustomProperty"
  ],
  "deleteCustomProperty": [
    "CustomProperty"
  ],
  "getSubProperties": [
    "CustomProperty"
  ],
  "setAccessProfile": [
    "CustomProperty"
  ],
  "setFiletype": [
    "CustomProperty"
  ],
  "setOrAddSubProperty": [
    "CustomProperty"
  ],
  "setSystemUser": [
    "CustomProperty"
  ],
  "fieldName": [
    "DocFile"
  ],
  "addDocumentFromFileSystem": [
    "DocFile"
  ],
  "addPDF": [
    "DocFile"
  ],
  "archive": [
    "DocFile",
    "DocFile",
    "DocFile"
  ],
  "archiveAndDelete": [
    "DocFile"
  ],
  "cancelWorkflow": [
    "DocFile"
  ],
  "changeFiletype": [
    "DocFile"
  ],
  "checkWorkflowReceiveSignal": [
    "DocFile"
  ],
  "clearFollowUpDate": [
    "DocFile"
  ],
  "commit": [
    "DocFile"
  ],
  "connectFolder": [
    "DocFile"
  ],
  "countFields": [
    "DocFile"
  ],
  "createMonitorFile": [
    "DocFile"
  ],
  "createStatusFile": [
    "DocFile"
  ],
  "disconnectArchivedFile": [
    "DocFile"
  ],
  "disconnectFolder": [
    "DocFile"
  ],
  "exportXML": [
    "DocFile"
  ],
  "forwardFile": [
    "DocFile",
    "WorkflowStep"
  ],
  "getAllLockingWorkflowSteps": [
    "DocFile"
  ],
  "getAllWorkflowSteps": [
    "DocFile"
  ],
  "getArchiveKey": [
    "DocFile",
    "DocHit"
  ],
  "getAsPDF": [
    "DocFile",
    "Document"
  ],
  "getCopy": [
    "DocFile"
  ],
  "getCreationDate": [
    "DocFile"
  ],
  "getCreator": [
    "DocFile"
  ],
  "getCurrentWorkflowStep": [
    "DocFile"
  ],
  "getFieldAttribute": [
    "DocFile"
  ],
  "getFieldAutoText": [
    "DocFile"
  ],
  "getFieldName": [
    "DocFile"
  ],
  "getFieldValue": [
    "DocFile"
  ],
  "getFileOwner": [
    "DocFile"
  ],
  "getFirstLockingWorkflowStep": [
    "DocFile"
  ],
  "getid": [
    "DocFile"
  ],
  "getLastModificationDate": [
    "DocFile"
  ],
  "getLastModifier": [
    "DocFile"
  ],
  "getOriginal": [
    "DocFile"
  ],
  "getReferenceFile": [
    "DocFile"
  ],
  "getRegisterByName": [
    "DocFile"
  ],
  "getRegisters": [
    "DocFile"
  ],
  "getTitle": [
    "DocFile"
  ],
  "getUserStatus": [
    "DocFile"
  ],
  "hasField": [
    "DocFile"
  ],
  "insertStatusEntry": [
    "DocFile"
  ],
  "isArchiveFile": [
    "DocFile"
  ],
  "isDeletedFile": [
    "DocFile"
  ],
  "isNewFile": [
    "DocFile"
  ],
  "reactivate": [
    "DocFile"
  ],
  "sendFileAdHoc": [
    "DocFile"
  ],
  "sendMail": [
    "DocFile"
  ],
  "setFieldAttribute": [
    "DocFile"
  ],
  "setFieldValue": [
    "DocFile"
  ],
  "setFileOwner": [
    "DocFile"
  ],
  "setFollowUpDate": [
    "DocFile"
  ],
  "setUserRead": [
    "DocFile"
  ],
  "setUserStatus": [
    "DocFile"
  ],
  "startEdit": [
    "DocFile"
  ],
  "startWorkflow": [
    "DocFile"
  ],
  "sync": [
    "DocFile"
  ],
  "undeleteFile": [
    "DocFile"
  ],
  "columnName": [
    "DocHit"
  ],
  "getBlobInfo": [
    "DocHit"
  ],
  "getFile": [
    "DocHit"
  ],
  "getFileId": [
    "DocHit"
  ],
  "getLocalValue": [
    "DocHit"
  ],
  "getLocalValueByName": [
    "DocHit"
  ],
  "getSchema": [
    "DocHit"
  ],
  "getTechValue": [
    "DocHit"
  ],
  "getTechValueByName": [
    "DocHit"
  ],
  "isArchiveHit": [
    "DocHit"
  ],
  "filledSearchFieldCount": [
    "DocQueryParams"
  ],
  "requestType": [
    "DocQueryParams"
  ],
  "requestTypeConstants": [
    "DocQueryParams"
  ],
  "searchFieldCount": [
    "DocQueryParams"
  ],
  "searchMaskName": [
    "DocQueryParams"
  ],
  "sourceCount": [
    "DocQueryParams"
  ],
  "getSearchField": [
    "DocQueryParams"
  ],
  "getSource": [
    "DocQueryParams"
  ],
  "removeSource": [
    "DocQueryParams"
  ],
  "encrypted": [
    "Document"
  ],
  "extension": [
    "Document"
  ],
  "fullname": [
    "Document"
  ],
  "deleteDocument": [
    "Document",
    "Register"
  ],
  "downloadDocument": [
    "Document"
  ],
  "moveToRegister": [
    "Document"
  ],
  "uploadDocument": [
    "Document",
    "Register"
  ],
  "specified": [
    "DOMAttr"
  ],
  "data": [
    "DOMCharacterData"
  ],
  "length": [
    "DOMCharacterData",
    "DOMNamedNodeMap",
    "DOMNodeList"
  ],
  "appendData": [
    "DOMCharacterData"
  ],
  "deleteData": [
    "DOMCharacterData"
  ],
  "insertData": [
    "DOMCharacterData"
  ],
  "replaceData": [
    "DOMCharacterData"
  ],
  "splitText": [
    "DOMCharacterData"
  ],
  "substringData": [
    "DOMCharacterData"
  ],
  "tagName": [
    "DOMElement"
  ],
  "getAttributeNode": [
    "DOMElement"
  ],
  "removeAttribute": [
    "DOMElement"
  ],
  "removeAttributeNode": [
    "DOMElement"
  ],
  "setAttributeNode": [
    "DOMElement"
  ],
  "code": [
    "DOMException"
  ],
  "Errorcodeconstants": [
    "DOMException"
  ],
  "message": [
    "DOMException"
  ],
  "getNamedItem": [
    "DOMNamedNodeMap"
  ],
  "item": [
    "DOMNamedNodeMap",
    "DOMNodeList"
  ],
  "removeNamedItem": [
    "DOMNamedNodeMap"
  ],
  "setNamedItem": [
    "DOMNamedNodeMap"
  ],
  "attributes": [
    "DOMNode"
  ],
  "childNodes": [
    "DOMNode"
  ],
  "firstChild": [
    "DOMNode"
  ],
  "lastChild": [
    "DOMNode"
  ],
  "nextSibling": [
    "DOMNode"
  ],
  "nodeName": [
    "DOMNode"
  ],
  "nodeType": [
    "DOMNode"
  ],
  "NodeTypeConstants": [
    "DOMNode"
  ],
  "nodeValue": [
    "DOMNode"
  ],
  "ownerDocument": [
    "DOMNode"
  ],
  "parentNode": [
    "DOMNode"
  ],
  "previousSibling": [
    "DOMNode"
  ],
  "appendChild": [
    "DOMNode"
  ],
  "cloneNode": [
    "DOMNode"
  ],
  "hasAttributes": [
    "DOMNode"
  ],
  "hasChildNodes": [
    "DOMNode"
  ],
  "insertBefore": [
    "DOMNode"
  ],
  "normalize": [
    "DOMNode"
  ],
  "removeChild": [
    "DOMNode"
  ],
  "replaceChild": [
    "DOMNode"
  ],
  "allowArchive": [
    "Folder"
  ],
  "allowCopyTo": [
    "Folder"
  ],
  "allowCreatePDF": [
    "Folder"
  ],
  "allowDelete": [
    "Folder"
  ],
  "allowExport": [
    "Folder"
  ],
  "allowForward": [
    "Folder"
  ],
  "allowMoveTo": [
    "Folder"
  ],
  "comparator1": [
    "Folder"
  ],
  "comparator2": [
    "Folder"
  ],
  "comparator3": [
    "Folder"
  ],
  "filterExpression": [
    "Folder"
  ],
  "filterfieldname1": [
    "Folder"
  ],
  "filterfieldname2": [
    "Folder"
  ],
  "filterfieldname3": [
    "Folder"
  ],
  "filterStyle": [
    "Folder"
  ],
  "icon": [
    "Folder"
  ],
  "invisible": [
    "Folder"
  ],
  "released": [
    "Folder"
  ],
  "sortColumn": [
    "Folder"
  ],
  "sortDescending": [
    "Folder"
  ],
  "sortFieldName": [
    "Folder"
  ],
  "value1": [
    "Folder"
  ],
  "value2": [
    "Folder"
  ],
  "value3": [
    "Folder"
  ],
  "addFilterEDAServer": [
    "Folder"
  ],
  "addFilterEEiArchive": [
    "Folder"
  ],
  "addFilterEExView": [
    "Folder"
  ],
  "addFilterFileType": [
    "Folder"
  ],
  "addToOutbar": [
    "Folder"
  ],
  "copyFolder": [
    "Folder"
  ],
  "createSubFolder": [
    "Folder"
  ],
  "getActionByName": [
    "Folder"
  ],
  "getFiles": [
    "Folder",
    "Register"
  ],
  "getFilterFileTypes": [
    "Folder"
  ],
  "getHitResultset": [
    "Folder"
  ],
  "getLocaleLabel": [
    "Folder"
  ],
  "getSubFolders": [
    "Folder"
  ],
  "hasFiles": [
    "Folder"
  ],
  "removeAccessProfile": [
    "Folder"
  ],
  "removeFile": [
    "Folder"
  ],
  "removeFilterEDAServer": [
    "Folder"
  ],
  "removeFilterEEiArchive": [
    "Folder"
  ],
  "removeFilterEExView": [
    "Folder"
  ],
  "removeFilterFileType": [
    "Folder"
  ],
  "removeFromOutbar": [
    "Folder"
  ],
  "removeSystemUser": [
    "Folder"
  ],
  "setAllowedActionScript": [
    "Folder"
  ],
  "setParentFolder": [
    "Folder"
  ],
  "hasProperty": [
    "PropertyCache"
  ],
  "removeProperty": [
    "PropertyCache"
  ],
  "getDocuments": [
    "Register"
  ],
  "compOp": [
    "RetrievalField"
  ],
  "defaultValue": [
    "RetrievalField"
  ],
  "defValWriteProt": [
    "RetrievalField"
  ],
  "fieldTypes": [
    "RetrievalField"
  ],
  "valueExpr": [
    "RetrievalField"
  ],
  "setDefault": [
    "RetrievalField"
  ],
  "resId": [
    "RetrievalSource"
  ],
  "searchableResource": [
    "RetrievalSource"
  ],
  "server": [
    "RetrievalSource"
  ],
  "ANNOTATIONS": [
    "SystemUser"
  ],
  "ARCHIVE": [
    "SystemUser"
  ],
  "CHANGE_TYPE": [
    "SystemUser"
  ],
  "CHANGE_WORKFLOW": [
    "SystemUser"
  ],
  "COPY": [
    "SystemUser"
  ],
  "CREATE": [
    "SystemUser"
  ],
  "CREATE_WORKFLOW": [
    "SystemUser"
  ],
  "email": [
    "SystemUser"
  ],
  "firstName": [
    "SystemUser"
  ],
  "lastName": [
    "SystemUser"
  ],
  "login": [
    "SystemUser"
  ],
  "MAIL": [
    "SystemUser"
  ],
  "MOVE": [
    "SystemUser"
  ],
  "PDF": [
    "SystemUser"
  ],
  "READ": [
    "SystemUser"
  ],
  "REMOVE": [
    "SystemUser"
  ],
  "START_WORKFLOW": [
    "SystemUser"
  ],
  "VERSION": [
    "SystemUser"
  ],
  "WRITE": [
    "SystemUser"
  ],
  "addFileTypeAgent": [
    "SystemUser"
  ],
  "addFileTypeAgentScript": [
    "SystemUser"
  ],
  "addToAccessProfile": [
    "SystemUser"
  ],
  "checkPassword": [
    "SystemUser"
  ],
  "delegateFilesOfAbsentUser": [
    "SystemUser"
  ],
  "getAccess": [
    "SystemUser"
  ],
  "getAgents": [
    "SystemUser"
  ],
  "getAllFolders": [
    "SystemUser"
  ],
  "getBackDelegatedFiles": [
    "SystemUser"
  ],
  "getIndividualFolders": [
    "SystemUser"
  ],
  "getPrivateFolder": [
    "SystemUser"
  ],
  "getSuperior": [
    "SystemUser"
  ],
  "getUserdefinedInboxFolders": [
    "SystemUser"
  ],
  "hasAccessProfile": [
    "SystemUser"
  ],
  "invalidateAccessProfileCache": [
    "SystemUser"
  ],
  "listAgentFileTypes": [
    "SystemUser"
  ],
  "listFileTypeAgents": [
    "SystemUser"
  ],
  "notifyFileReturnedFromSending": [
    "SystemUser"
  ],
  "notifyNewFileInInbox": [
    "SystemUser"
  ],
  "removeFileTypeAgent": [
    "SystemUser"
  ],
  "removeFromAccessProfile": [
    "SystemUser"
  ],
  "resetSuperior": [
    "SystemUser"
  ],
  "setAbsent": [
    "SystemUser"
  ],
  "setAbsentMail": [
    "SystemUser"
  ],
  "setPassword": [
    "SystemUser"
  ],
  "setSuperior": [
    "SystemUser"
  ],
  "executiveGroup": [
    "WorkflowStep"
  ],
  "executiveType": [
    "WorkflowStep"
  ],
  "executiveUser": [
    "WorkflowStep"
  ],
  "firstControlFlow": [
    "WorkflowStep"
  ],
  "templateId": [
    "WorkflowStep"
  ],
  "getControlFlows": [
    "WorkflowStep"
  ],
  "getWorkflowName": [
    "WorkflowStep"
  ],
  "getWorkflowProperty": [
    "WorkflowStep"
  ],
  "getWorkflowVersion": [
    "WorkflowStep"
  ],
  "setNewExecutiveGroup": [
    "WorkflowStep"
  ],
  "setNewExecutiveUser": [
    "WorkflowStep"
  ],
  "class-names": [
    "AccessProfile",
    "ArchiveConnection",
    "ArchiveFileResultset",
    "ArchiveServer",
    "ArchiveServerIterator",
    "ArchivingDescription",
    "DBConnection",
    "DBResultSet",
    "DOMDocument",
    "DOMParser",
    "Email",
    "File",
    "FileResultset",
    "HitResultset",
    "ScriptCall",
    "UserAction",
    "XMLExport",
    "XMLExportDescription",
    "XMLHTTPRequest",
    "module:context",
    "module:util",
    "AccessProfileIterator",
    "ArchiveConnectionBlob",
    "ArchiveConnectionBlobIterator",
    "ControlFlow",
    "ControlFlowIterator",
    "CustomProperty",
    "CustomPropertyIterator",
    "DocFile",
    "DocHit",
    "DocQueryParams",
    "Document",
    "DocumentIterator",
    "DOMAttr",
    "DOMCharacterData",
    "DOMElement",
    "DOMException",
    "DOMNamedNodeMap",
    "DOMNode",
    "DOMNodeList",
    "Folder",
    "FolderIterator",
    "PropertyCache",
    "Register",
    "RegisterIterator",
    "RetrievalField",
    "RetrievalSource",
    "SystemUser",
    "SystemUserIterator",
    "WorkflowStep",
    "WorkflowStepIterator"
  ]
};
