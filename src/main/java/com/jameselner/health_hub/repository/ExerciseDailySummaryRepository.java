package com.jameselner.health_hub.repository;

import com.jameselner.health_hub.model.entity.ExerciseDailySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExerciseDailySummaryRepository extends JpaRepository<ExerciseDailySummary, UUID> {

    Optional<ExerciseDailySummary> findByEntryDate(LocalDate entryDate);

    List<ExerciseDailySummary> findByEntryDateBetween(LocalDate startDate, LocalDate endDate);
}
