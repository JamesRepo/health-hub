package com.jameselner.health_hub.ui.view;

import com.jameselner.health_hub.model.entity.SleepEntry;
import com.jameselner.health_hub.model.enums.SleepQuality;
import com.jameselner.health_hub.service.SleepEntryService;
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

@Route("sleep")
@PageTitle("Sleep History | Health Hub")
public class SleepView extends VerticalLayout {

    private final SleepEntryService service;
    private final Grid<SleepEntry> grid;
    private final DatePicker startDate;
    private final DatePicker endDate;

    public SleepView(SleepEntryService service) {
        this.service = service;

        setSizeFull();
        setPadding(true);
        setSpacing(true);

        H2 title = new H2("Sleep History");

        startDate = new DatePicker("From");
        startDate.setValue(LocalDate.now().minusMonths(1));

        endDate = new DatePicker("To");
        endDate.setValue(LocalDate.now());

        Button filterButton = new Button("Filter", VaadinIcon.FILTER.create());
        filterButton.addClickListener(e -> refreshGrid());

        HorizontalLayout filterLayout = new HorizontalLayout(startDate, endDate, filterButton);
        filterLayout.setAlignItems(Alignment.BASELINE);

        grid = new Grid<>(SleepEntry.class, false);
        grid.addColumn(entry -> entry.getEntryDate().format(DateTimeFormatter.ofPattern("MMM d, yyyy")))
                .setHeader("Date")
                .setSortable(true);
        grid.addColumn(entry -> formatQuality(entry.getQuality()))
                .setHeader("Quality")
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

    private String formatQuality(SleepQuality quality) {
        return switch (quality) {
            case GOOD -> "Good";
            case MODERATE -> "Moderate";
            case POOR -> "Poor";
        };
    }

    private Button createDeleteButton(SleepEntry entry) {
        Button button = new Button(VaadinIcon.TRASH.create());
        button.addThemeVariants(ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_TERTIARY, ButtonVariant.LUMO_SMALL);
        button.addClickListener(e -> {
            service.delete(entry);
            refreshGrid();
        });
        return button;
    }
}
