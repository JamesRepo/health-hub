package com.jameselner.health_hub.service;

import com.jameselner.health_hub.model.entity.SexEntry;
import com.jameselner.health_hub.repository.SexEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SexEntryService {

    private final SexEntryRepository repository;

    public List<SexEntry> findAll() {
        return repository.findAll();
    }

    public Optional<SexEntry> findById(UUID id) {
        return repository.findById(id);
    }

    public Optional<SexEntry> findByDate(LocalDate date) {
        return repository.findByEntryDate(date);
    }

    public List<SexEntry> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return repository.findByEntryDateBetween(startDate, endDate);
    }

    @Transactional
    public SexEntry save(SexEntry entry) {
        return repository.save(entry);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    @Transactional
    public void delete(SexEntry entry) {
        repository.delete(entry);
    }
}
