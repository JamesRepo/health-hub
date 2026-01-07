package com.jameselner.health_hub.ui.component;

import com.jameselner.health_hub.model.entity.ExerciseDailySummary;
import com.jameselner.health_hub.model.entity.ExerciseEntry;
import com.jameselner.health_hub.model.enums.ActivityType;
import com.jameselner.health_hub.service.ExerciseDailySummaryService;
import com.jameselner.health_hub.service.ExerciseEntryService;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.Hr;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.select.Select;
import com.vaadin.flow.component.textfield.IntegerField;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ExerciseCard extends VerticalLayout {

    private final ExerciseEntryService entryService;
    private final ExerciseDailySummaryService summaryService;
    private final VerticalLayout entriesLayout;
    private final IntegerField stepsField;
    private final Checkbox stretchingCheckbox;
    private final List<ExerciseEntryRow> entryRows = new ArrayList<>();
    private LocalDate currentDate;
    private ExerciseDailySummary currentSummary;

    public ExerciseCard(ExerciseEntryService entryService, ExerciseDailySummaryService summaryService) {
        this.entryService = entryService;
        this.summaryService = summaryService;

        addClassName("card");
        getStyle()
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("border-radius", "var(--lumo-border-radius-m)")
                .set("padding", "var(--lumo-space-m)");

        H3 title = new H3("Exercise");
        title.getStyle().set("margin-top", "0");

        // Daily summary section
        Span dailyLabel = new Span("Daily Summary");
        dailyLabel.getStyle()
                .set("font-size", "var(--lumo-font-size-s)")
                .set("color", "var(--lumo-secondary-text-color)");

        stepsField = new IntegerField();
        stepsField.setLabel("Steps");
        stepsField.setPlaceholder("steps");
        stepsField.setWidth("120px");
        stepsField.setMin(0);
        stepsField.addValueChangeListener(e -> {
            if (e.isFromClient()) {
                saveSummary();
            }
        });

        stretchingCheckbox = new Checkbox("Stretching");
        stretchingCheckbox.addValueChangeListener(e -> {
            if (e.isFromClient()) {
                saveSummary();
            }
        });

        HorizontalLayout summaryRow = new HorizontalLayout(stepsField, stretchingCheckbox);
        summaryRow.setAlignItems(Alignment.BASELINE);

        Hr divider = new Hr();

        // Activities section
        Span activitiesLabel = new Span("Activities");
        activitiesLabel.getStyle()
                .set("font-size", "var(--lumo-font-size-s)")
                .set("color", "var(--lumo-secondary-text-color)");

        entriesLayout = new VerticalLayout();
        entriesLayout.setPadding(false);
        entriesLayout.setSpacing(true);

        Button addButton = new Button("Add Activity", VaadinIcon.PLUS.create());
        addButton.addThemeVariants(ButtonVariant.LUMO_SMALL);
        addButton.addClickListener(e -> addNewEntry());

        add(title, dailyLabel, summaryRow, divider, activitiesLabel, entriesLayout, addButton);
    }

    public void setDate(LocalDate date) {
        this.currentDate = date;
        loadData();
    }

    private void loadData() {
        // Load daily summary
        currentSummary = summaryService.findByDate(currentDate).orElse(null);
        if (currentSummary != null) {
            stepsField.setValue(currentSummary.getSteps());
            stretchingCheckbox.setValue(currentSummary.isStretching());
        } else {
            stepsField.clear();
            stretchingCheckbox.setValue(false);
        }

        // Load activities
        entriesLayout.removeAll();
        entryRows.clear();

        List<ExerciseEntry> entries = entryService.findByDate(currentDate);
        for (ExerciseEntry entry : entries) {
            addEntryRow(entry);
        }
    }

    private void saveSummary() {
        if (currentSummary == null) {
            currentSummary = new ExerciseDailySummary();
            currentSummary.setEntryDate(currentDate);
        }
        currentSummary.setSteps(stepsField.getValue());
        currentSummary.setStretching(stretchingCheckbox.getValue());
        currentSummary = summaryService.save(currentSummary);
    }

    private void addNewEntry() {
        ExerciseEntry entry = new ExerciseEntry();
        entry.setEntryDate(currentDate);
        entry.setActivityType(ActivityType.OTHER);
        entry = entryService.save(entry);
        addEntryRow(entry);
    }

    private void addEntryRow(ExerciseEntry entry) {
        ExerciseEntryRow row = new ExerciseEntryRow(entry);
        entryRows.add(row);
        entriesLayout.add(row);
    }

    private void removeEntry(ExerciseEntryRow row) {
        entryService.delete(row.entry);
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
                    entryService.save(entry);
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
                    entryService.save(entry);
                }
            });

            Button deleteButton = new Button(VaadinIcon.TRASH.create());
            deleteButton.addThemeVariants(ButtonVariant.LUMO_SMALL, ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_TERTIARY);
            deleteButton.addClickListener(e -> removeEntry(this));

            add(activitySelect, durationField, deleteButton);
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
