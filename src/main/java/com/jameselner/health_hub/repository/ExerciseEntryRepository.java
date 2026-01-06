package com.jameselner.health_hub.repository;

import com.jameselner.health_hub.model.entity.ExerciseEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExerciseEntryRepository extends JpaRepository<ExerciseEntry, UUID> {

    List<ExerciseEntry> findByEntryDate(LocalDate entryDate);

    List<ExerciseEntry> findByEntryDateBetween(LocalDate startDate, LocalDate endDate);
}
