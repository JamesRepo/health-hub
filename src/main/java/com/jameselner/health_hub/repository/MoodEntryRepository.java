package com.jameselner.health_hub.repository;

import com.jameselner.health_hub.model.entity.MoodEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MoodEntryRepository extends JpaRepository<MoodEntry, UUID> {

    Optional<MoodEntry> findByEntryDate(LocalDate entryDate);

    List<MoodEntry> findByEntryDateBetween(LocalDate startDate, LocalDate endDate);
}
