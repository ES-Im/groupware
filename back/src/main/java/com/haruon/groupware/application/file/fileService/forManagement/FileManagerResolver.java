package com.haruon.groupware.application.file.fileService.forManagement;

import com.haruon.groupware.application.exception.file.UnSupportedDomainFileType;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.provided.FileManager;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class FileManagerResolver<T extends FileManager> {

    private final Map<FileDomain, T> managers;

    public FileManagerResolver(List<T> managers) {
        this.managers = managers.stream()
                .collect(Collectors.toMap(
                        T::domain,
                        manager -> manager
                ));
    }

    public T getManager(FileDomain domain) {
        T manager = managers.get(domain);

        if(manager == null) throw new UnSupportedDomainFileType();

        return manager;
    }
}
