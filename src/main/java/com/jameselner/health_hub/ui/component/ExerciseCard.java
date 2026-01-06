package com.jameselner.health_hub.ui.component;

import com.jameselner.health_hub.model.entity.ExerciseEntry;
import com.jameselner.health_hub.model.enums.ActivityType;
import com.jameselner.health_hub.service.ExerciseEntryService;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.select.Select;
import com.vaadin.flow.component.textfield.IntegerField;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ExerciseCard extends VerticalLayout {

    private final ExerciseEntryService service;
    private final VerticalLayout entriesLayout;
    private final List<ExerciseEntryRow> entryRows = new ArrayList<>();
    private LocalDate currentDate;

    public ExerciseCard(ExerciseEntryService service) {
        this.service = service;

        addClassName("card");
        getStyle()
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("border-radius", "var(--lumo-border-radius-m)")
                .set("padding", "var(--lumo-space-m)");

        H3 title = new H3("Exercise");
        title.getStyle().set("margin-top", "0");

        entriesLayout = new VerticalLayout();
        entriesLayout.setPadding(false);
        entriesLayout.setSpacing(true);

        Button addButton = new Button("Add Activity", VaadinIcon.PLUS.create());
        addButton.addThemeVariants(ButtonVariant.LUMO_SMALL);
        addButton.addClickListener(e -> addNewEntry());

        add(title, entriesLayout, addButton);
    }

    public void setDate(LocalDate date) {
        this.currentDate = date;
        loadEntries();
    }

    private void loadEntries() {
        entriesLayout.removeAll();
        entryRows.clear();

        List<ExerciseEntry> entries = service.findByDate(currentDate);
        for (ExerciseEntry entry : entries) {
            addEntryRow(entry);
        }
    }

    private void addNewEntry() {
        ExerciseEntry entry = new ExerciseEntry();
        entry.setEntryDate(currentDate);
        entry.setActivityType(ActivityType.OTHER);
        entry.setStretching(false);
        entry = service.save(entry);
        addEntryRow(entry);
    }

    private void addEntryRow(ExerciseEntry entry) {
        ExerciseEntryRow row = new ExerciseEntryRow(entry);
        entryRows.add(row);
        entriesLayout.add(row);
    }

    private void removeEntry(ExerciseEntryRow row) {
        service.delete(row.entry);
        entryRows.remove(row);
        entriesLayout.remove(row);
    }

    private class ExerciseEntryRow extends HorizontalLayout {
        private final ExerciseEntry entry;

        ExerciseEntryRow(ExerciseEntry entry) {
            this.entry = entry;
            setAlignItems(Alignment.BASELINE);
            setWidthFull();

            Select<ActivityType> activitySelect = new Select<>();
            activitySelect.setItems(ActivityType.values());
            activitySelect.setItemLabelGenerator(ExerciseCard.this::formatActivityLabel);
            activitySelect.setValue(entry.getActivityType());
            activitySelect.setWidth("120px");
            activitySelect.addValueChangeListener(e -> {
                if (e.isFromClient()) {
                    entry.setActivityType(e.getValue());
                    service.save(entry);
                }
            });

            IntegerField durationField = new IntegerField();
            durationField.setPlaceholder("mins");
            durationField.setWidth("80px");
            durationField.setMin(0);
            durationField.setValue(entry.getDurationMinutes());
            durationField.addValueChangeListener(e -> {
                if (e.isFromClient()) {
                    entry.setDurationMinutes(e.getValue());
                    service.save(entry);
                }
            });

            IntegerField stepsField = new IntegerField();
            stepsField.setPlaceholder("steps");
            stepsField.setWidth("90px");
            stepsField.setMin(0);
            stepsField.setValue(entry.getSteps());
            stepsField.addValueChangeListener(e -> {
                if (e.isFromClient()) {
                    entry.setSteps(e.getValue());
                    service.save(entry);
                }
            });

            Checkbox stretchingCheckbox = new Checkbox("Stretch");
            stretchingCheckbox.setValue(entry.isStretching());
            stretchingCheckbox.addValueChangeListener(e -> {
                if (e.isFromClient()) {
                    entry.setStretching(e.getValue());
                    service.save(entry);
                }
            });

            Button deleteButton = new Button(VaadinIcon.TRASH.create());
            deleteButton.addThemeVariants(ButtonVariant.LUMO_SMALL, ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_TERTIARY);
            deleteButton.addClickListener(e -> removeEntry(this));

            add(activitySelect, durationField, stepsField, stretchingCheckbox, deleteButton);
        }
    }

    private String formatActivityLabel(ActivityType type) {
        return switch (type) {
            case FOOTBALL -> "Football";
            case RUN -> "Run";
            case SWIM -> "Swim";
            case GYM -> "Gym";
            case WALK -> "Walk";
            case CYCLING -> "Cycling";
            case YOGA -> "Yoga";
            case OTHER -> "Other";
        };
    }
}
