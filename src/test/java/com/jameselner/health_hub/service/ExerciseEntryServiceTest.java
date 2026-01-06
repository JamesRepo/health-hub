package com.jameselner.health_hub.service;

import com.jameselner.health_hub.model.entity.ExerciseEntry;
import com.jameselner.health_hub.model.enums.ActivityType;
import com.jameselner.health_hub.repository.ExerciseEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExerciseEntryServiceTest {

    @Mock
    private ExerciseEntryRepository repository;

    @InjectMocks
    private ExerciseEntryService service;

    private ExerciseEntry entry;
    private ExerciseEntry secondEntry;
    private UUID id;
    private LocalDate date;

    @BeforeEach
    void setUp() {
        id = UUID.randomUUID();
        date = LocalDate.of(2024, 1, 15);

        entry = new ExerciseEntry();
        entry.setEntryDate(date);
        entry.setActivityType(ActivityType.RUN);
        entry.setDurationMinutes(30);
        entry.setSteps(5000);
        entry.setStretching(true);

        secondEntry = new ExerciseEntry();
        secondEntry.setEntryDate(date);
        secondEntry.setActivityType(ActivityType.GYM);
        secondEntry.setDurationMinutes(60);
        secondEntry.setStretching(false);
    }

    @Test
    void findAll_returnsAllEntries() {
        when(repository.findAll()).thenReturn(List.of(entry, secondEntry));

        List<ExerciseEntry> result = service.findAll();

        assertThat(result).containsExactly(entry, secondEntry);
        verify(repository).findAll();
    }

    @Test
    void findById_whenExists_returnsEntry() {
        when(repository.findById(id)).thenReturn(Optional.of(entry));

        Optional<ExerciseEntry> result = service.findById(id);

        assertThat(result).contains(entry);
        verify(repository).findById(id);
    }

    @Test
    void findById_whenNotExists_returnsEmpty() {
        when(repository.findById(id)).thenReturn(Optional.empty());

        Optional<ExerciseEntry> result = service.findById(id);

        assertThat(result).isEmpty();
    }

    @Test
    void findByDate_returnsAllEntriesForDate() {
        when(repository.findByEntryDate(date)).thenReturn(List.of(entry, secondEntry));

        List<ExerciseEntry> result = service.findByDate(date);

        assertThat(result).containsExactly(entry, secondEntry);
        verify(repository).findByEntryDate(date);
    }

    @Test
    void findByDate_whenNoEntries_returnsEmptyList() {
        when(repository.findByEntryDate(date)).thenReturn(List.of());

        List<ExerciseEntry> result = service.findByDate(date);

        assertThat(result).isEmpty();
    }

    @Test
    void findByDateRange_returnsEntriesInRange() {
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        when(repository.findByEntryDateBetween(startDate, endDate)).thenReturn(List.of(entry, secondEntry));

        List<ExerciseEntry> result = service.findByDateRange(startDate, endDate);

        assertThat(result).containsExactly(entry, secondEntry);
        verify(repository).findByEntryDateBetween(startDate, endDate);
    }

    @Test
    void save_persistsAndReturnsEntry() {
        when(repository.save(entry)).thenReturn(entry);

        ExerciseEntry result = service.save(entry);

        assertThat(result).isEqualTo(entry);
        verify(repository).save(entry);
    }

    @Test
    void deleteById_deletesEntry() {
        service.delete(id);

        verify(repository).deleteById(id);
    }

    @Test
    void deleteEntry_deletesEntry() {
        service.delete(entry);

        verify(repository).delete(entry);
    }
}
