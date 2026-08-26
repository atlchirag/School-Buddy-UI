(function () {
    "use strict";

    if (window.schoolBuddyThemeManagerInitialized) {
        return;
    }

    window.schoolBuddyThemeManagerInitialized = true;

    const STORAGE_KEY = "schoolBuddyTheme";
    const root = document.documentElement;
    const systemMedia = window.matchMedia("(prefers-color-scheme: dark)");

    function getSavedTheme() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return value === "light" || value === "dark" ? value : null;
        } catch (error) {
            return null;
        }
    }

    function getSystemTheme() {
        return systemMedia.matches ? "dark" : "light";
    }

    function getVisibleTheme() {
        const current = root.getAttribute("data-bs-theme");
        return current === "light" || current === "dark"
            ? current
            : getSavedTheme() || getSystemTheme();
    }

    function updateButton(theme) {
        const button = document.getElementById("themeToggleBtn");
        const icon = document.getElementById("themeToggleIcon");

        if (!button || !icon) {
            return;
        }

        const isDark = theme === "dark";
        const targetTheme = isDark ? "light" : "dark";

        icon.className = isDark
            ? "bi bi-sun-fill"
            : "bi bi-moon-stars-fill";
        button.setAttribute("aria-label", "Switch to " + targetTheme + " theme");
        button.setAttribute("title", "Switch to " + targetTheme + " theme");
    }

    function dispatchThemeChange(theme, source) {
        window.dispatchEvent(new CustomEvent("schoolbuddy:themechange", {
            detail: { theme: theme, source: source }
        }));
    }

    function applyTheme(theme, options) {
        const settings = Object.assign({
            persist: false,
            source: "manual",
            dispatch: true
        }, options || {});

        if (theme !== "light" && theme !== "dark") {
            return;
        }

        root.setAttribute("data-bs-theme", theme);
        root.setAttribute("data-theme-source", settings.source);

        if (settings.persist) {
            try {
                localStorage.setItem(STORAGE_KEY, theme);
            } catch (error) {
                console.warn("Theme preference could not be saved.", error);
            }
        }

        updateButton(theme);

        if (settings.dispatch) {
            dispatchThemeChange(theme, settings.source);
        }
    }

    function toggleTheme() {
        const currentTheme = getVisibleTheme();
        const nextTheme = currentTheme === "dark" ? "light" : "dark";

        applyTheme(nextTheme, {
            persist: true,
            source: "manual",
            dispatch: true
        });
    }

    function syncTheme() {
        const savedTheme = getSavedTheme();

        applyTheme(savedTheme || getSystemTheme(), {
            persist: false,
            source: savedTheme ? "manual" : "system",
            dispatch: false
        });
    }

    function bindButton() {
        const button = document.getElementById("themeToggleBtn");

        if (!button || button.dataset.themeBound === "true") {
            return;
        }

        button.dataset.themeBound = "true";
        button.addEventListener("click", toggleTheme);
    }

    function updateChartVisuals(theme) {
        const textColor = theme === "dark" ? "#f8fafc" : "#0f172a";
        const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";

        try {
            if (window.Chart && window.Chart.instances) {
                Object.values(window.Chart.instances).forEach(function (chart) {
                    if (!chart || !chart.options) return;

                    const plugins = chart.options.plugins || (chart.options.plugins = {});
                    if (plugins.legend && plugins.legend.labels) plugins.legend.labels.color = textColor;
                    if (plugins.title) plugins.title.color = textColor;

                    Object.values(chart.options.scales || {}).forEach(function (scale) {
                        if (scale.ticks) scale.ticks.color = textColor;
                        if (scale.grid) scale.grid.color = gridColor;
                    });

                    chart.update("none");
                });
            }
        } catch (error) {
            console.warn("Chart.js theme refresh was skipped.", error);
        }

        try {
            if (window.echarts) {
                document.querySelectorAll("[_echarts_instance_]").forEach(function (element) {
                    const chart = window.echarts.getInstanceByDom(element);
                    if (!chart) return;

                    chart.setOption({
                        textStyle: { color: textColor },
                        legend: { textStyle: { color: textColor } },
                        xAxis: { axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridColor } } },
                        yAxis: { axisLabel: { color: textColor }, splitLine: { lineStyle: { color: gridColor } } }
                    }, false);
                });
            }
        } catch (error) {
            console.warn("ECharts theme refresh was skipped.", error);
        }
    }

    function initialize() {
        syncTheme();
        bindButton();
        updateButton(getVisibleTheme());
    }

    systemMedia.addEventListener("change", function () {
        if (!getSavedTheme()) {
            applyTheme(getSystemTheme(), {
                persist: false,
                source: "system",
                dispatch: true
            });
        }
    });

    window.addEventListener("storage", function (event) {
        if (event.key === STORAGE_KEY) {
            syncTheme();
        }
    });

    window.addEventListener("pageshow", initialize);
    window.addEventListener("schoolbuddy:themechange", function (event) {
        updateChartVisuals(event.detail.theme);
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize, { once: true });
    } else {
        initialize();
    }

    window.schoolBuddyThemeManager = {
        getSavedTheme: getSavedTheme,
        getVisibleTheme: getVisibleTheme,
        applyTheme: applyTheme,
        toggleTheme: toggleTheme
    };
})();
