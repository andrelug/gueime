var container = $('#gridArticles');


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

$('a').click(function () {
    if ($(this).data("link") == "ajax") {
        console.log("data link correto");
        var ajaxUrl = $(this).attr('href');
        ajaxPage(ajaxUrl);
        history.pushState(null, null, ajaxUrl);
        return false;
    }
});

$(document).on('click', '.exit', function(){
    $('.content-wrap').slideUp();
    $('body').css('overflow-y', 'auto');
    history.pushState({}, "page 2", "/");
})

var ajaxPage = function (url) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'html',
        beforeSend: function () {
            $('.content-wrap').slideDown();
            $('body').css('overflow-y', 'hidden');
        }
    }).done(function (data) {
        $('.content').html(data);
    });
}




// Need to check if this is good for performance
$(document).on('keyup', function (event) {
    if(event.keyCode == 8 || event.keyCode == 27 ){
        $('.content-wrap').slideUp();
        $('body').css('overflow-y', 'auto');
        history.pushState({}, "page 2", "/");
    }
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
                    if ($(window).width() > 1025){
                        $('.gueimeWhite').fadeIn();
                    }
                    
                } else {
                    nav.removeClass('sticky');
                    container.css('margin-top', 0); // remove sticky css class
                     $('.gueimeWhite').fadeOut();
                }
            }
        }
    });



});