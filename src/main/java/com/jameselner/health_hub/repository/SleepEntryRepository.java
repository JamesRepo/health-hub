package com.jameselner.health_hub.repository;

import com.jameselner.health_hub.model.entity.SleepEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SleepEntryRepository extends JpaRepository<SleepEntry, UUID> {

    Optional<SleepEntry> findByEntryDate(LocalDate entryDate);

    List<SleepEntry> findByEntryDateBetween(LocalDate startDate, LocalDate endDate);
}
