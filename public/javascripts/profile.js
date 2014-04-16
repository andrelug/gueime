var profileContainer = $('#gridProfileArticles');
$('#profileMenu').find('a').on('click', function () {
    var check = $(this).attr('class')
    $('#profileMenu').find('a').each(function () {
        $(this).removeClass('selecionado');
    });

    
    if(check != 'selecionado'){
        $(this).addClass('selecionado');
    }

    


    var thisHmtl = $(this).html();
    switch (thisHmtl) {
        case 'Informações':
            $('.slides').not('#profileEditing').slideUp();
            $('#profileEditing').slideToggle();
            break;

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


// LOAD MORE ARTICLES
$('#loadMoreProfile').on('click', function () {
    n = $('.item').length;
    $.ajax({
        type: "GET",
        url: "/pagination",
        data: { n: n },
        dataType: 'html'
    }).done(function (data) {
        container.isotope('insert', $(data));
    });
});