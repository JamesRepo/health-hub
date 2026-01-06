package com.jameselner.health_hub.service;

import com.jameselner.health_hub.model.entity.ExerciseEntry;
import com.jameselner.health_hub.repository.ExerciseEntryRepository;
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
public class ExerciseEntryService {

    private final ExerciseEntryRepository repository;

    public List<ExerciseEntry> findAll() {
        return repository.findAll();
    }

    public Optional<ExerciseEntry> findById(UUID id) {
        return repository.findById(id);
    }

    public List<ExerciseEntry> findByDate(LocalDate date) {
        return repository.findByEntryDate(date);
    }

    public List<ExerciseEntry> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return repository.findByEntryDateBetween(startDate, endDate);
    }

    @Transactional
    public ExerciseEntry save(ExerciseEntry entry) {
        return repository.save(entry);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    @Transactional
    public void delete(ExerciseEntry entry) {
        repository.delete(entry);
    }
}
