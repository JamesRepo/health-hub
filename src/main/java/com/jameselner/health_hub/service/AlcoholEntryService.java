package com.jameselner.health_hub.service;

import com.jameselner.health_hub.model.entity.AlcoholEntry;
import com.jameselner.health_hub.repository.AlcoholEntryRepository;
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
public class AlcoholEntryService {

    private final AlcoholEntryRepository repository;

    public List<AlcoholEntry> findAll() {
        return repository.findAll();
    }

    public Optional<AlcoholEntry> findById(UUID id) {
        return repository.findById(id);
    }

    public Optional<AlcoholEntry> findByDate(LocalDate date) {
        return repository.findByEntryDate(date);
    }

    public List<AlcoholEntry> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return repository.findByEntryDateBetween(startDate, endDate);
    }

    @Transactional
    public AlcoholEntry save(AlcoholEntry entry) {
        return repository.save(entry);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    @Transactional
    public void delete(AlcoholEntry entry) {
        repository.delete(entry);
    }
}
