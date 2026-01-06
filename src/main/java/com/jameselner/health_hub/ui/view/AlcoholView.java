package com.jameselner.health_hub.ui.view;

import com.jameselner.health_hub.model.entity.AlcoholEntry;
import com.jameselner.health_hub.model.enums.DrinkRange;
import com.jameselner.health_hub.service.AlcoholEntryService;
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

@Route("alcohol")
@PageTitle("Alcohol History | Health Hub")
public class AlcoholView extends VerticalLayout {

    private final AlcoholEntryService service;
    private final Grid<AlcoholEntry> grid;
    private final DatePicker startDate;
    private final DatePicker endDate;

    public AlcoholView(AlcoholEntryService service) {
        this.service = service;

        setSizeFull();
        setPadding(true);
        setSpacing(true);

        H2 title = new H2("Alcohol History");

        startDate = new DatePicker("From");
        startDate.setValue(LocalDate.now().minusMonths(1));

        endDate = new DatePicker("To");
        endDate.setValue(LocalDate.now());

        Button filterButton = new Button("Filter", VaadinIcon.FILTER.create());
        filterButton.addClickListener(e -> refreshGrid());

        HorizontalLayout filterLayout = new HorizontalLayout(startDate, endDate, filterButton);
        filterLayout.setAlignItems(Alignment.BASELINE);

        grid = new Grid<>(AlcoholEntry.class, false);
        grid.addColumn(entry -> entry.getEntryDate().format(DateTimeFormatter.ofPattern("MMM d, yyyy")))
                .setHeader("Date")
                .setSortable(true);
        grid.addColumn(entry -> formatDrinkRange(entry.getDrinkRange()))
                .setHeader("Drinks")
                .setSortable(true);
        grid.addColumn(entry -> entry.isExtras() ? "Yes" : "No")
                .setHeader("Extras")
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

    private String formatDrinkRange(DrinkRange range) {
        return switch (range) {
            case NONE -> "0 drinks";
            case ONE_TO_THREE -> "1-3 drinks";
            case FOUR_TO_SIX -> "4-6 drinks";
            case SEVEN_PLUS -> "7+ drinks";
        };
    }

    private Button createDeleteButton(AlcoholEntry entry) {
        Button button = new Button(VaadinIcon.TRASH.create());
        button.addThemeVariants(ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_TERTIARY, ButtonVariant.LUMO_SMALL);
        button.addClickListener(e -> {
            service.delete(entry);
            refreshGrid();
        });
        return button;
    }
}
