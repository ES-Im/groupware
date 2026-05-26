package com.haruon.groupware.application.utils.file.required;

import com.haruon.groupware.application.utils.file.FileDto;
import com.haruon.groupware.application.utils.file.StoreFile;

public interface FileStorage {
    StoreFile store(FileDto fileDto, String fileType);


}
