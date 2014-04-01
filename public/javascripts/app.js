var container = $('#gridArticles');


$('.item').hover(function () {
    $(this).find('.hidden').css('opacity', 1);
}, function(){
    $(this).find('.hidden').css('opacity', 0);
});


$('#mainInput').keypress(function (event) {
    if (event.keyCode == 13) {
        $('#tagSelection').append('<span>' + $(this).val() + '<a class="tag" id="' + $(this).val() + '">x</a></span>');
        $(this).val('');

        if ($('#check').html() == 'check') {
            history.pushState(null, null, '/');
            $.ajax({
                type: "GET",
                url: '/busca',
                dataType: 'html',
                beforeSend: function () {
                    $('#wrapper').fadeOut();
                    $('body').css('background-color', 'white');
                }
            }).done(function (data) {
                $('#wrapper').fadeIn().html(data);
            });

        }
    }

});

$(document).on('click', '.tag', function () {
    var id = $(this).attr('id');
    $("#" + id).parent().remove();
});


// Opening Overlay

$('a').click(function () {
    if ($(this).data("link") == "ajax") {
        console.log("data link correto");
        var ajaxUrl = $(this).attr('href');
        ajaxPage(ajaxUrl);
        history.pushState(null, null, ajaxUrl);
        ga('send', 'pageview', ajaxUrl);
        return false;
    }
});



var ajaxPage = function (url) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'html',
        beforeSend: function () {
            $('body').css('overflow-y', 'hidden');
            $('#darken').css('display', 'block');
            $('.content-wrap').fadeIn();

        }
    }).done(function (data) {

        $('.content').html(data);
        $('#loading').delay(500).waitForImages(function () {
            $('#spinningContent').fadeOut(500);
            $('#loading').animate({ 'opacity': 1 });

        });
    });
}


// Closing Overlay

$(window).on('popstate', function () {
    $('.content-wrap').fadeOut();
    $('body').css('overflow-y', 'auto');
    $('#darken').css('display', 'none');
    ga('send', 'pageview', '/');
});

$(document).on('click', '.exit', function(){
    $('.content-wrap').fadeOut();
    $('body').css('overflow-y', 'auto');
    $('#darken').css('display', 'none');
    window.history.go(-1);
    ga('send', 'pageview', '/');
})



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