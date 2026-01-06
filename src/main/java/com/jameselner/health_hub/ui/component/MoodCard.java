package com.jameselner.health_hub.ui.component;

import com.jameselner.health_hub.model.entity.MoodEntry;
import com.jameselner.health_hub.model.enums.Mood;
import com.jameselner.health_hub.service.MoodEntryService;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.radiobutton.RadioButtonGroup;

import java.time.LocalDate;

public class MoodCard extends VerticalLayout {

    private final MoodEntryService service;
    private final RadioButtonGroup<Mood> moodGroup;
    private LocalDate currentDate;
    private MoodEntry currentEntry;

    public MoodCard(MoodEntryService service) {
        this.service = service;

        addClassName("card");
        getStyle()
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("border-radius", "var(--lumo-border-radius-m)")
                .set("padding", "var(--lumo-space-m)");

        H3 title = new H3("Mood");
        title.getStyle().set("margin-top", "0");

        moodGroup = new RadioButtonGroup<>();
        moodGroup.setItems(Mood.values());
        moodGroup.setItemLabelGenerator(this::formatMoodLabel);
        moodGroup.addValueChangeListener(e -> {
            if (e.isFromClient()) {
                save(e.getValue());
            }
        });

        add(title, moodGroup);
    }

    public void setDate(LocalDate date) {
        this.currentDate = date;
        loadEntry();
    }

    private void loadEntry() {
        currentEntry = service.findByDate(currentDate).orElse(null);
        if (currentEntry != null) {
            moodGroup.setValue(currentEntry.getMood());
        } else {
            moodGroup.clear();
        }
    }

    private void save(Mood mood) {
        if (mood == null) return;

        if (currentEntry == null) {
            currentEntry = new MoodEntry();
            currentEntry.setEntryDate(currentDate);
        }
        currentEntry.setMood(mood);
        currentEntry = service.save(currentEntry);
    }

    private String formatMoodLabel(Mood mood) {
        return switch (mood) {
            case GOOD -> "Good";
            case NEUTRAL -> "Neutral";
            case BAD -> "Bad";
        };
    }
}
