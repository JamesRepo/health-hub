package com.jameselner.health_hub.service;

import com.jameselner.health_hub.model.entity.MoodEntry;
import com.jameselner.health_hub.repository.MoodEntryRepository;
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
public class MoodEntryService {

    private final MoodEntryRepository repository;

    public List<MoodEntry> findAll() {
        return repository.findAll();
    }

    public Optional<MoodEntry> findById(UUID id) {
        return repository.findById(id);
    }

    public Optional<MoodEntry> findByDate(LocalDate date) {
        return repository.findByEntryDate(date);
    }

    public List<MoodEntry> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return repository.findByEntryDateBetween(startDate, endDate);
    }

    @Transactional
    public MoodEntry save(MoodEntry entry) {
        return repository.save(entry);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    @Transactional
    public void delete(MoodEntry entry) {
        repository.delete(entry);
    }
}
