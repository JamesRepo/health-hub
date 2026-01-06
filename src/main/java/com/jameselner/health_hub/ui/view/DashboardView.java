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
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.datepicker.DatePicker;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Route("")
@PageTitle("Dashboard | Health Hub")
public class DashboardView extends VerticalLayout {

    private final MoodCard moodCard;
    private final AlcoholCard alcoholCard;
    private final ExerciseCard exerciseCard;
    private final SleepCard sleepCard;
    private final SexCard sexCard;
    private final DatePicker datePicker;
    private final Span dateLabel;

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

        // Date navigation
        Button prevDay = new Button(VaadinIcon.ANGLE_LEFT.create());
        prevDay.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        prevDay.addClickListener(e -> changeDate(-1));

        Button nextDay = new Button(VaadinIcon.ANGLE_RIGHT.create());
        nextDay.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        nextDay.addClickListener(e -> changeDate(1));

        Button today = new Button("Today");
        today.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        today.addClickListener(e -> setDate(LocalDate.now()));

        dateLabel = new Span();
        dateLabel.getStyle()
                .set("font-size", "var(--lumo-font-size-xl)")
                .set("font-weight", "500");

        datePicker = new DatePicker();
        datePicker.setValue(LocalDate.now());
        datePicker.addValueChangeListener(e -> {
            if (e.isFromClient()) {
                updateDateLabel();
                updateCards(e.getValue());
            }
        });

        HorizontalLayout dateNav = new HorizontalLayout(prevDay, dateLabel, nextDay, today, datePicker);
        dateNav.setAlignItems(FlexComponent.Alignment.CENTER);
        dateNav.setSpacing(true);

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

        add(title, dateNav, topRow, bottomRow);

        updateDateLabel();
        updateCards(LocalDate.now());
    }

    private void changeDate(int days) {
        setDate(datePicker.getValue().plusDays(days));
    }

    private void setDate(LocalDate date) {
        datePicker.setValue(date);
        updateDateLabel();
        updateCards(date);
    }

    private void updateDateLabel() {
        LocalDate date = datePicker.getValue();
        LocalDate now = LocalDate.now();

        String label;
        if (date.equals(now)) {
            label = "Today";
        } else if (date.equals(now.minusDays(1))) {
            label = "Yesterday";
        } else if (date.equals(now.plusDays(1))) {
            label = "Tomorrow";
        } else {
            label = date.format(DateTimeFormatter.ofPattern("EEE, MMM d"));
        }
        dateLabel.setText(label);
    }

    private void updateCards(LocalDate date) {
        moodCard.setDate(date);
        alcoholCard.setDate(date);
        exerciseCard.setDate(date);
        sleepCard.setDate(date);
        sexCard.setDate(date);
    }
}
