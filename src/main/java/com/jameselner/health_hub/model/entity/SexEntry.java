package com.jameselner.health_hub.model.entity;

import com.jameselner.health_hub.model.enums.SexType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "sex_entry")
@Getter
@Setter
@NoArgsConstructor
public class SexEntry extends AbstractBaseEntity {

    @Column(name = "entry_date", nullable = false, unique = true)
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private SexType type;
}
