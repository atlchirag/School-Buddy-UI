// Re-adjust DataTables columns when a modal opens.
// Moved out of Views/Home/Dashboard/Dashboard.cshtml.

  $(document).on('shown.bs.modal', '.modal', function () {

    // Boarding modal has its own width adjustment handler.
    if (this.id === 'boardingModal') {
        return;
    }

    const $modal = $(this);

    $modal.find('table').each(function () {
        if (
            $.fn.DataTable &&
            $.fn.DataTable.isDataTable(this)
        ) {
            const table = $(this).DataTable();

            setTimeout(function () {
                table.columns.adjust().draw(false);
            }, 150);
        }
    });
});
