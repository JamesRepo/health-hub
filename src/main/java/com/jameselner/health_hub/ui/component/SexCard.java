package com.jameselner.health_hub.ui.component;

import com.jameselner.health_hub.model.entity.SexEntry;
import com.jameselner.health_hub.model.enums.SexType;
import com.jameselner.health_hub.service.SexEntryService;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;

import java.time.LocalDate;

public class SexCard extends VerticalLayout {

    private final SexEntryService service;
    private final RadioButtonGroup<SexType> typeGroup;
    private LocalDate currentDate;
    private SexEntry currentEntry;

    public SexCard(SexEntryService service) {
        this.service = service;

        addClassName("card");
        getStyle()
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("border-radius", "var(--lumo-border-radius-m)")
                .set("padding", "var(--lumo-space-m)");

        H3 title = new H3("Sex");
        title.getStyle().set("margin-top", "0");

        typeGroup = new RadioButtonGroup<>();
        typeGroup.setItems(SexType.values());
        typeGroup.setItemLabelGenerator(this::formatTypeLabel);
        typeGroup.addValueChangeListener(e -> {
            if (e.isFromClient()) {
                save(e.getValue());
            }
        });

        add(title, typeGroup);
    }

    public void setDate(LocalDate date) {
        this.currentDate = date;
        loadEntry();
    }

    private void loadEntry() {
        currentEntry = service.findByDate(currentDate).orElse(null);
        if (currentEntry != null) {
            typeGroup.setValue(currentEntry.getType());
        } else {
            typeGroup.clear();
        }
    }

    private void save(SexType type) {
        if (type == null) return;

        if (currentEntry == null) {
            currentEntry = new SexEntry();
            currentEntry.setEntryDate(currentDate);
        }
        currentEntry.setType(type);
        currentEntry = service.save(currentEntry);
    }

    private String formatTypeLabel(SexType type) {
        return switch (type) {
            case NONE -> "None";
            case SELF -> "Self";
            case GOOD_SEX -> "Good";
            case BAD_SEX -> "Bad";
        };
    }
}
