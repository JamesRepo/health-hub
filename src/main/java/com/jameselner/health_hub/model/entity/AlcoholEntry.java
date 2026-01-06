package com.jameselner.health_hub.model.entity;

import com.jameselner.health_hub.model.enums.DrinkRange;
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
@Table(name = "alcohol_entry")
@Getter
@Setter
@NoArgsConstructor
public class AlcoholEntry extends AbstractBaseEntity {

    @Column(name = "entry_date", nullable = false, unique = true)
    private LocalDate entryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "drink_range", nullable = false)
    private DrinkRange drinkRange;

    @Column(name = "extras", nullable = false)
    private boolean extras;
}
