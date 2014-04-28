var container = $('#gridArticles');

var searchStr = [];

tagSearch = function (str) {
    $.ajax({
        type: "GET",
        url: "/tags",
        data: { str: str },
        dataType: 'html',
        beforeSend: function () {
            $("#spinning").show();
            $('body').css('overflow-y', 'hidden');
            container.animate({ 'opacity': 0 }).remove();
            $("html, body").animate({ scrollTop: 0 }, "slow");
            $('footer').hide();
            $('#load').hide();
            if ($('#check').html() == 'check') {
                $('body').css('background', 'none').css('background-color', '#ecf0f1');
                $('#wrapper').empty();
                $('.editar').remove();
                $('#searchBack').slideDown();
                $('#profileTiles').remove();
                $('#load').before('<div id="spinning"><img src="/images/spinning.gif" /></div>');
            }
            $('.scriptLoad').remove();
        }
    }).done(function (data) {
        $('#load').before(data);
        history.pushState(null, null, '/?t=' + searchStr.toString().split(/[ ,]+/).join('-'));

        $('#gridArticles').waitForImages(function () {
            $('#load').show();
            $("#spinning").hide();
            $('body').css('overflow-y', 'auto');
            container.animate({ 'opacity': 1 });
            $('footer').show();
            $('#load').show();
            if ($('#check').html() == 'check') {
                $('header').removeClass('header row');
                $('#check').remove();
                $('.smallLogo').remove();
            }
            FB.XFBML.parse();
            if (searchStr.length < 1) {
                history.pushState(null, null, '/');
                ga('send', 'pageview', '/');
            } else {
                ga('send', 'pageview', '/?t=' + searchStr.toString().split(/[ ,]+/).join('-'));
            }
            n = $('.item').length;
            if (n < 7) {
                $.ajax({
                    type: "GET",
                    url: "/pagination",
                    data: { n: n, str: searchStr },
                    dataType: 'html'
                }).done(function (data) {
                    container.isotope('insert', $(data));
                });
            }
        }, null, true);

    });
}

// Autocomplete
$('#mainInput').autocomplete({
    serviceUrl: '/autocomplete',
    minChars: 3,
    deferRequestBy: 400,
    autoSelectFirst: true
});


$('#mainInput').keypress(function (event) {
    if (event.keyCode === 13) {
        if($(this).val() != ''){
            $('#tagSelection').append('<span>' + $(this).val() + '<a class="tag" id="' + $(this).val().split(/[ ,]+/).join('-') + '">x</a></span>');
            // execute search
            searchStr.push($(this).val());
            tagSearch(searchStr);

            $(this).val('');
        }
    }

});

$(document).on('click', '.tag', function () {
    var id = $(this).attr('id');
    var remove = searchStr.indexOf($("#" + id).parent().html().replace('<a class="tag" id="'+id+'">x</a>', ''));
    searchStr.splice(remove, 1);
    tagSearch(searchStr);  

    $("#" + id).parent().remove();
});


// Opening Overlay
$(document).on('click', 'a', function () {
    if ($(this).data("link") == "ajax") {
        var ajaxUrl = $(this).attr('href');
        ajaxPage(ajaxUrl);
        history.pushState(null, null, ajaxUrl);
        ga('send', 'pageview', ajaxUrl + '/ajax');
        return false;
    }
});



var ajaxPage = function (url) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'html',
        beforeSend: function () {
            $("html, body").animate({ scrollTop: 0 });
            $('#nav-sticky').css('display', 'none');
            
        }
    }).done(function (data) {
        $('#myModal').html(data).css('position', 'absolute');
        $('.outWrap').css('height', 0);
        $('#loading').waitForImages(function () {
            $('#spinningContent').fadeOut(500);
            $('#loading').animate({ 'opacity': 1 }, function () {
                
                $('#myModal').css('background', 'url(/images/pattern.png) repeat #34495e');
                var facebookComments = $(".fb-comments");
                var facebookLikes = $('.fb-like');

                facebookLikes.attr("data-href", window.location.href);
                facebookComments.attr("data-href", window.location.href);

                if ($(window).width() < 760) {
                    facebookComments.attr('data-width', 550)
                }
                if ($(window).width() < 595) {
                    facebookComments.attr('data-width', 380)
                }
                FB.XFBML.parse();
            });




        });
    });
}

// CLOSE OVERLAY
$(document).on('close', '[data-reveal]', function () {
    $('#myModal').css('position', 'fixed');
    $('.outWrap').css('height', 'auto');
    $('#nav-sticky').css('display', 'block');
    if (window.location.href != 'http://www.gueime.com.br/') {
        window.history.go(-1);
    }
    ga('send', 'pageview', '/');
    $('#myModal').fadeOut(function () {
        $(this).html('<div id="spinningContent"><img src="/images/spinning.gif" /></div>').css('background', 'white');
    });
});

