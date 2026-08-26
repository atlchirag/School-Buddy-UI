(function (window, $) {
    'use strict';

    if (!$ || !$.fn || !$.fn.DataTable) {
        return;
    }

    var scheduled = new WeakMap();

    function tableFromSettings(settings) {
        return settings && settings.nTable ? settings.nTable : null;
    }

    function isVisible(element) {
        return !!element && !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }

    function widthsMatch(headTable, bodyTable) {
        if (!headTable || !bodyTable) {
            return true;
        }

        if (Math.abs(headTable.getBoundingClientRect().width - bodyTable.getBoundingClientRect().width) > 1) {
            return false;
        }

        var headCells = headTable.querySelectorAll('thead th');
        var bodyCells = bodyTable.querySelectorAll('tbody tr:first-child td');

        if (!headCells.length || !bodyCells.length || headCells.length !== bodyCells.length) {
            return true;
        }

        for (var i = 0; i < headCells.length; i++) {
            if (Math.abs(headCells[i].getBoundingClientRect().width - bodyCells[i].getBoundingClientRect().width) > 1) {
                return false;
            }
        }

        return true;
    }

    function adjustTable(settings, force) {
        var table = tableFromSettings(settings);

        if (!table || !document.documentElement.contains(table)) {
            return;
        }

        var wrapper = $(table).closest('.dataTables_wrapper, .dt-container');

        if (!wrapper.length || !isVisible(wrapper[0])) {
            return;
        }

        var headTable = wrapper.find(
            '.dataTables_scrollHeadInner table, .dt-scroll-headInner table'
        )[0];
        var bodyTable = wrapper.find(
            '.dataTables_scrollBody > table, .dt-scroll-body > table'
        )[0];

        if (!force && widthsMatch(headTable, bodyTable)) {
            return;
        }

        try {
            $(table).DataTable().columns.adjust().draw(false);
        } catch (error) {
            // The table may be destroyed while a queued frame is running.
        }
    }

    function scheduleAdjust(settings, force) {
        var table = tableFromSettings(settings);

        if (!table || scheduled.has(table)) {
            return;
        }

        var frame = window.requestAnimationFrame || function (callback) {
            return window.setTimeout(callback, 0);
        };

        scheduled.set(table, frame(function () {
            scheduled.delete(table);
            adjustTable(settings, !!force);
        }));
    }

    function adjustVisibleTables(force) {
        $('.dataTable').each(function () {
            if ($.fn.DataTable.isDataTable(this)) {
                scheduleAdjust($(this).DataTable().settings()[0], force);
            }
        });
    }

    function adjustModalTables(modal) {
        $(modal).find('table.dataTable:visible').each(function () {
            if ($.fn.DataTable.isDataTable(this)) {
                scheduleAdjust($(this).DataTable().settings()[0], true);
            }
        });
    }

    $(document)
        .on('init.dt.globalAlignment xhr.dt.globalAlignment', function (event, settings) {
            scheduleAdjust(settings, event.type === 'init');
        })
        .on('shown.bs.modal.globalAlignment', function (event) {
            adjustModalTables(event.target);
            window.setTimeout(function () {
                adjustModalTables(event.target);
            }, 100);
        })
        .on('shown.bs.tab.globalAlignment shown.bs.collapse.globalAlignment hidden.bs.collapse.globalAlignment', function () {
            window.setTimeout(function () {
                adjustVisibleTables(true);
            }, 0);
        });

    var resizeTimer;
    $(window).on('resize.globalAlignment orientationchange.globalAlignment', function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
            adjustVisibleTables(true);
        }, 150);
    });

    $(function () {
        adjustVisibleTables(true);
    });
}(window, window.jQuery));
