package com.jameselner.health_hub.ui.view;

import com.jameselner.health_hub.model.entity.SexEntry;
import com.jameselner.health_hub.model.enums.SexType;
import com.jameselner.health_hub.service.SexEntryService;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.time.Year;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Route("sex")
@PageTitle("Sex History | Health Hub")
public class SexView extends VerticalLayout {

    private final SexEntryService service;
    private final VerticalLayout calendarContainer;
    private final Span yearLabel;
    private int currentYear;

    public SexView(SexEntryService service) {
        this.service = service;
        this.currentYear = Year.now().getValue();

        setSizeFull();
        setPadding(true);
        setSpacing(true);
        getStyle().set("overflow", "auto");

        H2 title = new H2("Sex History");

        // Year navigation
        Button prevYear = new Button(VaadinIcon.ANGLE_LEFT.create());
        prevYear.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        prevYear.addClickListener(e -> {
            currentYear--;
            updateYearLabel();
            refreshCalendar();
        });

        yearLabel = new Span(String.valueOf(currentYear));
        yearLabel.getStyle()
                .set("font-size", "var(--lumo-font-size-xl)")
                .set("font-weight", "600")
                .set("min-width", "80px")
                .set("text-align", "center");

        Button nextYear = new Button(VaadinIcon.ANGLE_RIGHT.create());
        nextYear.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        nextYear.addClickListener(e -> {
            currentYear++;
            updateYearLabel();
            refreshCalendar();
        });

        HorizontalLayout yearNav = new HorizontalLayout(prevYear, yearLabel, nextYear);
        yearNav.setAlignItems(FlexComponent.Alignment.CENTER);

        // Legend
        HorizontalLayout legend = createLegend();

        calendarContainer = new VerticalLayout();
        calendarContainer.setPadding(false);
        calendarContainer.setSpacing(true);
        calendarContainer.setWidthFull();

        add(title, yearNav, legend, calendarContainer);

        refreshCalendar();
    }

    private HorizontalLayout createLegend() {
        HorizontalLayout legend = new HorizontalLayout();
        legend.setSpacing(true);
        legend.setAlignItems(FlexComponent.Alignment.CENTER);

        legend.add(createLegendItem("None", "#9e9e9e"));
        legend.add(createLegendItem("Self", "#2196f3"));
        legend.add(createLegendItem("Good", "#4caf50"));
        legend.add(createLegendItem("Bad", "#f44336"));

        return legend;
    }

    private HorizontalLayout createLegendItem(String label, String color) {
        Div colorBox = new Div();
        colorBox.getStyle()
                .set("width", "16px")
                .set("height", "16px")
                .set("background-color", color)
                .set("border-radius", "2px");

        Span text = new Span(label);
        text.getStyle().set("font-size", "var(--lumo-font-size-s)");

        HorizontalLayout item = new HorizontalLayout(colorBox, text);
        item.setAlignItems(FlexComponent.Alignment.CENTER);
        item.setSpacing(true);
        return item;
    }

    private void refreshCalendar() {
        calendarContainer.removeAll();

        // Load all sex entries for the year
        LocalDate yearStart = LocalDate.of(currentYear, 1, 1);
        LocalDate yearEnd = LocalDate.of(currentYear, 12, 31);
        List<SexEntry> entries = service.findByDateRange(yearStart, yearEnd);

        Map<LocalDate, SexType> sexMap = entries.stream()
                .collect(Collectors.toMap(SexEntry::getEntryDate, SexEntry::getType));

        // Create calendar for each month
        for (Month month : Month.values()) {
            calendarContainer.add(createMonthCalendar(month, sexMap));
        }
    }

