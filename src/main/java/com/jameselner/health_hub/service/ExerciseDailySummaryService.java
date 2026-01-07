package com.jameselner.health_hub.service;

import com.jameselner.health_hub.model.entity.ExerciseDailySummary;
import com.jameselner.health_hub.repository.ExerciseDailySummaryRepository;
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
public class ExerciseDailySummaryService {

    private final ExerciseDailySummaryRepository repository;

    public List<ExerciseDailySummary> findAll() {
        return repository.findAll();
    }

    public Optional<ExerciseDailySummary> findById(UUID id) {
        return repository.findById(id);
    }

    public Optional<ExerciseDailySummary> findByDate(LocalDate date) {
        return repository.findByEntryDate(date);
    }

    public List<ExerciseDailySummary> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return repository.findByEntryDateBetween(startDate, endDate);
    }

    @Transactional
    public ExerciseDailySummary save(ExerciseDailySummary summary) {
        return repository.save(summary);
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    @Transactional
    public void delete(ExerciseDailySummary summary) {
        repository.delete(summary);
    }
}
