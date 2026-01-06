package com.jameselner.health_hub.model.entity;

import com.jameselner.health_hub.model.enums.ActivityType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "exercise_entry")
@Getter
@Setter
@NoArgsConstructor
public class ExerciseEntry extends AbstractBaseEntity {

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false)
    private ActivityType activityType;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "steps")
    private Integer steps;

    @Column(name = "stretching", nullable = false)
    private boolean stretching;
}