$('#loadMore').on('click', function () {
    n = $('.item').length;
    $.ajax({
        type: "GET",
        url: "/pagination",
        data: { n: n, str: searchStr },
        dataType: 'html'
    }).done(function (data) {
        container.isotope('insert', $(data));
        container.isoSelective({
            linkSelector: '.filterMenu a',
            attrSelector: 'data-filter',
            activeClass: 'toggledOn',
            preventEmpty: true
        });
    });
});



// 100% videos
$(function() {

	// Find all YouTube videos
	var $allVideos = $("iframe[src^='//www.youtube.com']"),

	    // The element that is fluid width
	    $fluidEl = $("#mainText");

	// Figure out and save aspect ratio for each video
	$allVideos.each(function() {

		$(this)
			.data('aspectRatio', this.height / this.width)
			
			// and remove the hard coded width/height
			.removeAttr('height')
			.removeAttr('width');

	});

	// When the window is resized
	// (You'll probably want to debounce this)
	$(window).resize(function() {

		var newWidth = $fluidEl.width();
		
		// Resize all videos according to their own aspect ratio
		$allVideos.each(function() {

			var $el = $(this);
			$el
				.width(newWidth)
				.height(newWidth * $el.data('aspectRatio'));

		});

	// Kick off one resize to fix all videos on page load
	}).resize();

});

$('#alertMessage').on('click', function () {
    history.pushState(null, null, '/');
});

$('.filtros').on('click', function (event) {
    event.preventDefault();
    $('.filter').slideToggle();
});

// Analytics specific
/* Page Exit */
window.onbeforeunload = sendView;
function sendView(){
    ga('send', 'event', 'time', 'exit', '/'+window.location.href.replace('http://www.gueime.com.br/', ''));
}

var filts = 'bla';
$('.filterMenu').find('a').on('click', function () {
    var check = $(this).attr('class');
    var filt = ',' + $(this).attr('data-filter');

    if (check != 'create toggledOn') {
        $(this).addClass('toggledOn');
        if (filts == 'bla, *') {
            filts = filts.replace(', *', '');
        }
        filts += filt;
        container.isotope({ filter: filts });
    } else {
        $(this).removeClass('toggledOn');
        filts = filts.replace(filt, '')
        if (filts == 'bla') {
            filts = 'bla, *'
        }
        container.isotope({ filter: filts });
    }

});



// CONTATO
$('#enviarContato').on('click', function () {
    $('#infoContato').submit();
});
$('#infoContato')
    .on('invalid', function () {

    })
    .on('valid', function () {
        $.ajax({
            type: 'POST',
            url: '/contatoSend',
            data: $('#infoContato').serialize(),
            beforeSend: function(){
                $('#enviarContato').fadeOut(300, function () {
                    $(this).text('Enviando').fadeIn();
                });
            }
        }).done(function (data) {
            $('#enviarContato').fadeOut(300, function () {
                    $(this).text('Enviado').fadeIn();
                });
        });
    });

// DELETAR ARTIGO
$('.deletar').on('click', function () {
    var result = confirm("Quer realmente deletar?");
    if(result == true){
        $('#deletar').submit();
    }
});

// ANALYTICS
//filters
$('a[data-filter!=""]').on('click', function () {
    var action = $(this).attr('data-filter');
    if(action == undefined){
        ga('send', 'event', 'button', 'filter', 'openFilter');
    } else{
        ga('send', 'event', 'button', 'filter', action);
    } 
});

// Login/Registrer
$('.facebookLogin').on('click', function(){
    ga('send', 'event', 'button', 'loginFacebook', '/'+window.location.href.replace('http://www.gueime.com.br/', ''));
});
$('.twitterLogin').on('click', function(){
    ga('send', 'event', 'button', 'loginTwitter', '/'+window.location.href.replace('http://www.gueime.com.br/', ''));
});
$('.googleLogin').on('click', function(){
    ga('send', 'event', 'button', 'loginGoogle', '/'+window.location.href.replace('http://www.gueime.com.br/', ''));
});
//LoadMore
$('#loadMore').on('click', function(){
    ga('send', 'event', 'button', 'click', 'loadMore');
});

$('#profileMenu').find('a').on('click', function(){
    var item = $(this).text();
    ga('send', 'event', 'button', 'click','profile/'+ item);
});

$('#gameMenu').find('a').on('click', function(){
    var item = $(this).text();
    ga('send', 'event', 'button', 'click', 'etc/' + item);
});