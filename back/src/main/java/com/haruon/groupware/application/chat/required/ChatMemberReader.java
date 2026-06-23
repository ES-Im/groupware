package com.haruon.groupware.application.chat.required;

public interface ChatMemberReader {

    boolean isActiveMember(Long empId, Long roomId);
}
