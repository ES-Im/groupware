package com.haruon.groupware.application.file.service.query;

import com.haruon.groupware.application.exception.file.UnSupportedDomainFileType;
import com.haruon.groupware.application.file.provided.forRetriever.FileResourceRetriever;
import com.haruon.groupware.application.file.service.support.FileDomain;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class FileResourceRetrieverResolver {

    private final Map<FileDomain, FileResourceRetriever> retrievers;

    public FileResourceRetrieverResolver(List<FileResourceRetriever> retrievers) {
        this.retrievers = retrievers.stream()
                .collect(Collectors.toMap(
                        FileResourceRetriever::domain,
                        retriever -> retriever
                ));
    }

    public FileResourceRetriever getRetriever(FileDomain domain) {
        FileResourceRetriever retriever = retrievers.get(domain);

        if (retriever == null) throw new UnSupportedDomainFileType();

        return retriever;
    }
}
