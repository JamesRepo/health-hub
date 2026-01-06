package com.jameselner.health_hub.ui.view;

import com.jameselner.health_hub.model.entity.SexEntry;
import com.jameselner.health_hub.model.enums.SexType;
import com.jameselner.health_hub.service.SexEntryService;
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

@Route("sex")
@PageTitle("Sex History | Health Hub")
public class SexView extends VerticalLayout {

    private final SexEntryService service;
    private final Grid<SexEntry> grid;
    private final DatePicker startDate;
    private final DatePicker endDate;

    public SexView(SexEntryService service) {
        this.service = service;

        setSizeFull();
        setPadding(true);
        setSpacing(true);

        H2 title = new H2("Sex History");

        startDate = new DatePicker("From");
        startDate.setValue(LocalDate.now().minusMonths(1));

        endDate = new DatePicker("To");
        endDate.setValue(LocalDate.now());

        Button filterButton = new Button("Filter", VaadinIcon.FILTER.create());
        filterButton.addClickListener(e -> refreshGrid());

        HorizontalLayout filterLayout = new HorizontalLayout(startDate, endDate, filterButton);
        filterLayout.setAlignItems(Alignment.BASELINE);

        grid = new Grid<>(SexEntry.class, false);
        grid.addColumn(entry -> entry.getEntryDate().format(DateTimeFormatter.ofPattern("MMM d, yyyy")))
                .setHeader("Date")
                .setSortable(true);
        grid.addColumn(entry -> formatType(entry.getType()))
                .setHeader("Type")
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

    private String formatType(SexType type) {
        return switch (type) {
            case NONE -> "None";
            case SELF -> "Self";
            case GOOD_SEX -> "Good";
            case BAD_SEX -> "Bad";
        };
    }

    private Button createDeleteButton(SexEntry entry) {
        Button button = new Button(VaadinIcon.TRASH.create());
        button.addThemeVariants(ButtonVariant.LUMO_ERROR, ButtonVariant.LUMO_TERTIARY, ButtonVariant.LUMO_SMALL);
        button.addClickListener(e -> {
            service.delete(entry);
            refreshGrid();
        });
        return button;
    }
}
