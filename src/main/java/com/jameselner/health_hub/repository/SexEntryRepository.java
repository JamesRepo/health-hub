package com.jameselner.health_hub.repository;

import com.jameselner.health_hub.model.entity.SexEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SexEntryRepository extends JpaRepository<SexEntry, UUID> {

    Optional<SexEntry> findByEntryDate(LocalDate entryDate);

    List<SexEntry> findByEntryDateBetween(LocalDate startDate, LocalDate endDate);
}
