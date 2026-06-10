package com.haruon.groupware.application.board.required;

import com.haruon.groupware.application.board.service.dto.response.CategoryResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CategoryQueryRepository {

    List<CategoryResponse> findCategoriesByVisibleTrue();

    Page<CategoryResponse> findCategories(
            @Nullable String categoryNameKeyword,
            Boolean isVisible,
            Pageable pageable
    );
}
