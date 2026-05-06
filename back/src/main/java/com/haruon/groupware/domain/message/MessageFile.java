package com.haruon.groupware.domain.message;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
public class MessageFile extends AbstractFileEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="message_id", nullable=false, updatable=false)
    private Message message;

    static MessageFile create(
            Message message,
            String mimeType,
            String originalName,
            String extension,
            Long fileSize
    ) {
        MessageFile messageFile = new MessageFile();
        messageFile.message = requireNonNull(message);

        messageFile.initFileMetadata(mimeType, originalName, extension, fileSize);

        return messageFile;
    }
}