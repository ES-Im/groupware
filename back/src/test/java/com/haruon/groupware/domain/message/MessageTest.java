package com.haruon.groupware.domain.message;

import com.haruon.groupware.domain.empInfo.Emp;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MessageTest {

    @Test
    @DisplayName("쪽지 생성 시 title, content, sender는 필수이며 임시저장 상태로 생성된다.")
    void createDraft_success() {
        Emp sender = getApprovedEmp();

        Message message = Message.createDraft("testTitle", "testContent", sender);

        assertThat(message).extracting(
                Message::getTitle, Message::getContent, Message::getSentAt
        ).containsExactly(
                "testTitle", "testContent", null
        );

        assertThat(message.getSending()).isNotNull();
        assertThat(message.getReceivings()).isEmpty();
        assertThat(message.getMessageFiles()).isEmpty();
    }

    @Test
    @DisplayName("쪽지를 생성과 동시에 발송할 수 있다.")
    void createSent_success() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        LocalDateTime sentAt = LocalDateTime.of(2026, 5, 1, 0, 0, 0);

        Message message = Message.createSent(
                sender, "testTitle", "testContent", List.of(receiver), sentAt
        );

        assertThat(message.getSentAt()).isEqualTo(sentAt);
        assertThat(message.getReceivings().size()).isEqualTo(1);
    }

    @Test
    @DisplayName("작성자는 임시저장 상태의 쪽지 제목과 내용을 수정할 수 있다.")
    void changeMessage_success() {
        Emp sender = getApprovedEmp();
        Message message = getDraftMessage(sender);

        message.changeMessage(sender, "editedTitle", "editedContent");

        assertThat(message).extracting(
                Message::getTitle, Message::getContent
        ).containsExactly(
                "editedTitle", "editedContent"
        );
    }

    @Test
    @DisplayName("쪽지 수정 시, 수정할 내용이 하나라도 없으면 실패한다.")
    void changeMessage_without_editable_instance_fail() {
        Emp sender = getApprovedEmp();
        Message message = getDraftMessage(sender);

        assertThatThrownBy(() ->
                message.changeMessage(sender, null, null)
        ).hasMessage("수정할 내용이 없음");
    }

    @Test
    @DisplayName("작성자 외 사원은 쪽지를 수정할 수 없다.")
    void changeMessage_by_not_sender_fail() {
        Emp sender = getApprovedEmp();
        Emp notSender = getApprovedEmp("202601002", "notSender");
        Message message = getDraftMessage(sender);

        assertThatThrownBy(() ->
                message.changeMessage(notSender, "editedTitle", "editedContent")
        ).hasMessage("작성자만 수정가능");
    }

    @Test
    @DisplayName("발송 후에는 쪽지를 수정할 수 없다.")
    void changeMessage_after_sent_fail() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        assertThatThrownBy(() ->
                message.changeMessage(sender, "editedTitle", "editedContent")
        ).hasMessage("발송 전에만 수정가능");
    }

    @Test
    @DisplayName("작성자는 발송 전 수신자 목록을 교체할 수 있다.")
    void replaceReceivers_success() {
        Emp sender = getApprovedEmp();
        Emp receiver1 = getApprovedEmp("202601002", "receiver1");
        Emp receiver2 = getApprovedEmp("202601003", "receiver2");
        Message message = getDraftMessage(sender);

        message.replaceReceivers(sender, List.of(receiver1));
        assertThat(message.getReceivings().size()).isEqualTo(1);

        message.replaceReceivers(sender, List.of(receiver1, receiver2));
        assertThat(message.getReceivings().size()).isEqualTo(2);
    }

    @Test
    @DisplayName("발송 후에는 수신자 목록을 교체할 수 없다.")
    void replaceReceivers_after_sent_fail() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Emp newReceiver = getApprovedEmp("202601003", "newReceiver");
        Message message = getSentMessage(sender, receiver);

        assertThatThrownBy(() ->
                message.replaceReceivers(sender, List.of(newReceiver))
        ).hasMessage("발송 전에만 수정가능");
    }

    @Test
    @DisplayName("작성자는 수신자가 있는 임시저장 쪽지를 발송할 수 있다.")
    void sendMessage_success() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getDraftMessage(sender);
        message.replaceReceivers(sender, List.of(receiver));

        LocalDateTime sentAt = LocalDateTime.of(2026, 5, 1, 0, 0, 0);
        message.sendMessage(sender, sentAt);

        assertThat(message.getSentAt()).isEqualTo(sentAt);
    }

    @Test
    @DisplayName("수신자가 없으면 쪽지를 발송할 수 없다.")
    void sendMessage_without_receiver_fail() {
        Emp sender = getApprovedEmp();
        Message message = getDraftMessage(sender);

        assertThatThrownBy(() ->
                message.sendMessage(sender, LocalDateTime.of(2026, 5, 1, 0, 0, 0))
        ).hasMessage("수신자가 없음");
    }

    @Test
    @DisplayName("수신자는 발송된 쪽지를 읽음 처리할 수 있다.")
    void markAsRead_success() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        LocalDateTime readAt = message.getSentAt().plusMinutes(1);
        message.markAsRead(receiver, readAt);

        assertThat(message.getReceivings().getFirst().getReadAt()).isEqualTo(readAt);
    }

    @Test
    @DisplayName("읽은 시간이 발송시간보다 이르면 실패한다.")
    void markAsRead_before_sentAt_fail() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        assertThatThrownBy(() ->
                message.markAsRead(receiver, message.getSentAt().minusMinutes(1))
        ).hasMessage("읽은 시간이 발송시간보다 이를 수 없음");
    }

    @Test
    @DisplayName("작성자는 발송 전 쪽지에 파일을 첨부할 수 있다.")
    void addFile_success() {
        Emp sender = getApprovedEmp();
        Message message = getDraftMessage(sender);

        message.addFile(sender, "application/pdf", "test.pdf", "pdf", 1000L);

        assertThat(message.getMessageFiles().size()).isEqualTo(1);
    }

    @Test
    @DisplayName("발송 후에는 파일을 첨부할 수 없다.")
    void addFile_after_sent_fail() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        assertThatThrownBy(() ->
                message.addFile(sender, "application/pdf", "test.pdf", "pdf", 1000L)
        ).hasMessage("발송 전에만 수정가능");
    }

    @Test
    @DisplayName("작성자는 발송 전 쪽지의 첨부파일을 삭제할 수 있다.")
    void removeFile_success() {
        Emp sender = getApprovedEmp();
        Message message = getDraftMessage(sender);
        message.addFile(sender, "application/pdf", "test.pdf", "pdf", 1000L);

        MessageFile file = message.getMessageFiles().getFirst();
        ReflectionTestUtils.setField(file, "id", 1L);

        message.removeFile(sender, 1L);

        assertThat(message.getMessageFiles().size()).isEqualTo(0);
    }

    @Test
    @DisplayName("대상 파일이 해당 쪽지에 없으면 첨부파일 삭제에 실패한다.")
    void removeFile_not_found_fail() {
        Emp sender = getApprovedEmp();
        Message message = getDraftMessage(sender);

        assertThatThrownBy(() ->
                message.removeFile(sender, 1L)
        ).hasMessage("대상 파일을 찾을 수 없습니다.");
    }

    @Test
    @DisplayName("발송자는 발송 후 쪽지를 휴지통으로 이동할 수 있다.")
    void moveSenderToTrash_success() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        LocalDateTime trashedAt = LocalDateTime.of(2026, 5, 2, 0, 0, 0);
        message.moveSenderToTrash(sender, trashedAt);

        assertThat(message.getSending().getTrashedAt()).isEqualTo(trashedAt);
    }

    @Test
    @DisplayName("발송자는 휴지통으로 이동한 쪽지를 복원할 수 있다.")
    void restoreSenderFromTrash_success() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        message.moveSenderToTrash(sender, LocalDateTime.of(2026, 5, 2, 0, 0, 0));
        message.restoreSenderFromTrash(sender);

        assertThat(message.getSending().getTrashedAt()).isNull();
    }

    @Test
    @DisplayName("수신자는 발송 후 쪽지를 휴지통으로 이동할 수 있다.")
    void moveReceiversToTrash_success() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        LocalDateTime trashedAt = LocalDateTime.of(2026, 5, 2, 0, 0, 0);
        message.moveReceiversToTrash(receiver, trashedAt);

        assertThat(message.getReceivings().getFirst().getTrashedAt()).isEqualTo(trashedAt);
    }

    @Test
    @DisplayName("수신자는 휴지통으로 이동한 쪽지를 복원할 수 있다.")
    void restoreReceiversFromTrash_success() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        message.moveReceiversToTrash(receiver, LocalDateTime.of(2026, 5, 2, 0, 0, 0));
        message.restoreReceiversFromTrash(receiver);

        assertThat(message.getReceivings().getFirst().getTrashedAt()).isNull();
    }

    @Test
    @DisplayName("발송자는 발송 후 쪽지를 삭제(논리삭제)할 수 있다")
    void deleteSenderPermanently_success() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        message.deleteSenderPermanently(sender, LocalDateTime.of(2026, 5, 2, 0, 0, 0));

        assertThat(message.getSending().getDeletedAt()).isNotNull();
        assertThat(message.getSending().isDeleted()).isTrue();
    }

    @Test
    @DisplayName("수신자는 발송 후 쪽지를 삭제(논리삭제)할 수 있다")
    void deleteReceiversPermanently_success() {
        Emp sender = getApprovedEmp();
        Emp receiver = getApprovedEmp("202601002", "receiver");
        Message message = getSentMessage(sender, receiver);

        message.deleteReceiversPermanently(receiver, LocalDateTime.of(2026, 5, 2, 0, 0, 0));


        assertThat(message.getReceivings().getFirst().getDeletedAt()).isNotNull();
        assertThat(message.getReceivings().getFirst().isDeleted()).isTrue();
    }

    private static Message getDraftMessage(Emp sender) {
        return Message.createDraft("testTitle", "testContent", sender);
    }

    private static Message getSentMessage(Emp sender, Emp receiver) {
        return Message.createSent(
                sender,
                "testTitle",
                "testContent",
                List.of(receiver),
                LocalDateTime.of(2026, 5, 1, 0, 0, 0)
        );
    }
}