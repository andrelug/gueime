var profileContainer = $('#gridProfileArticles');

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
$('#profileMenu').find('a').on('click', function () {
    var check = $(this).attr('class');
    $('#profileMenu').find('a').each(function () {
        $(this).removeClass('selecionado');
    });

    if (check != 'selecionado') {
        $(this).addClass('selecionado');
    }

    var thisHmtl = $(this).html();
    switch (thisHmtl) {
        case 'Informações':
            $('.slides').not('#profileEditing').slideUp();
            $('#profileEditing').slideToggle();
            break

        case 'Social':
            $('.slides').not('#profileSocialEditing').slideUp();
            $('#profileSocialEditing').slideToggle();
            break

        case 'Conta':
            $('.slides').not('#profileContaEditing').slideUp();
            $('#profileContaEditing').slideToggle();
            break

        case 'Conquistas':
            $('.slides').not('#profileConqEditing').slideUp();
            $('#profileConqEditing').slideToggle();
            break

        case 'Deletar':
            $('.slides').not('#profileDeleEditing').slideUp();
            $('#profileDeleEditing').slideToggle();
            break

        case 'Sobre':
            $('.slides').not('#gameSobre').slideUp();
            $('#gameSobre').slideToggle();
            break

        default:
            break
    }
});

$('#gameMenu').find('a').on('click', function () {
    var check = $(this).attr('class')
    $('#gameMenu').find('a').each(function () {
        $(this).removeClass('selecionadoJogo');
    });

    
    if(check != 'selecionadoJogo'){
        $(this).addClass('selecionadoJogo');
    }

    var thisHmtl = $(this).html();
    switch (thisHmtl) {
        case 'Sobre':
            $('.slides').not('#gameSobre').slideUp();
            $('#gameSobre').slideToggle();
            break

        default:
            break
    }
});


//Send ajax Forms
$('#infoSend')
    .on('invalid', function () {
        $('#infoError').show().delay(3000).hide();
    })
    .on('valid', function () {
        $.ajax({
            type: 'PUT',
            url: '/infoSend',
            data: $('#infoSend').serialize()
        }).done(function (data) {
            console.log(data);
            $('#enviarInfo').fadeOut(300, function () {
                $(this).text('Atualizado!').fadeIn().delay(2000).fadeOut(300, function () {
                    $(this).text('Enviar').fadeIn();
                });
            });
        });
    });

$('#socialSend')
    .on('invalid', function () {

    })
    .on('valid', function () {
        $.ajax({
            type: 'PUT',
            url: '/socialSend',
            data: $('#socialSend').serialize()
        }).done(function (data) {
            console.log(data);
            $('#enviarSocial').fadeOut(300, function () {
                $(this).text('Atualizado!').fadeIn().delay(2000).fadeOut(300, function () {
                    $(this).text('Enviar').fadeIn();
                });
            });
        });
    });
$('#contaSend')
    .on('invalid', function () {
        
    })
    .on('valid', function () {
        $.ajax({
            type: 'PUT',
            url: '/contaSend',
            data: $('#contaSend').serialize()
        }).done(function (data) {
            console.log(data);
            $('#enviarConta').fadeOut(300, function () {
                $(this).text('Atualizado!').fadeIn().delay(2000).fadeOut(300, function () {
                    $(this).text('Enviar').fadeIn();
                });
            });
        });
    });

$('#enviarInfo').on('click', function () {
    $('#infoSend').submit();
});
$('#enviarSocial').on('click', function () {
    $('#socialSend').submit();
});
$('#enviarConta').on('click', function () {
    $('#contaSend').submit();
});

// DELETE CHECK
$('#deleteCheck').on('keyup', function (e) {
    if($(this).val() == $('#userTitle').text()){
        $('#deleteAccount').removeClass('disabled').removeAttr('disabled');
    }
});

// EDITION
$('#mainImageChange').hover(function () {
    $(this).find('a').show();
});
$('#mainImageChange').on('mouseleave', function () {
    $(this).find('a').hide();
});
$('#profileImageSubmit').on('click', function () {
    var image = $('.mainImage').attr('style');
    $('input[name=gameCover]').attr('value', gameCover);
    $('input[name=position]').attr('value', image);
});



$('.editingProf').hover(function () {
    $('#editButtonHover').addClass('mostra');
    $('#userGameImage').addClass('mostra');
});
$('.editingProf').on('mouseleave', function () {
    $('#editButtonHover').removeClass('mostra');
    $('#userGameImage').removeClass('mostra');
});


// GAME CREATE

$('#submitNewGame').on('click', function () {
    gameImageCover = $('.mainImage').attr('style');
    $('input[name=position]').attr('value', gameImageCover);
    $('input[name=gameCover]').attr('value', gameCover);
});



// JOGADO, FAVORITO
var url = $('#userTitle').text();
$('#favorito').on('click', function () {
    if ($(this).attr('class') == 'button jogado') {
        $.ajax({
            type: 'PUT',
            url: '/addToFavorites',
            data: {game: url, add: false}
        }).done(function (data) {
            $('#favorito').fadeOut(300, function () {
                $(this).removeClass('jogado').html('<i class="fa fa-times"></i>').fadeIn().delay(300).fadeOut(300, function () {
                    $(this).html('Favorito').fadeIn();
                });
            });
        });  
    } else {
        $.ajax({
            type: 'PUT',
            url: '/addToFavorites',
            data: {game: url, add: true}
        }).done(function (data) {
            $('#favorito').fadeOut(300, function () {
                $(this).addClass('jogado').html('<i class="fa fa-check"></i>').fadeIn().delay(300).fadeOut(300, function () {
                    $(this).html('<i class="fa fa-check"></i> Gosto').fadeIn();
                });
            });
        });
    }
    
});

$('#joguei').on('click', function () {
    if ($(this).attr('class') == 'button jogado') {
        $.ajax({
            type: 'PUT',
            url: '/addToCollection',
            data: {game: url, add: false}
        }).done(function (data) {
            $('#joguei').fadeOut(300, function () {
                $(this).removeClass('jogado').html('<i class="fa fa-times"></i>').fadeIn().delay(300).fadeOut(300, function () {
                    $(this).html('Tenho').fadeIn();
                });
            });
        });  
    } else {
        $.ajax({
            type: 'PUT',
            url: '/addToCollection',
            data: {game: url, add: true}
        }).done(function (data) {
            $('#joguei').fadeOut(300, function () {
                $(this).addClass('jogado').html('<i class="fa fa-check"></i>').fadeIn().delay(300).fadeOut(300, function () {
                    $(this).html('<i class="fa fa-check"></i> Joguei').fadeIn();
                });
            });
        });
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
    }
});