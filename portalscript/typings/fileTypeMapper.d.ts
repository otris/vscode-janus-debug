interface FileTypeMapper {
    "DocFile": DocFile;
}

declare namespace context {
    var file: FileTypeMapper[keyof FileTypeMapper];
    function createFile<K extends keyof FileTypeMapper>(fileType: K): FileTypeMapper[K];
}
