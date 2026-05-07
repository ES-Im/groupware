package com.haruon.groupware.application.message.required;

import com.haruon.groupware.domain.message.Message;
import org.springframework.data.repository.Repository;

public interface MessageRepository extends Repository<Message, Long> {
}
