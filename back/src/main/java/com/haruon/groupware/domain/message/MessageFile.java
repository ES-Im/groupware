package com.haruon.groupware.domain.message;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class MessageFile extends AbstractFileEntity {

    private Message message;

    static MessageFile create(
            Message message,
            String mimeType,
            String originalName,
            String storedName,
            String extension,
            Long fileSize,
            String storedPath
    ) {
        MessageFile messageFile = new MessageFile();
        messageFile.message = requireNonNull(message);

        messageFile.initFileMetadata(mimeType, originalName, storedName, extension, fileSize, storedPath);

        return messageFile;
    }
}
