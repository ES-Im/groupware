package com.haruon.groupware.application.message.required;

import com.haruon.groupware.domain.message.Message;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface MessageRepository extends Repository<Message, Long> {
    Message save(Message message);

    Optional<Message> findById(Long id);

    void delete(Message found);

    void deleteAll();
}
