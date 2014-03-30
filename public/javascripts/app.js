var nav = $('#nav-sticky'),
    nav_sticky = nav.offset().top; //get the Y-position of section
var container = $('#gridArticles');

$(window).on({
    scroll:function(){ // fires when user scrolls
        if($(window).width() > 641){
            var current_position = window.pageYOffset; // get the current window Y-Position
            if( current_position > nav_sticky ) {
                nav.addClass('sticky');
                container.css('margin-top',137); // add class to make the nav sticky using css
            } else {
                nav.removeClass('sticky');
                container.css('margin-top',0); // remove sticky css class
            }
        }
    }
});


$('.item').hover(function () {
    $(this).find('.hidden').css('opacity', 1);
    $(this).find('h2').addClass('titleHover')
}, function(){
    $(this).find('.hidden').css('opacity', 0);
    $(this).find('h2').removeClass('titleHover')
});


$('#mainInput').keypress(function (event) {
    if (event.keyCode == 13) {
        $('#tagSelection').append('<span>' + $(this).val() + '<a class="tag" id="' + $(this).val() + '">x</a></span>');
        $(this).val('');
    }
});

$(document).on('click', '.tag', function () {
    var id = $(this).attr('id');
    $("#" + id).parent().remove();
});


container.packery({
    itemSelector: '.item',
    gutter: 20,
    rowHeight: 10
});
var pckry = container.data('packery');