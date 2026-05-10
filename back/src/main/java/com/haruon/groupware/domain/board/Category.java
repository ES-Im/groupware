package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@ToString(callSuper = true)
public class Category extends AbstractEntity {

    private String name;

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