package com.haruon.groupware.application.board.required;

import com.haruon.groupware.domain.board.Category;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface CategoryRepository extends Repository<Category, Long> {

    Category save(Category category);

    Optional<Category> findById(Long categoryId);

    void deleteAll();
}
