package com.haruon.groupware.domain.meetingroom;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
public class MeetingRoom extends AbstractEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private long capacity;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private boolean isAvailable;

    @OneToMany(mappedBy = "meetingRoom", orphanRemoval = true, cascade = CascadeType.ALL)
    private List<MeetingRoomFile> meetingRoomFile = new ArrayList<>();

}
