package com.jameselner.health_hub.repository;

import com.jameselner.health_hub.model.entity.AlcoholEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlcoholEntryRepository extends JpaRepository<AlcoholEntry, UUID> {

    Optional<AlcoholEntry> findByEntryDate(LocalDate entryDate);

    List<AlcoholEntry> findByEntryDateBetween(LocalDate startDate, LocalDate endDate);
}
