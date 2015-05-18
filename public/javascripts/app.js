var container = $('#gridArticles'),
    varBody = $('body'),
    varFooter = $('footer'),
    varLoad = $('#load'),
    varCheck = $('#check'),
    varMainInput = $('#mainInput'),
    varDocument = $(document),
    varHtmlBody = $("html, body"),
    varNavSticky = $('#nav-sticky'),
    varMyModal = $('#myModal'),
    varOutWrap = $('.outWrap'),
    varEnviarContato = $('#enviarContato'),
    varLocation,
    varDeletar = $('.deletar'),
    varInfoContato = $('#infoContato');

function string_to_slug(str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    var from = "àãáäâèéëêìíïîòóõöôùúüûñç·/_,:;";
    var to = "aaaaaeeeeiiiiooooouuuunc------";
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

    return str;
}


var searchStr = [];

tagSearch = function (str) {
    $.ajax({
        type: "GET",
        url: "/tags",
        data: { str: str },
        dataType: 'html',
        beforeSend: function () {
            $('#spinning').show();
            varBody.css('overflow-y', 'hidden');
            container.animate({ 'opacity': 0 }).remove();
            varHtmlBody.animate({ scrollTop: 0 }, "slow");
            varFooter.hide();
            varLoad.hide();
            if (varCheck.html() == 'check') {
                varBody.css('background', 'none').css('background-color', '#ecf0f1');
                $('#wrapper').empty();
                $('.editar').remove();
                $('#searchBack').slideDown();
                $('#profileTiles').remove();
                $('#spinning').remove();
                varLoad.before('<div id="spinning"><img src="/images/spinning.gif" /></div>');
                varDeletar.remove();
            }
            $('.scriptLoad').remove();
        }
    }).done(function (data) {
        varLoad.before(data);
        history.pushState(null, null, '/?t=' + searchStr.toString().split(/[ ,]+/).join('-'));

        container.waitForImages(function () {
            varLoad.show();
            $('#spinning').hide();
            varBody.css('overflow-y', 'auto');
            container.animate({ 'opacity': 1 });
            varFooter.show();
            varLoad.show();
            if (varCheck.html() == 'check') {
                $('header').removeClass('header row');
                $('#check').remove();
                $('.smallLogo').remove();
            }
            FB.XFBML.parse();
            if (searchStr.length < 1) {
                history.pushState(null, null, '/');
                if(thereIsAdmin != true) analytics.track('Exit Search');
            } else {
                if(thereIsAdmin != true) {
                    analytics.page('Search', {
                        title: 'Busca',
                        url: 'http://www.gueime.com.br/?t=' + searchStr.toString().split(/[ ,]+/).join('-'),
                        referrer: document.referrer
                    });
                }
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
                    FB.XFBML.parse();
                });
            }
        }, null, true);

    });
}

$('.trending').on('click', function () {
    $.ajax({
        url: '/trending',
        type: 'GET',
        dataType: 'html',
        beforeSend: function () {
            $('#spinning').show();
            varBody.css('overflow-y', 'hidden');
            container.animate({ 'opacity': 0 }).remove();
            varHtmlBody.animate({ scrollTop: 0 }, "slow");
            varFooter.hide();
            varLoad.hide();
            if (varCheck.html() == 'check') {
                varBody.css('background', 'none').css('background-color', '#ecf0f1');
                $('#wrapper').empty();
                $('.editar').remove();
                $('#searchBack').slideDown();
                $('#profileTiles').remove();
                $('#spinning').remove();
                varLoad.before('<div id="spinning"><img src="/images/spinning.gif" /></div>');
                varDeletar.remove();
            }
            $('.scriptLoad').remove();
        }
    }).done(function (data) {
        varLoad.before(data);
        history.pushState(null, null, '/trending');
        analytics.page('Trending', {
            title: 'Trending',
            url: 'http://www.gueime.com.br/trending',
            path: '/trending',
            referrer: document.referrer
        });
        container.waitForImages(function () {
            varLoad.show();
            $('#spinning').hide();
            varBody.css('overflow-y', 'auto');
            container.animate({ 'opacity': 1 });
            varFooter.show();
            varLoad.show();
            if (varCheck.html() == 'check') {
                $('header').removeClass('header row');
                $('#check').remove();
                $('.smallLogo').remove();
            }
            FB.XFBML.parse();
            n = $('.item').length;
            if (n < 7) {
                $.ajax({
                    type: "GET",
                    url: "/pagination",
                    data: { n: n, str: searchStr },
                    dataType: 'html'
                }).done(function (data) {
                    container.isotope('insert', $(data));
                    FB.XFBML.parse();
                });
            }
        }, null, true);
    });
    return false
});

// Autocomplete
varMainInput.autocomplete({
    serviceUrl: '/autocomplete',
    minChars: 2,
    deferRequestBy: 50,
    autoSelectFirst: true
});


