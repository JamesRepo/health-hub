package com.jameselner.health_hub.service;

import com.jameselner.health_hub.model.entity.AlcoholEntry;
import com.jameselner.health_hub.model.enums.DrinkRange;
import com.jameselner.health_hub.repository.AlcoholEntryRepository;
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
class AlcoholEntryServiceTest {

    @Mock
    private AlcoholEntryRepository repository;

    @InjectMocks
    private AlcoholEntryService service;

    private AlcoholEntry entry;
    private UUID id;
    private LocalDate date;

    @BeforeEach
    void setUp() {
        id = UUID.randomUUID();
        date = LocalDate.of(2024, 1, 15);
        entry = new AlcoholEntry();
        entry.setEntryDate(date);
        entry.setDrinkRange(DrinkRange.ONE_TO_THREE);
        entry.setExtras(false);
    }

    @Test
    void findAll_returnsAllEntries() {
        when(repository.findAll()).thenReturn(List.of(entry));

        List<AlcoholEntry> result = service.findAll();

        assertThat(result).containsExactly(entry);
        verify(repository).findAll();
    }

    @Test
    void findById_whenExists_returnsEntry() {
        when(repository.findById(id)).thenReturn(Optional.of(entry));

        Optional<AlcoholEntry> result = service.findById(id);

        assertThat(result).contains(entry);
        verify(repository).findById(id);
    }

    @Test
    void findById_whenNotExists_returnsEmpty() {
        when(repository.findById(id)).thenReturn(Optional.empty());

        Optional<AlcoholEntry> result = service.findById(id);

        assertThat(result).isEmpty();
    }

    @Test
    void findByDate_whenExists_returnsEntry() {
        when(repository.findByEntryDate(date)).thenReturn(Optional.of(entry));

        Optional<AlcoholEntry> result = service.findByDate(date);

        assertThat(result).contains(entry);
        verify(repository).findByEntryDate(date);
    }

    @Test
    void findByDate_whenNotExists_returnsEmpty() {
        when(repository.findByEntryDate(date)).thenReturn(Optional.empty());

        Optional<AlcoholEntry> result = service.findByDate(date);

        assertThat(result).isEmpty();
    }

    @Test
    void findByDateRange_returnsEntriesInRange() {
        LocalDate startDate = LocalDate.of(2024, 1, 1);
        LocalDate endDate = LocalDate.of(2024, 1, 31);
        when(repository.findByEntryDateBetween(startDate, endDate)).thenReturn(List.of(entry));

        List<AlcoholEntry> result = service.findByDateRange(startDate, endDate);

        assertThat(result).containsExactly(entry);
        verify(repository).findByEntryDateBetween(startDate, endDate);
    }

    @Test
    void save_persistsAndReturnsEntry() {
        when(repository.save(entry)).thenReturn(entry);

        AlcoholEntry result = service.save(entry);

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
