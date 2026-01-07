package com.jameselner.health_hub.ui.view;

import com.jameselner.health_hub.model.entity.ExerciseEntry;
import com.jameselner.health_hub.model.enums.ActivityType;
import com.jameselner.health_hub.service.ExerciseEntryService;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H2;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.FlexLayout;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Route("exercise")
@PageTitle("Exercise History | Health Hub")
public class ExerciseView extends VerticalLayout {

    private final ExerciseEntryService service;
    private final VerticalLayout calendarContainer;
    private final Span yearLabel;
    private final Span statsLabel;
    private int currentYear;

    public ExerciseView(ExerciseEntryService service) {
        this.service = service;
        this.currentYear = Year.now().getValue();

        setSizeFull();
        setPadding(true);
        setSpacing(true);
        getStyle().set("overflow", "auto");

        H2 title = new H2("Exercise History");

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

        // Stats summary
        statsLabel = new Span();
        statsLabel.getStyle()
                .set("font-size", "var(--lumo-font-size-s)")
                .set("color", "var(--lumo-secondary-text-color)");

        // Legend
        FlexLayout legend = createLegend();

        calendarContainer = new VerticalLayout();
        calendarContainer.setPadding(false);
        calendarContainer.setSpacing(true);
        calendarContainer.setWidthFull();

        add(title, yearNav, statsLabel, legend, calendarContainer);

        refreshCalendar();
    }

    private FlexLayout createLegend() {
        FlexLayout legend = new FlexLayout();
        legend.setFlexWrap(FlexLayout.FlexWrap.WRAP);
        legend.getStyle().set("gap", "var(--lumo-space-m)");

        for (ActivityType type : ActivityType.values()) {
            legend.add(createLegendItem(formatActivityType(type), getActivityColor(type)));
        }

        // Stretching indicator
        Div stretchBox = new Div();
        stretchBox.getStyle()
                .set("width", "16px")
                .set("height", "16px")
                .set("background-color", "var(--lumo-contrast-30pct)")
                .set("border-radius", "2px")
                .set("border", "2px solid #e91e63");

        Span stretchText = new Span("+ Stretching");
        stretchText.getStyle().set("font-size", "var(--lumo-font-size-s)");

        HorizontalLayout stretchItem = new HorizontalLayout(stretchBox, stretchText);
        stretchItem.setAlignItems(FlexComponent.Alignment.CENTER);
        stretchItem.setSpacing(true);
        legend.add(stretchItem);

        return legend;
    }

    private HorizontalLayout createLegendItem(String label, String color) {
        Div colorBox = new Div();
        colorBox.getStyle()
                .set("width", "16px")
                .set("height", "16px")
                .set("background-color", color)
                .set("border-radius", "50%");

        Span text = new Span(label);
        text.getStyle().set("font-size", "var(--lumo-font-size-s)");

        HorizontalLayout item = new HorizontalLayout(colorBox, text);
        item.setAlignItems(FlexComponent.Alignment.CENTER);
        item.setSpacing(true);
        return item;
    }

    private void refreshCalendar() {
        calendarContainer.removeAll();

        // Load all exercise entries for the year
        LocalDate yearStart = LocalDate.of(currentYear, 1, 1);
        LocalDate yearEnd = LocalDate.of(currentYear, 12, 31);
        List<ExerciseEntry> entries = service.findByDateRange(yearStart, yearEnd);

        // Group entries by date
        Map<LocalDate, List<ExerciseEntry>> exerciseMap = new HashMap<>();
        int totalWorkouts = 0;
        int totalMinutes = 0;
        int totalSteps = 0;
        int stretchDays = 0;

        for (ExerciseEntry entry : entries) {
            exerciseMap.computeIfAbsent(entry.getEntryDate(), k -> new ArrayList<>()).add(entry);
            totalWorkouts++;
            if (entry.getDurationMinutes() != null) {
                totalMinutes += entry.getDurationMinutes();
            }
            if (entry.getSteps() != null) {
                totalSteps += entry.getSteps();
            }
        }

        // Count stretch days
        for (List<ExerciseEntry> dayEntries : exerciseMap.values()) {
            if (dayEntries.stream().anyMatch(ExerciseEntry::isStretching)) {
                stretchDays++;
            }
        }

        // Update stats
        statsLabel.setText(String.format("%d workouts • %d active days • %,d total minutes • %,d total steps • %d stretch days",
                totalWorkouts, exerciseMap.size(), totalMinutes, totalSteps, stretchDays));

        // Create calendar for each month
        for (Month month : Month.values()) {
            calendarContainer.add(createMonthCalendar(month, exerciseMap));
        }
    }

    private VerticalLayout createMonthCalendar(Month month, Map<LocalDate, List<ExerciseEntry>> exerciseMap) {
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
        Div emptyCell = createCell();
        emptyCell.getStyle().set("background-color", "transparent");
        headerRow.add(emptyCell);

        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        for (String day : days) {
            Div dayHeader = createCell();
            dayHeader.setText(day);
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

            if (weekNum > 6) break;

            HorizontalLayout weekRow = new HorizontalLayout();
            weekRow.setSpacing(false);
            weekRow.setPadding(false);

            // Week label
            Div weekLabel = createCell();
            weekLabel.setText("Week " + weekNum);
            weekLabel.getStyle()
                    .set("background-color", "transparent")
                    .set("color", "var(--lumo-secondary-text-color)");
            weekRow.add(weekLabel);

            // Days of the week
            for (int i = 0; i < 7; i++) {
                LocalDate date = weekStart.plusDays(i);
                Div cell = createCell();

                if (date.getMonth() == month) {
                    List<ExerciseEntry> dayEntries = exerciseMap.get(date);
                    if (dayEntries != null && !dayEntries.isEmpty()) {
                        cell.add(createActivityIndicators(dayEntries));
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

    private Div createActivityIndicators(List<ExerciseEntry> entries) {
        Div container = new Div();
        container.getStyle()
                .set("display", "flex")
                .set("flex-wrap", "wrap")
                .set("gap", "2px")
                .set("justify-content", "center")
                .set("align-items", "center")
                .set("max-width", "70px");

        boolean hasStretching = entries.stream().anyMatch(ExerciseEntry::isStretching);

        for (ExerciseEntry entry : entries) {
            Div dot = new Div();
            dot.getStyle()
                    .set("width", "12px")
                    .set("height", "12px")
                    .set("border-radius", "50%")
                    .set("background-color", getActivityColor(entry.getActivityType()));

            // Add pink border if this entry had stretching
            if (entry.isStretching()) {
                dot.getStyle().set("border", "2px solid #e91e63");
            }

            container.add(dot);
        }

        // If day had stretching, add border to container
        if (hasStretching) {
            container.getStyle()
                    .set("padding", "2px")
                    .set("border-radius", "4px")
                    .set("background-color", "rgba(233, 30, 99, 0.1)");
        }

        return container;
    }

    private Div createCell() {
        Div cell = new Div();
        cell.getStyle()
                .set("width", "80px")
                .set("min-height", "40px")
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

    private String getActivityColor(ActivityType type) {
        return switch (type) {
            case FOOTBALL -> "#4caf50";  // Green
            case RUN -> "#ff9800";       // Orange
            case SWIM -> "#2196f3";      // Blue
            case GYM -> "#9c27b0";       // Purple
            case WALK -> "#8bc34a";      // Light Green
            case CYCLING -> "#00bcd4";   // Cyan
            case YOGA -> "#e91e63";      // Pink
            case OTHER -> "#9e9e9e";     // Gray
        };
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
}