    private VerticalLayout createMonthCalendar(Month month, Map<LocalDate, SexType> sexMap) {
        VerticalLayout monthLayout = new VerticalLayout();
        monthLayout.setPadding(false);
        monthLayout.setSpacing(false);
        monthLayout.setWidthFull();

        // Month header
        H3 monthTitle = new H3(month.getDisplayName(TextStyle.FULL, Locale.ENGLISH));
        monthTitle.getStyle()
                .set("background-color", "var(--lumo-contrast-10pct)")
                .set("padding", "var(--lumo-space-s) var(--lumo-space-m)")
                .set("margin", "0")
                .set("border-radius", "var(--lumo-border-radius-m)")
                .set("width", "fit-content");

        monthLayout.add(monthTitle);

        // Day headers
        HorizontalLayout headerRow = new HorizontalLayout();
        headerRow.setSpacing(false);
        headerRow.setPadding(false);
        headerRow.getStyle().set("background-color", "var(--lumo-contrast-20pct)");

        // Empty cell for week label
        Div emptyCell = createCell("");
        emptyCell.getStyle().set("background-color", "transparent");
        headerRow.add(emptyCell);

        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        for (String day : days) {
            Div dayHeader = createCell(day);
            dayHeader.getStyle()
                    .set("font-weight", "600")
                    .set("background-color", "var(--lumo-contrast-20pct)");
            headerRow.add(dayHeader);
        }
        monthLayout.add(headerRow);

        // Calculate weeks for this month
        YearMonth yearMonth = YearMonth.of(currentYear, month);
        LocalDate firstOfMonth = yearMonth.atDay(1);
        LocalDate lastOfMonth = yearMonth.atEndOfMonth();

        // Find the Monday of the week containing the first of the month
        LocalDate weekStart = firstOfMonth.with(DayOfWeek.MONDAY);
        if (weekStart.isAfter(firstOfMonth)) {
            weekStart = weekStart.minusWeeks(1);
        }

        int weekNum = 1;
        while (weekStart.isBefore(lastOfMonth) || weekStart.equals(lastOfMonth) ||
               weekStart.plusDays(6).getMonth() == month) {

            if (weekNum > 6) break; // Max 6 weeks in a month view

            HorizontalLayout weekRow = new HorizontalLayout();
            weekRow.setSpacing(false);
            weekRow.setPadding(false);

            // Week label
            Div weekLabel = createCell("Week " + weekNum);
            weekLabel.getStyle()
                    .set("background-color", "transparent")
                    .set("color", "var(--lumo-secondary-text-color)");
            weekRow.add(weekLabel);

            // Days of the week
            for (int i = 0; i < 7; i++) {
                LocalDate date = weekStart.plusDays(i);
                Div cell = createCell("");

                if (date.getMonth() == month) {
                    SexType type = sexMap.get(date);
                    if (type != null) {
                        Div sexBox = new Div();
                        sexBox.getStyle()
                                .set("width", "20px")
                                .set("height", "20px")
                                .set("border-radius", "3px")
                                .set("background-color", getSexTypeColor(type));
                        cell.add(sexBox);
                        cell.getStyle().set("display", "flex")
                                .set("justify-content", "center")
                                .set("align-items", "center");
                    }
                }

                weekRow.add(cell);
            }

            monthLayout.add(weekRow);
            weekStart = weekStart.plusWeeks(1);
            weekNum++;
        }

        return monthLayout;
    }

    private Div createCell(String text) {
        Div cell = new Div();
        cell.setText(text);
        cell.getStyle()
                .set("width", "80px")
                .set("height", "36px")
                .set("display", "flex")
                .set("align-items", "center")
                .set("justify-content", "center")
                .set("border", "1px solid var(--lumo-contrast-10pct)")
                .set("font-size", "var(--lumo-font-size-s)");
        return cell;
    }

    private void updateYearLabel() {
        yearLabel.setText(String.valueOf(currentYear));
    }

    private String getSexTypeColor(SexType type) {
        return switch (type) {
            case NONE -> "#9e9e9e";     // Gray
            case SELF -> "#2196f3";     // Blue
            case GOOD_SEX -> "#4caf50"; // Green
            case BAD_SEX -> "#f44336";  // Red
        };
    }
}
