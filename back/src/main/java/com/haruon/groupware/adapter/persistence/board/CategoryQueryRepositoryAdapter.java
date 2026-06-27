package com.haruon.groupware.adapter.persistence.board;

import com.haruon.groupware.application.board.required.CategoryQueryRepository;
import com.haruon.groupware.application.board.service.query.dto.CategoryResponse;
import com.haruon.groupware.domain.board.QCategory;
import com.querydsl.core.types.ConstructorExpression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class CategoryQueryRepositoryAdapter implements CategoryQueryRepository {

    private final JPAQueryFactory query;
    private final QCategory category = QCategory.category;

    private ConstructorExpression<CategoryResponse> categoryResponseConstructorExpression() {
        return Projections.constructor(
                CategoryResponse.class,
                category.id,
                category.name,
                category.isVisible
        );
    }

    @Override
    public List<CategoryResponse> findCategoriesByVisibleTrue() {
         return query
                .select(categoryResponseConstructorExpression())
                .from(category)
                .where(category.isVisible.isTrue())
                .orderBy(category.id.asc())
                .fetch();
    }

    @Override
    public Page<CategoryResponse> findCategories(
            @Nullable String categoryNameKeyword, @Nullable Boolean isVisible, Pageable pageable
    ) {
        Long rows = query
                .select(category.id.countDistinct())
                .from(category)
                .where(
                        isKeywordInCategoryName(categoryNameKeyword),
                        isVisibleCategory(isVisible)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<CategoryResponse> responses = query
                .select(categoryResponseConstructorExpression())
                .from(category)
                .where(
                        isKeywordInCategoryName(categoryNameKeyword),
                        isVisibleCategory(isVisible)
                )
                .orderBy(category.id.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    private BooleanExpression isKeywordInCategoryName(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : category.name.containsIgnoreCase(keyword);
    }

    private BooleanExpression isVisibleCategory(@Nullable Boolean isVisible) {
        return isVisible == null
                ? null
                : category.isVisible.eq(isVisible);
    }

}
