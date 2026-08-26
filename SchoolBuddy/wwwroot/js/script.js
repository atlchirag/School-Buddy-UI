// School Transport Management Platform Interactions
document.addEventListener("DOMContentLoaded", function () {
    // Other page-specific JS logic...
});

function setupMapControls() {

    const mapZoomIn = document.getElementById("mapZoomIn");
    const mapZoomOut = document.getElementById("mapZoomOut");
    const mapFit = document.getElementById("mapFit");
    const mapSvg = document.getElementById("mapSvg");

    if (mapZoomIn && mapSvg) {

        mapZoomIn.addEventListener("click", () => {

            const currentScale =
                mapSvg.style.transform || "scale(1)";

            let val =
                parseFloat(
                    currentScale
                        .replace("scale(", "")
                        .replace(")", "")
                ) + 0.15;

            if (val > 2.5) val = 2.5;

            mapSvg.style.transform = `scale(${val})`;
            mapSvg.style.transformOrigin = "center";
            mapSvg.style.transition =
                "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
        });
    }

    if (mapZoomOut && mapSvg) {

        mapZoomOut.addEventListener("click", () => {

            const currentScale =
                mapSvg.style.transform || "scale(1)";

            let val =
                parseFloat(
                    currentScale
                        .replace("scale(", "")
                        .replace(")", "")
                ) - 0.15;

            if (val < 0.6) val = 0.6;

            mapSvg.style.transform = `scale(${val})`;
            mapSvg.style.transformOrigin = "center";
            mapSvg.style.transition =
                "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
        });
    }

    if (mapFit && mapSvg) {

        mapFit.addEventListener("click", (e) => {

            e.preventDefault();

            mapSvg.style.transform = "scale(1)";
            mapSvg.style.transition =
                "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)";
        });
    }
}

function exportReport() {

    alert(
        "Compiling dashboard state...\n" +
        "Exporting fleet telemetry, student logs, " +
        "and route performance matrices to SchoolTransport_Report.xlsx"
    );
}

function openQuickReport(reportName) {

    alert(
        "Generating and preparing download for: " +
        reportName +
        ".csv"
    );
}
