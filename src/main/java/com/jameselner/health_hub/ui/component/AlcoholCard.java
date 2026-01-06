package com.jameselner.health_hub.ui.component;

import com.jameselner.health_hub.model.entity.AlcoholEntry;
import com.jameselner.health_hub.model.enums.DrinkRange;
import com.jameselner.health_hub.service.AlcoholEntryService;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.select.Select;

import java.time.LocalDate;

public class AlcoholCard extends VerticalLayout {

    private final AlcoholEntryService service;
    private final Select<DrinkRange> drinkRangeSelect;
    private final Checkbox extrasCheckbox;
    private LocalDate currentDate;
    private AlcoholEntry currentEntry;

    public AlcoholCard(AlcoholEntryService service) {
        this.service = service;

        addClassName("card");
        getStyle()
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("border-radius", "var(--lumo-border-radius-m)")
                .set("padding", "var(--lumo-space-m)");

        H3 title = new H3("Alcohol");
        title.getStyle().set("margin-top", "0");

        drinkRangeSelect = new Select<>();
        drinkRangeSelect.setLabel("Drinks");
        drinkRangeSelect.setItems(DrinkRange.values());
        drinkRangeSelect.setItemLabelGenerator(this::formatDrinkRangeLabel);
        drinkRangeSelect.addValueChangeListener(e -> {
            if (e.isFromClient()) {
                save();
            }
        });

        extrasCheckbox = new Checkbox("Extras (shots, etc.)");
        extrasCheckbox.addValueChangeListener(e -> {
            if (e.isFromClient()) {
                save();
            }
        });

        add(title, drinkRangeSelect, extrasCheckbox);
    }

    public void setDate(LocalDate date) {
        this.currentDate = date;
        loadEntry();
    }

    private void loadEntry() {
        currentEntry = service.findByDate(currentDate).orElse(null);
        if (currentEntry != null) {
            drinkRangeSelect.setValue(currentEntry.getDrinkRange());
            extrasCheckbox.setValue(currentEntry.isExtras());
        } else {
            drinkRangeSelect.clear();
            extrasCheckbox.setValue(false);
        }
    }

    private void save() {
        DrinkRange drinkRange = drinkRangeSelect.getValue();
        if (drinkRange == null) return;

        if (currentEntry == null) {
            currentEntry = new AlcoholEntry();
            currentEntry.setEntryDate(currentDate);
        }
        currentEntry.setDrinkRange(drinkRange);
        currentEntry.setExtras(extrasCheckbox.getValue());
        currentEntry = service.save(currentEntry);
    }

    private String formatDrinkRangeLabel(DrinkRange range) {
        return switch (range) {
            case NONE -> "0 drinks";
            case ONE_TO_THREE -> "1-3 drinks";
            case FOUR_TO_SIX -> "4-6 drinks";
            case SEVEN_PLUS -> "7+ drinks";
        };
    }
}
