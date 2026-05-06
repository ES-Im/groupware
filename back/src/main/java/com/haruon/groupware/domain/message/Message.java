package com.haruon.groupware.domain.message;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Message extends AbstractEntity {

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    @Nullable
    private LocalDateTime sentAt;

    @OneToOne(mappedBy = "message", orphanRemoval = true, cascade = CascadeType.ALL)
    private MessageSending sending;

    @OneToMany(mappedBy = "message", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<MessageReceiving> receivings = new ArrayList<>();

    @OneToMany(mappedBy = "message", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<MessageFile> messageFiles = new ArrayList<>();


    public static Message createDraft(
            String title,
            String content,
            Emp sender
    ) {
        Message message = new Message();

        message.title = requireNonNull(title);
        message.content = requireNonNull(content);
        message.sending = MessageSending.create(message, sender);

        return message;
    }

    public static Message createSent(
            Emp sender,
            String title,
            String content,
            List<Emp> receivers,
            LocalDateTime sentAt
    ) {
        Message message = createDraft(title, content, sender);

        message.sentAt = requireNonNull(sentAt);

        for (Emp receiver : receivers) {
            message.receivings.add(MessageReceiving.create(message, receiver));
        }

        return message;
    }

    public void changeMessage(
        Emp sender,
        @Nullable String title,
        @Nullable String content
    ) {
        validateSender(sender);
        validateDraft();

        state(title != null || content != null, "수정할 내용이 없음");

        if(title != null) this.title = title;
        if(content != null) this.content = content;
    }

    public void replaceReceivers(Emp emp, List<Emp> receivers) {
        validateSender(emp);
        validateDraft();

        this.receivings.clear();

        for(Emp receiver : receivers) {
            this.receivings.add(MessageReceiving.create(this, receiver));
        }
    }

    public void sendMessage(
            Emp sender,
            LocalDateTime sentAt
    ) {
        validateSender(sender);
        validateDraft();
        validateHasReceiving();

        this.sentAt = requireNonNull(sentAt);
    }

    public void markAsRead(
            Emp receiver,
            LocalDateTime readAt
    ) {
        validateReadAt(readAt);

        MessageReceiving messageReceiving = getReceivingForReceiver(receiver);

        messageReceiving.markRead(readAt);
    }

    public void validateForDeleteDraft(Emp sender) {
        validateDraft();
        validateSender(sender);

        //todo application 쪽에서 물리 삭제 구현
    }

    public void addFile(
            Emp sender,
            String mimeType,
            String originalName,
            String extension,
            Long fileSize
    ) {
        validateSender(sender);
        validateDraft();

        requireNonNull(mimeType);
        requireNonNull(originalName);
        requireNonNull(extension);
        requireNonNull(fileSize);

        this.messageFiles.add(MessageFile.create(this, mimeType, originalName, extension, fileSize));
    }

    public void removeFile(Emp sender, long fileId) {
        validateSender(sender);
        validateDraft();

        MessageFile messageFile = findMessageFile(fileId);

        this.messageFiles.remove(messageFile);
    }

    public void moveSenderToTrash(
            Emp sender,
            LocalDateTime movedAt
    ) {
        requireNonNull(movedAt);
        validateSender(sender);
        validateSent();

        if(this.sending.isTrashed()) return;
        this.sending.markTrashed(movedAt);
    }

    public void restoreSenderFromTrash(
            Emp sender
    ) {
        validateSender(sender);
        validateSent();

        if(!this.sending.isTrashed()) return;
        this.sending.revertTrashed();
    }

    public void deleteSenderPermanently(
            Emp sender,
            LocalDateTime deletedAt
    ) {
        validateSender(sender);
        validateSent();

        this.sending.markDeleted(deletedAt);
    }

    public void moveReceiversToTrash(
            Emp receiver,
            LocalDateTime trashedAt
    ) {
        validateReceiver(receiver);
        validateSent();

        getReceivingForReceiver(receiver).markTrashed(trashedAt);
    }

    public void restoreReceiversFromTrash(
            Emp receiver
    ) {
        validateReceiver(receiver);
        validateSent();

        getReceivingForReceiver(receiver).revertTrashed();
    }

    public void deleteReceiversPermanently(
            Emp receiver,
            LocalDateTime deletedAt
    ) {
        validateReceiver(receiver);
        validateSent();

        getReceivingForReceiver(receiver).delete(deletedAt);
    }

    private void validateReadAt(LocalDateTime readAt) {
        requireNonNull(readAt);
        validateSent();
        state(readAt.isAfter(this.sentAt), "읽은 시간이 발송시간보다 이를 수 없음");
    }

    private void validateReceiver(Emp receiver) {
        requireNonNull(receiver);

        state(this.receivings.stream()
                .map(MessageReceiving::getEmp)
                .anyMatch(receiver::equals),
                "수신자가 아님");
    }

    private void validateSender(Emp sender) {
        requireNonNull(sender);
        state(this.sending.isSender(sender), "작성자만 수정가능");
    }

    private void validateDraft() {
        state(this.sentAt == null, "발송 전에만 수정가능");
    }

    private void validateSent() {
        state(this.sentAt != null, "발송 후가 아님");
    }

    private void validateHasReceiving() {
        state(!this.receivings.isEmpty(), "수신자가 없음");
    }

    private MessageFile findMessageFile(long fileId) {
        return this.messageFiles.stream()
                .filter(f -> f.getId().equals(fileId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("대상 파일을 찾을 수 없습니다."));
    }

    private MessageReceiving getReceivingForReceiver(Emp receiver) {
        requireNonNull(receiver);

        return this.receivings.stream()
                .filter(receiving -> receiving.isReceiver(receiver))
                .findFirst()
                .orElseThrow();
    }



}
