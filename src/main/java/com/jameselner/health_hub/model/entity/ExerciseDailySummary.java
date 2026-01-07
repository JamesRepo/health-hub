package com.jameselner.health_hub.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "exercise_daily_summary")
@Getter
@Setter
@NoArgsConstructor
public class ExerciseDailySummary extends AbstractBaseEntity {

    @Column(name = "entry_date", nullable = false, unique = true)
    private LocalDate entryDate;

    @Column(name = "steps")
    private Integer steps;

    @Column(name = "stretching", nullable = false)
    private boolean stretching;
}
