package com.jameselner.health_hub.ui.view;

import com.jameselner.health_hub.service.AlcoholEntryService;
import com.jameselner.health_hub.service.ExerciseEntryService;
import com.jameselner.health_hub.service.MoodEntryService;
import com.jameselner.health_hub.service.SexEntryService;
import com.jameselner.health_hub.service.SleepEntryService;
import com.jameselner.health_hub.ui.component.AlcoholCard;
import com.jameselner.health_hub.ui.component.ExerciseCard;
import com.jameselner.health_hub.ui.component.MoodCard;
import com.jameselner.health_hub.ui.component.SexCard;
import com.jameselner.health_hub.ui.component.SleepCard;
import com.vaadin.flow.component.datepicker.DatePicker;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import java.time.LocalDate;

@Route("")
@PageTitle("Dashboard | Health Hub")
public class DashboardView extends VerticalLayout {

    private final MoodCard moodCard;
    private final AlcoholCard alcoholCard;
    private final ExerciseCard exerciseCard;
    private final SleepCard sleepCard;
    private final SexCard sexCard;

    public DashboardView(
            MoodEntryService moodService,
            AlcoholEntryService alcoholService,
            ExerciseEntryService exerciseService,
            SleepEntryService sleepService,
            SexEntryService sexService) {

        setSizeFull();
        setPadding(true);
        setSpacing(true);

        H2 title = new H2("Daily Health Tracker");

        DatePicker datePicker = new DatePicker("Date");
        datePicker.setValue(LocalDate.now());
        datePicker.addValueChangeListener(e -> updateCards(e.getValue()));

        moodCard = new MoodCard(moodService);
        alcoholCard = new AlcoholCard(alcoholService);
        exerciseCard = new ExerciseCard(exerciseService);
        sleepCard = new SleepCard(sleepService);
        sexCard = new SexCard(sexService);

        HorizontalLayout topRow = new HorizontalLayout(moodCard, sleepCard, sexCard);
        topRow.setWidthFull();
        topRow.setSpacing(true);

        HorizontalLayout bottomRow = new HorizontalLayout(alcoholCard, exerciseCard);
        bottomRow.setWidthFull();
        bottomRow.setSpacing(true);

        exerciseCard.setWidth("100%");

        add(title, datePicker, topRow, bottomRow);

        updateCards(LocalDate.now());
    }

    private void updateCards(LocalDate date) {
        moodCard.setDate(date);
        alcoholCard.setDate(date);
        exerciseCard.setDate(date);
        sleepCard.setDate(date);
        sexCard.setDate(date);
    }
}
