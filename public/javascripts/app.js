var container = $('#gridArticles');


$('#mainInput').keypress(function (event) {
    if (event.keyCode == 13) {
        $('#tagSelection').append('<span>' + $(this).val() + '<a class="tag" id="' + $(this).val() + '">x</a></span>');
        $(this).val('');

        // Ajax Busca na página de artigo
        if ($('#check').html() == 'check') {
            history.pushState(null, null, '/');
            $.ajax({
                type: "GET",
                url: '/busca',
                dataType: 'html',
                beforeSend: function () {
                    $('#wrapper').fadeOut();
                    $('body').css('background-color', 'white');
                    $('#searchBack').slideDown();
                }
            }).done(function (data) {
                $('#wrapper').fadeIn().html(data);
                $('header').removeClass('header row');
                $('body').css('background-color', '#ecf0f1');
                $('#check').remove();
            });

        }
    }

});

$(document).on('click', '.tag', function () {
    var id = $(this).attr('id');
    $("#" + id).parent().remove();
});


// Opening Overlay
$(document).on('click', 'a', function () {
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
            $('#loading').animate({ 'opacity': 1 }, function(){

                FB.XFBML.parse();
                var facebookComments = $(".fb-comments");

                facebookComments.attr("data-href", window.location.href);

                if($(window).width() < 760){
                    facebookComments.attr('data-width', 550)
                }
                if($(window).width() < 595){
                    facebookComments.attr('data-width', 380)
                }
            });

            

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

$(document).on('click', '.exit', function () {
    $('.content-wrap').fadeOut();
    $('body').css('overflow-y', 'auto');
    $('#darken').css('display', 'none');
    window.history.go(-1);
    ga('send', 'pageview', '/');
});

// Article comments

var facebookComments = $(".fb-comments");

facebookComments.attr("data-href", window.location.href);

if($(window).width() < 760){
    facebookComments.attr('data-width', 550)
}
if($(window).width() < 595){
    facebookComments.attr('data-width', 380)
}