varMainInput.keypress(function (event) {
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

varDocument.on('click', '.tag', function () {
    var id = $(this).attr('id');
    var remove = searchStr.indexOf($("#" + id).parent().html().replace('<a class="tag" id="'+id+'">x</a>', ''));
    searchStr.splice(remove, 1);
    tagSearch(searchStr);  

    $("#" + id).parent().remove();
});


// Opening Overlay
varDocument.on('click', 'a', function () {
    if ($(this).data("link") == "ajax") {
        varLocation = window.location.href;
        var ajaxUrl = $(this).attr('href');
        ajaxPage(ajaxUrl);
        if(thereIsAdmin != true) {
            analytics.page('AjaxUrl', {
                title: 'AjaxUrl',
                url: 'http://www.gueime.com.br/' + ajaxUrl,
                path: '/' + ajaxUrl,
                referrer: document.referrer
            });
        }
        
        history.pushState(null, null, ajaxUrl);
        document.title = "Gueime - " + $(this).find('.ref').text();
        return false;
    }
});



var ajaxPage = function (url) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'html',
        beforeSend: function () {
            varHtmlBody.animate({ scrollTop: 0 });
            varNavSticky.css('display', 'none');

        }
    }).done(function (data) {
        varMyModal.html(data).css('position', 'absolute');
        varOutWrap.css('height', 0);

        $('#loading').waitForImages(function () {
            $('#spinningContent').fadeOut(500);
            $(this).animate({ 'opacity': 1 }, function () {

                varMyModal.css('background', 'url(/images/pattern.png) repeat #34495e');
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

            $.ajax({
                url: '/loadRelated',
                type: 'GET',
                data: { related: $('#share').attr('title'), id: $('#share').attr('data-id') }
            }).done(function (data2) {
                $('#share').html(data2);
            });
        });
    });
}

// CLOSE OVERLAY
$(document).on('close', '[data-reveal]', function () {
    varMyModal.css('position', 'fixed');
    varOutWrap.css('height', 'auto');
    varNavSticky.css('display', 'block');
    if (window.location.href != varLocation) {
        window.history.go(-1);
    }
    varMyModal.fadeOut(function () {
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
        console.log(data)
        FB.XFBML.parse();
        if (data == '<div id="gridArticles" class="row"></div><style>.autocomplete-suggestions{position:absolute !important;}</style>') {
            $("#loadMore").fadeOut(300, function () {
                $(this).text("Aparentemente não há mais artigos").fadeIn(300).delay(1500).fadeOut(300, function () {
                    $(this).text('Mais Artigos').fadeIn(300);
                });
            });
        }
        container.isotope('insert', $(data));
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
varEnviarContato.on('click', function () {
    varInfoContato.submit();
});
varInfoContato
    .on('invalid', function () {

    })
    .on('valid', function () {
        $.ajax({
            type: 'POST',
            url: '/contatoSend',
            data: varInfoContato.serialize(),
            beforeSend: function () {
                varEnviarContato.fadeOut(300, function () {
                    $(this).text('Enviando').fadeIn();
                });
            }
        }).done(function (data) {
            varEnviarContato.fadeOut(300, function () {
                $(this).text('Enviado').fadeIn();
            });
        });
    });
    
// DELETAR ARTIGO
varDeletar.on('click', function () {
    var result = confirm("Quer realmente deletar?");
    if(result == true){
        $('#deletar').submit();
    }
});


$('.gameLogoStats a').each(function (index, value) {
    var ihref = $(this).attr('href');
    if(ihref.indexOf('/consoles/') > -1){
        $(this).attr('href', string_to_slug(ihref).replace('-consoles-', '/consoles/'));
    } else if(ihref.indexOf('/generos/') > -1){
        $(this).attr('href', string_to_slug(ihref).replace('-generos-', '/generos/'));
    } else if(ihref.indexOf('/desenvolvedores/') > -1){
        $(this).attr('href', string_to_slug(ihref).replace('-desenvolvedores-', '/desenvolvedores/'));
    } else if(ihref.indexOf('/distribuidoras') > -1) {
        $(this).attr('href', string_to_slug(ihref).replace('-distribuidoras-', '/distribuidoras/'));
    } else if(ihref.indexOf('/jogos') > -1){
        $(this).attr('href', string_to_slug(ihref).replace('-jogos-', '/jogos/'));
    }
});

// Product Related
$('.pedir').on('click', function (event) {
    event.preventDefault();
    var prod = $(this).attr('data-title'),
        thisProd = $(this),
        answer = prompt('Você quer realmente trocar por isto (Sim ou Não)? Caso queira, receberá um email confirmando');

    if (answer == 'Sim' || answer == 'sim') {
        $.ajax({
            url: '/pedirProduto',
            type: 'PUT',
            data: { prod: prod }
        }).done(function (data) {
            thisProd.fadeOut(300, function () {
                $(this).text(data.message).fadeIn().delay(2000).fadeOut(300, function () {
                    $(this).text('Requesitar Outro').fadeIn();
                });
            });
            thisProd.siblings().find('.productMany').fadeOut(300, function () {

                $(this).text('Quantidade: ' + data.many).fadeIn();
            });

            $.ajax({
                url: '/trocaEmail',
                type: 'POST',
                data: { prod: prod }
            }).done(function (data) {
                console.log(data);
            });
        });
    }
});





if(thereIsAdmin != true) {
    // Analytics specific
    //filter
    $('.filtros').on('click', function () {
        analytics.track('Open Filter', {
            referrer: document.referrer
        });
    });

    // Login/Registrer
    $('.facebookLogin').on('click', function(){
        analytics.track('loginFacebook', {
            referrer: document.referrer
        });
    });
    $('.twitterLogin').on('click', function(){
        analytics.track('loginTwitter', {
            referrer: document.referrer
        });
    });
    $('.googleLogin').on('click', function(){
        analytics.track('loginGoogle', {
            referrer: document.referrer
        });
    });
    //LoadMore
    $('#loadMore').on('click', function(){
        analytics.track('loadMore', {
            referrer: document.referrer
        });
    });

    $('#profileMenu').find('a').on('click', function(){
        var item = $(this).text();
        analytics.track('Click Profile Menu', {
            referrer: document.referrer,
            item: item
        });
    });

    $('#gameMenu').find('a').on('click', function(){
        var item = $(this).text();
        analytics.track('Game Menu', {
            referrer: document.referrer,
            item: item
        });
    });

    $('#share').find('a').on('click', function(){
        analytics.track('Click Relacionados', {
            referrer: document.referrer
        });
    });
}