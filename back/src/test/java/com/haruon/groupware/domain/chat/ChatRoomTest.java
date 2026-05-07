package com.haruon.groupware.domain.chat;

import com.haruon.groupware.domain.empInfo.Emp;
import org.jspecify.annotations.NonNull;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Set;

import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class ChatRoomTest {



    @Test
    @DisplayName("채팅방 생성 & 참여자 생성 테스트 - 참여자가 2명 이하라면 isGroup = false")
    void creatRoom_with_2_members_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member));

        assertThat(chatRoom.getIsGroup())
                .as("참여자가 2명 이하라면 isGroup = false")
                .isFalse();
        assertThat(chatRoom.getMembers()).hasSize(2);
        assertThat(chatRoom.isParticipating(owner)).isTrue();
        assertThat(chatRoom.isParticipating(member)).isTrue();
    }

    @Test
    @DisplayName("채팅방 생성 & 참여자 생성 테스트 - 참여자가 3명 이상이라면 isGroup = true")
    void createRoom_with_3_members_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");
        Emp member2 = getApprovedEmp("202601003","member002");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1, member2));

        assertThat(chatRoom.getIsGroup())
                .as("참여자가 2명 초과라면 isGroup = true")
                .isTrue();
        assertThat(chatRoom.getMembers()).hasSize(3);
        assertThat(chatRoom.isParticipating(owner)).isTrue();
        assertThat(chatRoom.isParticipating(member1)).isTrue();
        assertThat(chatRoom.isParticipating(member2)).isTrue();
    }

    @Test
    @DisplayName("채팅방 생성 테스트 - 채팅 참가자는 최소 2명 이상 필요")
    void createRoom_with_less_than_2_members_fail() {
        String errorMsg = "채팅 참가자는 최소 2명 이상 필요";

        Emp owner = getApprovedEmp("202601001","owner001");

        assertThatThrownBy(() ->
                createRoom(owner, Set.of(owner))
        ).hasMessage(errorMsg);
    }

    @Test
    @DisplayName("채팅방 생성 테스트 - 참가자목록에 방장이 있어야함")
    void createRoom_with_no_room_owner_fail() {
        String errorMsg = "참가자목록에 방장이 있어야함";

        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");
        Emp member2 = getApprovedEmp("202601003","member002");

        assertThatThrownBy(() ->
                createRoom(owner, Set.of(member1, member2))
        ).hasMessage(errorMsg);

    }

    @Test
    @DisplayName("채팅방 초대 테스트 - 이전에 나간 멤버라면 참가자 객체를 수정한다")
    void invite_left_member_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");
        Emp member2 = getApprovedEmp("202601003","member002");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1, member2));

        LocalDateTime leaveAt = LocalDateTime.of(2026, 1, 1, 9, 0);
        chatRoom.leaveRoomByMember(member2, leaveAt);

        assertThat(chatRoom.getMembers().stream().filter(ChatMember::isParticipating)).hasSize(2);
        assertThat(chatRoom.isParticipating(member2)).isFalse();

        ChatMember chatMember = getChatMember(chatRoom, member2);

        assertEquals(chatMember.getLeftAt(), leaveAt);
    }



    @Test
    @DisplayName("채팅방 초대 테스트 - 새로운 멤버라면 참가자 객체를 생성한다.")
    void invite_new_member_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");
        Emp member2 = getApprovedEmp("202601003","member002");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));

        LocalDateTime joinedAt = LocalDateTime.of(2026, 1, 1, 9, 0);
        chatRoom.inviteMember(member1, member2, joinedAt);

        assertThat(chatRoom.getMembers().stream().filter(ChatMember::isParticipating)).hasSize(3);
        assertThat(chatRoom.isParticipating(member2)).isTrue();

        ChatMember chatMember = getChatMember(chatRoom, member2);

        assertEquals(chatMember.getJoinedAt(), joinedAt);
    }

    @Test
    @DisplayName("채팅방 초대 테스트 - 초대 후 참가자 수가 3이상이라면 isgroup = true")
    void invite_more_than_3_members_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");
        Emp member2 = getApprovedEmp("202601003","member002");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));

        LocalDateTime joinedAt = LocalDateTime.of(2026, 1, 1, 9, 0);
        chatRoom.inviteMember(member1, member2, joinedAt);

        assertThat(chatRoom.getIsGroup()).isTrue();
    }

    @Test
    @DisplayName("채팅방 초대 테스트 - 초대 후 참가자 수가 2이하이라면 isgroup = false")
    void invite_less_than_3_members_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        chatRoom.leaveRoomByMember(member1, LocalDateTime.of(2026, 1, 1, 8, 18));

        LocalDateTime joinedAt = LocalDateTime.of(2026, 1, 1, 9, 0);
        chatRoom.inviteMember(owner, member1, joinedAt);

        assertThat(chatRoom.getIsGroup()).isFalse();
    }

    @Test
    @DisplayName("채팅방 초대 테스트 - 이미 참가중인 멤버라면 초대할 수 없다.")
    void invite_exist_member_fail() {
        String errorMsg = "이미 참여 중인 멤버";

        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));

        assertThatThrownBy(() ->
            chatRoom.inviteMember(owner, member1, LocalDateTime.of(2026,1,9,0,0,0))
        ).hasMessage(errorMsg);
    }

    @Test
    @DisplayName("채팅방 이름 수정")
    void updateDisplayNameByMember_success() {
        String errorMsg = "이미 참여 중인 멤버";

        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));

        String name = "test";
        chatRoom.updateDisplayNameByMember(member1, name);

        ChatMember chatMember1 = getChatMember(chatRoom, member1);
        ChatMember chatOwner = getChatMember(chatRoom, owner);

        assertThat(chatMember1.getRoomName())
                .as("채팅방 제목을 바꾼 멤버화면에서 바꾼 이름이 적용된다.")
                .isEqualTo(name);

        assertThat(chatOwner.getRoomName())
                .as("채팅방 제목을 바꾼 멤버 입장에서는 채팅방 이름이 변경되지 않는다")
                .isNull();
    }

    @Test
    @DisplayName("채팅방 나가기 - 참가자가 채팅방을 나가고 잔여 참여자 수가 2이하라면 isGroup = false")
    void leaveRoomByMember_with_2_members_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");
        Emp member2 = getApprovedEmp("202601003","member002");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1, member2));
        chatRoom.leaveRoomByMember(member1, LocalDateTime.of(2026, 1, 1, 8, 18));

        assertThat(chatRoom.getIsGroup()).isFalse();
    }

    @Test
    @DisplayName("채팅방 나가기 - 참가자가 채팅방을 나가고 잔여 참여자 수가 0이라면 채팅방이 종료")
    void leaveRoomByMember_with_0_members_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        chatRoom.leaveRoomByMember(member1, LocalDateTime.of(2026, 1, 1, 8, 18));
        chatRoom.leaveRoomByMember(owner, LocalDateTime.of(2026, 1, 1, 8, 18));

        assertThat(chatRoom.getClosedAt()).isNotNull();
    }

    @Test
    @DisplayName("채팅방 즐겨찾기 - 참여자는 채팅방 별로 즐겨찾기를 표시할 수 있다.")
    void markAsBookMarkedByMember_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        chatRoom.markAsBookMarkedByMember(member1);
        ChatMember chatMember = getChatMember(chatRoom, member1);
        ChatMember chatOwner = getChatMember(chatRoom, owner);
        assertThat(chatMember.isBookMarked()).isTrue();
        assertThat(chatOwner.isBookMarked()).isFalse();
    }


    @Test
    @DisplayName("채팅방 즐겨찾기 해제 - 참여자는 채팅방 별로 즐겨찾기를 취소할 수 있다.")
    void unmarkAsBookMarkedByMember_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        chatRoom.markAsBookMarkedByMember(member1);
        chatRoom.unmarkAsBookMarkedByMember(member1);

        ChatMember chatMember = getChatMember(chatRoom, member1);
        assertThat(chatMember.isBookMarked()).isFalse();
    }


    @Test
    @DisplayName("채팅창 삭제 조건 검증 테스트 - 채팅창 종료 후 30일이 지나면 물리삭제 (배치) 대상이다.")
    void isDeletable_pass() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        LocalDateTime closeAt = LocalDateTime.of(2026, 1, 1, 8, 19);
        chatRoom.leaveRoomByMember(member1, LocalDateTime.of(2026, 1, 1, 8, 18));
        chatRoom.leaveRoomByMember(owner, closeAt);


        assertThat(chatRoom.isDeletable(closeAt.plusDays(30))).isTrue();
    }

    @Test
    @DisplayName("채팅창 삭제 조건 검증 테스트 - 채팅창 종료 후 30일이 지나지 않음녀 물리삭제 (배치) 대상이 아니다.")
    void isDeletable_unpass() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        LocalDateTime closeAt = LocalDateTime.of(2026, 1, 1, 8, 19);
        chatRoom.leaveRoomByMember(member1, LocalDateTime.of(2026, 1, 1, 8, 18));
        chatRoom.leaveRoomByMember(owner, closeAt);


        assertThat(chatRoom.isDeletable(closeAt.plusDays(29))).isFalse();
    }

    @Test
    @DisplayName("채팅보내기 테스트 - 채팅을 보내면, 마지막 메세지 시각이 변한다.")
    void sendMessage_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        LocalDateTime sentAt = LocalDateTime.of(2026, 1, 1, 8, 18);
        chatRoom.sendMessage(member1, "test", sentAt);

        assertThat(chatRoom.getLastMessageAt()).isEqualTo(sentAt);
    }

    @Test
    @DisplayName("채팅보내기 테스트 - 참여시각 이전보다 채팅 생성 시각이 이를 수 없음")
    void sendMessage_send_before_join_fail() {
        String errorMsg = "참여시각 이전보다 채팅 생성 시각이 이를 수 없음";

        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        ChatMember chatMember = getChatMember(chatRoom, member1);

        LocalDateTime sentAt = chatMember.getJoinedAt().minusMinutes(1);

        assertThatThrownBy(() ->
                chatRoom.sendMessage(member1, "test", sentAt)
        ).hasMessage(errorMsg);
    }

    @Test
    @DisplayName("채팅보내기 테스트 - 채팅보낸 시각은 가장 최근의 채팅 생성 시각보다 이를 수 없음")
    void sendMessage_send_before_last_message_fail() {
        String errorMsg = "채팅보낸 시각은 가장 최근의 채팅 생성 시각보다 이를 수 없음";

        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        ChatMember chatMember = getChatMember(chatRoom, member1);

        LocalDateTime sentAt = chatMember.getJoinedAt().plusHours(1);
        LocalDateTime sentSecondAt = sentAt.minusMinutes(1);
        chatRoom.sendMessage(member1, "test", sentAt);

        assertThatThrownBy(() ->
                chatRoom.sendMessage(member1, "test2", sentSecondAt)
        ).hasMessage(errorMsg);
    }

    @Test
    @DisplayName("채팅방 마지막 읽은 메세지 교체 - 참여자는 채팅방 종료 시, 마지막으로 읽은 메세지가 교체된다.")
    void changeLastReadMessageByMember_success() {
        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));
        ChatMember chatMember = getChatMember(chatRoom, member1);

        LocalDateTime sentAt = chatMember.getJoinedAt().plusHours(1);
        ChatMessage message = chatRoom.sendMessage(member1, "test", sentAt);

        chatRoom.changeLastReadMessageByMember(owner, message);
        ChatMember chatOwner = getChatMember(chatRoom, owner);

        assertThat(chatOwner.getLastReadMessage()).isEqualTo(message);
    }

    @Test
    @DisplayName("채팅 참여자가 아니라면, 채팅방 관련 수정 행위를 할 수 없다.")
    void all_method_fail_by_not_active_member() {
        String errorMsg = "해당 참가자가 없음";

        Emp owner = getApprovedEmp("202601001","owner001");
        Emp member1 = getApprovedEmp("202601002","member001");
        Emp notMember = getApprovedEmp("202601003","not_member001");
        Emp notMember2 = getApprovedEmp("202601004","not_member002");

        ChatRoom chatRoom = createRoom(owner, Set.of(owner, member1));

        assertThatThrownBy(() ->
            chatRoom.inviteMember(notMember, notMember2, LocalDateTime.of(2026,2,1,0,0,0))
        ).as("참가자가 아니면 초대를 할 수 없다.").hasMessage(errorMsg);

        assertThatThrownBy(() ->
            chatRoom.updateDisplayNameByMember(notMember, "notMember2")
        ).as("참가자가 아니면 방이름을 변경할 수 없다").hasMessage(errorMsg);

        assertThatThrownBy(() ->
            chatRoom.leaveRoomByMember(notMember, LocalDateTime.of(2026,2,1,0,0,0))
        ).as("참가자가 아니면 채팅방 나가기를 할 수 없다").hasMessage(errorMsg);

        assertThatThrownBy(() ->
            chatRoom.markAsBookMarkedByMember(notMember)
        ).as("참가자가 아니면 즐겨찾기를 할 수 없다").hasMessage(errorMsg);

        assertThatThrownBy(() -> {
            ChatMessage message = chatRoom.sendMessage(owner, "test", LocalDateTime.of(2026, 2, 1, 0, 0, 0));
            chatRoom.changeLastReadMessageByMember(notMember, message);
        }).as("참가자가 아니면 채팅 읽음 처리를 할 수 없다.").hasMessage(errorMsg);

        assertThatThrownBy(() ->
                chatRoom.sendMessage(notMember, "test", LocalDateTime.of(2026, 2, 1, 0, 0, 0))
        ).as("참가자가 아니면 채팅을 보낼 수 없다.").hasMessage(errorMsg);
    }

    private ChatRoom createRoom(Emp owner, Set<Emp> members) {
        return ChatRoom.createRoom(
                owner,
                members,
                LocalDateTime.of(2026, 1, 1, 8, 0)
        );
    }

    private ChatMember getChatMember(ChatRoom chatRoom, Emp member2) {
        return chatRoom.getMembers().stream().filter(e
                -> e.getEmp().equals(member2)
        ).findFirst().orElseThrow();
    }



}