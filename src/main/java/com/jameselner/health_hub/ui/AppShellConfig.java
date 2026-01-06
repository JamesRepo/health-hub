package com.jameselner.health_hub.ui;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.PWA;
import com.vaadin.flow.theme.Theme;
import com.vaadin.flow.theme.lumo.Lumo;

@Theme(variant = Lumo.DARK)
@PWA(name = "Health Hub", shortName = "Health Hub")
public class AppShellConfig implements AppShellConfigurator {
}
