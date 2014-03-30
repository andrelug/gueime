var container = $('#gridArticles');

var string_to_slug = function (str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();
		  
    // remove accents, swap ñ for n, etc
    var from = "àãáäâèéëêìíïîòóõöôùúüûñç·/_,:;";
    var to   = "aaaaaeeeeiiiiooooouuuunc------";
    for (var i=0, l=from.length ; i<l ; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

    return str;
}


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

$(document).on('click', '.item', function () {
    var id = string_to_slug($(this).find('.ref').html());
    history.pushState({}, "page 2", "/" + id);
    $('.content-wrap').slideDown();
    $('body').css('overflow-y', 'hidden')
});

$('.exit').on('click', function () {
    $('.content-wrap').slideUp();
    $('body').css('overflow-y', 'auto')
});


container.waitForImages(function () {
    $("#spinning").hide();
    $('body').css('overflow-y', 'auto');
    container.animate({ 'opacity': 1 });
    

    container.packery({
        itemSelector: '.item',
        gutter: 20,
        rowHeight: 10
    });
    var pckry = container.data('packery');

    var nav = $('#nav-sticky');
    nav_sticky = nav.offset().top; //get the Y-position of section

    $(window).on({
        scroll: function () { // fires when user scrolls
            if ($(window).width() > 641) {
                var current_position = window.pageYOffset; // get the current window Y-Position
                if (current_position > nav_sticky) {
                    nav.addClass('sticky');
                    container.css('margin-top', 137); // add class to make the nav sticky using css
                } else {
                    nav.removeClass('sticky');
                    container.css('margin-top', 0); // remove sticky css class
                }
            }
        }
    });



});