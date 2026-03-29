package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;

@Entity
@Getter(AccessLevel.PROTECTED)
public class Franchise extends AbstractEntity {

    @Column(nullable = false)
    private String businessNumber;

}
