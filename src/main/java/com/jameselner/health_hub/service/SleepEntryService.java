package com.jameselner.health_hub.service;

import com.jameselner.health_hub.model.entity.SleepEntry;
import com.jameselner.health_hub.repository.SleepEntryRepository;
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
public class SleepEntryService {

    private final SleepEntryRepository repository;

    public List<SleepEntry> findAll() {
        return repository.findAll();
    }

    public Optional<SleepEntry> findById(UUID id) {
        return repository.findById(id);
    }

    public Optional<SleepEntry> findByDate(LocalDate date) {
        return repository.findByEntryDate(date);
    }

    public List<SleepEntry> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return repository.findByEntryDateBetween(startDate, endDate);
    }

    @Transactional
    public SleepEntry save(SleepEntry entry) {
        return repository.save(entry);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    @Transactional
    public void delete(SleepEntry entry) {
        repository.delete(entry);
    }
}
