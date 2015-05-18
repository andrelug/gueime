var gridster;

$(function () { //DOM Ready

    gridster = $(".gridster ul").gridster({
        widget_margins: [10, 10],
        widget_base_dimensions: [140, 140],
        draggable: {
            handle: '.fa-arrows',
            stop: function () {
                var grid = JSON.stringify(gridster.serialize());
                $.ajax({
                    url: '/grid',
                    type: 'POST',
                    data: { grid: grid }
                })
                console.log(JSON.stringify(gridster.serialize()))
            }
        }
    }).data('gridster');

    // sort serialization
    serialization = Gridster.sort_by_row_and_col_asc(serialization);



    $.each(serialization, function () {
        if(this.size_x == '3'){
            gridster.add_widget(thisWidgets, this.size_x, this.size_y, this.col, this.row);
        } else {
            gridster.add_widget(thisWidgets, this.size_x, this.size_y, this.col, this.row);
        }
        
    });


    $('.toggle').on('click', function () {

        if ($('li').has('span').length >= 1) {
            $('span').remove();
        } else {
            $('.panel').prepend('<span><i class="fa fa-arrows"></i></span><span><i class="fa fa-expand"></i></span>');
        }
    });

    $(document).on('click', '.fa-expand', function () {
        if ($(this).closest('.panel').hasClass('large')) {
            gridster.resize_widget($(this).closest('li'), 2, 3);
            $(this).closest('.panel').removeClass('large');
            var grid = JSON.stringify(gridster.serialize());
            $.ajax({
                url: '/grid',
                type: 'POST',
                data: { grid: grid }
            })
            console.log(JSON.stringify(gridster.serialize()))
        } else {
            gridster.resize_widget($(this).closest('li'), 3, 3);
            $(this).closest('.panel').addClass('large');
            var grid = JSON.stringify(gridster.serialize());
            $.ajax({
                url: '/grid',
                type: 'POST',
                data: { grid: grid }
            })
            console.log(JSON.stringify(gridster.serialize()));
        }

    });







});