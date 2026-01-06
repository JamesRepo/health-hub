package com.jameselner.health_hub.ui;

import com.jameselner.health_hub.ui.view.AlcoholView;
import com.jameselner.health_hub.ui.view.DashboardView;
import com.jameselner.health_hub.ui.view.ExerciseView;
import com.jameselner.health_hub.ui.view.MoodView;
import com.jameselner.health_hub.ui.view.SexView;
import com.jameselner.health_hub.ui.view.SleepView;
import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.applayout.DrawerToggle;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.orderedlayout.FlexComponent;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.sidenav.SideNav;
import com.vaadin.flow.component.sidenav.SideNavItem;
import com.vaadin.flow.router.Layout;

@Layout
public class MainLayout extends AppLayout {

    public MainLayout() {
        createHeader();
        createDrawer();
    }

    private void createHeader() {
        H1 logo = new H1("Health Hub");
        logo.getStyle()
                .set("font-size", "var(--lumo-font-size-l)")
                .set("margin", "0");

        HorizontalLayout header = new HorizontalLayout(new DrawerToggle(), logo);
        header.setDefaultVerticalComponentAlignment(FlexComponent.Alignment.CENTER);
        header.setWidthFull();
        header.addClassNames("py-0", "px-m");

        addToNavbar(header);
    }

    private void createDrawer() {
        SideNav nav = new SideNav();

        nav.addItem(new SideNavItem("Dashboard", DashboardView.class));
        nav.addItem(new SideNavItem("Mood", MoodView.class));
        nav.addItem(new SideNavItem("Alcohol", AlcoholView.class));
        nav.addItem(new SideNavItem("Exercise", ExerciseView.class));
        nav.addItem(new SideNavItem("Sleep", SleepView.class));
        nav.addItem(new SideNavItem("Sex", SexView.class));

        VerticalLayout drawerLayout = new VerticalLayout(nav);
        drawerLayout.setPadding(true);
        drawerLayout.setSpacing(true);

        addToDrawer(drawerLayout);
    }
}
