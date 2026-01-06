package com.jameselner.health_hub.ui.component;

import com.jameselner.health_hub.model.entity.SleepEntry;
import com.jameselner.health_hub.model.enums.SleepQuality;
import com.jameselner.health_hub.service.SleepEntryService;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;

import java.time.LocalDate;

public class SleepCard extends VerticalLayout {

    private final SleepEntryService service;
    private final RadioButtonGroup<SleepQuality> qualityGroup;
    private LocalDate currentDate;
    private SleepEntry currentEntry;

    public SleepCard(SleepEntryService service) {
        this.service = service;

        addClassName("card");
        getStyle()
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("border-radius", "var(--lumo-border-radius-m)")
                .set("padding", "var(--lumo-space-m)");

        H3 title = new H3("Sleep");
        title.getStyle().set("margin-top", "0");

        qualityGroup = new RadioButtonGroup<>();
        qualityGroup.setItems(SleepQuality.values());
        qualityGroup.setItemLabelGenerator(this::formatQualityLabel);
        qualityGroup.addValueChangeListener(e -> {
            if (e.isFromClient()) {
                save(e.getValue());
            }
        });

        add(title, qualityGroup);
    }

    public void setDate(LocalDate date) {
        this.currentDate = date;
        loadEntry();
    }

    private void loadEntry() {
        currentEntry = service.findByDate(currentDate).orElse(null);
        if (currentEntry != null) {
            qualityGroup.setValue(currentEntry.getQuality());
        } else {
            qualityGroup.clear();
        }
    }

    private void save(SleepQuality quality) {
        if (quality == null) return;

        if (currentEntry == null) {
            currentEntry = new SleepEntry();
            currentEntry.setEntryDate(currentDate);
        }
        currentEntry.setQuality(quality);
        currentEntry = service.save(currentEntry);
    }

    private String formatQualityLabel(SleepQuality quality) {
        return switch (quality) {
            case GOOD -> "Good";
            case MODERATE -> "Moderate";
            case POOR -> "Poor";
        };
    }
}
