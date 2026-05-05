package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class Category extends AbstractEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private boolean isVisible;


    public static Category create(String name) {
        Category category = new Category();

        category.name = requireNonNull(name);
        category.isVisible = true;

        return category;
    }

    public void changeCategoryName(String name) {
        this.name = requireNonNull(name);
    }

    public void changeVisibility(boolean isVisible) {
        this.isVisible = isVisible;
    }
}