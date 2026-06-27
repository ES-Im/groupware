package com.haruon.groupware.application.file.service.command;

import com.haruon.groupware.application.exception.file.UnSupportedDomainFileType;
import com.haruon.groupware.application.file.provided.forCommand.FileManager;
import com.haruon.groupware.application.file.service.support.FileDomain;
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
