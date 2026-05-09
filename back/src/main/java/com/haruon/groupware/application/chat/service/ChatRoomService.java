package com.haruon.groupware.application.chat.service;

import com.haruon.groupware.application.chat.provided.ChatRoomCleanup;
import com.haruon.groupware.application.chat.provided.ChatRoomManagement;
import com.haruon.groupware.application.chat.required.ChatRepository;
import com.haruon.groupware.application.chat.required.ChatRoomRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.chat.ChatMessage;
import com.haruon.groupware.domain.chat.ChatRoom;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.chat.service.ChatUtils.findChat;
import static com.haruon.groupware.application.chat.service.ChatUtils.findChatRoom;
import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.findEmpListById;
import static com.haruon.groupware.domain.chat.ChatRoom.createRoom;

@Transactional
@Service
@RequiredArgsConstructor
public class ChatRoomService implements ChatRoomManagement, ChatRoomCleanup {

    private final ChatRoomRepository chatRoomRepository;
    private final EmpRepository empRepository;
    private final ChatRepository chatRepository;

    @Override
    public long makeRoom(Long ownerId, Set<Long> memberIds, LocalDateTime createAt) {
        Emp owner = findActiveEmpById(empRepository, ownerId);
        List<Emp> participants = findEmpListById(empRepository, memberIds);

        ChatRoom room = createRoom(
                owner, participants, createAt
        );

        return chatRoomRepository.save(room).getId();
    }

    @Override
    public void inviteRoomByMember(
            Long inviterId, Long roomId, Set<Long> receiverId, LocalDateTime invitedAt
    ) {
        Emp inviter = findActiveEmpById(empRepository, inviterId);
        List<Emp> receivers = findEmpListById(empRepository, receiverId);

        ChatRoom room = findChatRoom(chatRoomRepository, roomId);

        receivers.forEach(receiver ->
            room.inviteMember(inviter, receiver, invitedAt)
        );
    }

    @Override
    public void updateDisplayNameByMember(Long roomId, Long editorId, String name) {
        Emp editor = findActiveEmpById(empRepository, editorId);
        ChatRoom room = findChatRoom(chatRoomRepository, roomId);

        room.updateDisplayNameByMember(editor, name);
    }

    @Override
    public void leaveRoomByMember(Long roomId, Long editorId, LocalDateTime leftAt) {
        Emp editor = findActiveEmpById(empRepository, editorId);
        ChatRoom room = findChatRoom(chatRoomRepository, roomId);

        room.leaveRoomByMember(editor, leftAt);
    }

    @Override
    public void markAsBookMarkedByMember(Long roomId, Long markerId) {
        Emp marker = findActiveEmpById(empRepository, markerId);
        ChatRoom room = findChatRoom(chatRoomRepository, roomId);

        room.markAsBookMarkedByMember(marker);
    }

    @Override
    public void unmarkAsBookMarkedByMember(Long roomId, Long unmarkerId) {
        Emp unmarker = findActiveEmpById(empRepository, unmarkerId);
        ChatRoom room = findChatRoom(chatRoomRepository, roomId);

        room.unmarkAsBookMarkedByMember(unmarker);
    }

    @Override
    public void renewLatestReadChatByMember(Long readerId, Long roomId, Long chatId) {
        Emp reader = findActiveEmpById(empRepository, readerId);
        ChatRoom room = findChatRoom(chatRoomRepository, roomId);
        ChatMessage chat = findChat(chatRepository, chatId);

        room.changeLastReadMessageByMember(reader, chat);
    }

    @Override
    public boolean deletableChatroomByBatch(Long roomId, LocalDateTime currentTime) {
        ChatRoom room = findChatRoom(chatRoomRepository, roomId);

        return room.isDeletable(currentTime);
    }
}
