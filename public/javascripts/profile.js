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
            
        case 'Preferências':
            $('.slides').not('#profilePrefEditing').slideUp();
            $('#profilePrefEditing').slideToggle();
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
        var invalid_fields = $(this).find('[data-invalid]');
        console.log(invalid_fields);
    })
        .on('valid', function () {
        console.log('valid!');
    });
    
$('#socialSend')
    .on('invalid', function () {
        var invalid_fields = $(this).find('[data-invalid]');
        console.log(invalid_fields);
    })
        .on('valid', function () {
        console.log('valid!');
    });
$('#prefSend')
    .on('invalid', function () {
        var invalid_fields = $(this).find('[data-invalid]');
        console.log(invalid_fields);
    })
        .on('valid', function () {
        console.log('valid!');
    });

$('#enviarInfo').on('click', function () {
    $('#infoSend').submit();
});
$('#enviarSocial').on('click', function () {
    $('#socialSend').submit();
});
$('#enviarPref').on('click', function () {
    $('#prefSend').submit();
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