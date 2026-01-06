package com.jameselner.health_hub.ui.view;

import com.jameselner.health_hub.model.entity.ExerciseEntry;
import com.jameselner.health_hub.model.enums.ActivityType;
import com.jameselner.health_hub.service.ExerciseEntryService;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.datepicker.DatePicker;
import com.vaadin.flow.component.grid.Grid;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Route("exercise")
@PageTitle("Exercise History | Health Hub")
public class ExerciseView extends VerticalLayout {

    private final ExerciseEntryService service;
    private final Grid<ExerciseEntry> grid;
    private final DatePicker startDate;
    private final DatePicker endDate;

    public ExerciseView(ExerciseEntryService service) {
        this.service = service;

        setSizeFull();
        setPadding(true);
        setSpacing(true);

        H2 title = new H2("Exercise History");

        startDate = new DatePicker("From");
        startDate.setValue(LocalDate.now().minusMonths(1));

        endDate = new DatePicker("To");
        endDate.setValue(LocalDate.now());

        Button filterButton = new Button("Filter", VaadinIcon.FILTER.create());
        filterButton.addClickListener(e -> refreshGrid());

        HorizontalLayout filterLayout = new HorizontalLayout(startDate, endDate, filterButton);
        filterLayout.setAlignItems(Alignment.BASELINE);

        grid = new Grid<>(ExerciseEntry.class, false);
        grid.addColumn(entry -> entry.getEntryDate().format(DateTimeFormatter.ofPattern("MMM d, yyyy")))
                .setHeader("Date")
                .setSortable(true);
        grid.addColumn(entry -> formatActivityType(entry.getActivityType()))
                .setHeader("Activity")
                .setSortable(true);
        grid.addColumn(entry -> entry.getDurationMinutes() != null ? entry.getDurationMinutes() + " min" : "-")
                .setHeader("Duration")
                .setSortable(true);
        grid.addColumn(entry -> entry.getSteps() != null ? entry.getSteps().toString() : "-")
                .setHeader("Steps")
                .setSortable(true);
        grid.addColumn(entry -> entry.isStretching() ? "Yes" : "No")
                .setHeader("Stretching")
                .setSortable(true);
        grid.addComponentColumn(this::createDeleteButton)
                .setHeader("")
                .setWidth("80px")
                .setFlexGrow(0);

        grid.setWidthFull();
        grid.setHeight("400px");

        add(title, filterLayout, grid);
        refreshGrid();
    }

    private void refreshGrid() {
        grid.setItems(service.findByDateRange(startDate.getValue(), endDate.getValue()));
    }

    private String formatActivityType(ActivityType type) {
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

    private Button createDeleteButton(ExerciseEntry entry) {
        Button button = new Button(VaadinIcon.TRASH.create());
        button.addThemeVariants(ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_TERTIARY, ButtonVariant.LUMO_SMALL);
        button.addClickListener(e -> {
            service.delete(entry);
            refreshGrid();
        });
        return button;
    }
}
