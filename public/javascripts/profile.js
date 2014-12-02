    var profileContainer = $('#gridProfileArticles'),
    varProfileMenu = $('#profileMenu'),
    varSlides = $('.slides'),
    varGameMenu = $('#gameMenu'),
    varInfoSend = $('#infoSend'),
    varSocialSend = $('#socialSend'),
    varContaSend = $('#contaSend'),
    varEnviarInfo = $('#enviarInfo'),
    varEnviarSocial = $('#enviarSocial'),
    varEnviarConta = $('#enviarConta'),
    varUserTitle = $('#userTitle'),
    varMainImageChange = $('#mainImageChange'),
    varMainImage = $('.mainImage'),
    varEditingProf = $('.editingProf'),
    varEditButtonHover = $('#editButtonHover'),
    varUserGameImage = $('#userGameImage'),
    varFavorito = $('#favorito'),
    varJoguei = $('#joguei');

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
    varProfileMenu.find('a').on('click', function () {
        var check = $(this).attr('class');
        varProfileMenu.find('a').each(function () {
            $(this).removeClass('selecionado');
        });

        if (check != 'selecionado') {
            $(this).addClass('selecionado');
        }

        var thisHmtl = $(this).html();
        switch (thisHmtl) {
            case 'Informações':
                varSlides.not('#profileEditing').slideUp();
                $('#profileEditing').slideToggle();
                break

            case 'Social':
                varSlides.not('#profileSocialEditing').slideUp();
                $('#profileSocialEditing').slideToggle();
                break

            case 'Conta':
                varSlides.not('#profileContaEditing').slideUp();
                $('#profileContaEditing').slideToggle();
                break

            case 'Conquistas':
                varSlides.not('#profileConqEditing').slideUp();
                $('#profileConqEditing').slideToggle();
                break

            case 'Deletar':
                varSlides.not('#profileDeleEditing').slideUp();
                $('#profileDeleEditing').slideToggle();
                break

            case 'Sobre':
                varSlides.not('#gameSobre').slideUp();
                $('#gameSobre').slideToggle();
                break

            default:
                break
        }
    });

    varGameMenu.find('a').on('click', function () {
        var check = $(this).attr('class')
        varGameMenu.find('a').each(function () {
            $(this).removeClass('selecionadoJogo');
        });


        if (check != 'selecionadoJogo') {
            $(this).addClass('selecionadoJogo');
        }

        var thisHmtl = $(this).html();
        switch (thisHmtl) {
            case 'Sobre':
                varSlides.not('#gameSobre').slideUp();
                $('#gameSobre').slideToggle();
                break

            default:
                break
        }
    });


    //Send ajax Forms
    varInfoSend
    .on('invalid', function () {
        $('#infoError').show().delay(3000).hide();
    })
    .on('valid', function () {
        $.ajax({
            type: 'PUT',
            url: '/infoSend',
            data: varInfoSend.serialize()
        }).done(function (data) {
            varEnviarInfo.fadeOut(300, function () {
                $(this).text('Atualizado!').fadeIn().delay(2000).fadeOut(300, function () {
                    $(this).text('Enviar').fadeIn();
                });
            });
        });
    });


    varSocialSend
    .on('invalid', function () {

    })
    .on('valid', function () {
        $.ajax({
            type: 'PUT',
            url: '/socialSend',
            data: varSocialSend.serialize()
        }).done(function (data) {
            varEnviarSocial.fadeOut(300, function () {
                $(this).text('Atualizado!').fadeIn().delay(2000).fadeOut(300, function () {
                    $(this).text('Enviar').fadeIn();
                });
            });
        });
    });


    varContaSend
    .on('invalid', function () {

    })
    .on('valid', function () {
        $.ajax({
            type: 'PUT',
            url: '/contaSend',
            data: varContaSend.serialize()
        }).done(function (data) {
            varEnviarConta.fadeOut(300, function () {
                $(this).text('Atualizado!').fadeIn().delay(2000).fadeOut(300, function () {
                    $(this).text('Enviar').fadeIn();
                });
            });
        });
    });

    varEnviarInfo.on('click', function () {
        varInfoSend.submit();
    });
    varEnviarSocial.on('click', function () {
        varSocialSend.submit();
    });
    varEnviarConta.on('click', function () {
        varContaSend.submit();
    });



    // DELETE CHECK
    $('#deleteCheck').on('keyup', function (e) {
        if ($(this).val() == varUserTitle.text()) {
            $('#deleteAccount').removeClass('disabled').removeAttr('disabled');
        }
    });


    // EDITION
    varMainImageChange.hover(function () {
        $(this).find('a').show();
    });
    varMainImageChange.on('mouseleave', function () {
        $(this).find('a').hide();
    });
    $('#profileImageSubmit').on('click', function () {
        var image = varMainImage.attr('style');
        if (gameCover == 'none') {
            gameCover = $('#userGameImage').attr('src');
        }
        $('input[name=gameCover]').attr('value', gameCover);
        $('input[name=position]').attr('value', image);
    });



    varEditingProf.hover(function () {
        varEditButtonHover.addClass('mostra');
        varUserGameImage.addClass('mostra');
    });
    varEditingProf.on('mouseleave', function () {
        varEditButtonHover.removeClass('mostra');
        varUserGameImage.removeClass('mostra');
    });


    // GAME CREATE

    $('#submitNewGame').on('click', function () {
        gameImageCover = varMainImage.attr('style');
        if (gameCover == 'none') {
            gameCover = $('#userGameImage').attr('src');
        }
        $('input[name=position]').attr('value', gameImageCover);
        $('input[name=gameCover]').attr('value', gameCover);
    });



    // JOGADO, FAVORITO
    var url = varUserTitle.text();
    varFavorito.on('click', function () {
        if ($(this).attr('class') == 'button jogado') {
            $.ajax({
                type: 'PUT',
                url: '/addToFavorites',
                data: { game: url, add: false }
            }).done(function (data) {
                varFavorito.fadeOut(300, function () {
                    $(this).removeClass('jogado').html('<i class="fa fa-times"></i>').fadeIn().delay(300).fadeOut(300, function () {
                        $(this).html('Favorito').fadeIn();
                    });
                });
            });
        } else {
            $.ajax({
                type: 'PUT',
                url: '/addToFavorites',
                data: { game: url, add: true }
            }).done(function (data) {
                varFavorito.fadeOut(300, function () {
                    $(this).addClass('jogado').html('<i class="fa fa-check"></i>').fadeIn().delay(300).fadeOut(300, function () {
                        $(this).html('<i class="fa fa-check"></i> Gosto').fadeIn();
                    });
                });
            });
        }

    });

    varJoguei.on('click', function () {
        if ($(this).attr('class') == 'button jogado') {
            $.ajax({
                type: 'PUT',
                url: '/addToCollection',
                data: { game: url, add: false }
            }).done(function (data) {
                varJoguei.fadeOut(300, function () {
                    $(this).removeClass('jogado').html('<i class="fa fa-times"></i>').fadeIn().delay(300).fadeOut(300, function () {
                        $(this).html('Tenho').fadeIn();
                    });
                });
            });
        } else {
            $.ajax({
                type: 'PUT',
                url: '/addToCollection',
                data: { game: url, add: true }
            }).done(function (data) {
                varJoguei.fadeOut(300, function () {
                    $(this).addClass('jogado').html('<i class="fa fa-check"></i>').fadeIn().delay(300).fadeOut(300, function () {
                        $(this).html('<i class="fa fa-check"></i> Joguei').fadeIn();
                    });
                });
            });
        }
    });

    $('.gameLogoStats a').each(function (index, value) {
        var ihref = $(this).attr('href');
        if (ihref.indexOf('/consoles/') > -1) {
            $(this).attr('href', string_to_slug(ihref).replace('-consoles-', '/consoles/'));
        } else if (ihref.indexOf('/generos/') > -1) {
            $(this).attr('href', string_to_slug(ihref).replace('-generos-', '/generos/'));
        } else if (ihref.indexOf('/desenvolvedores/') > -1) {
            $(this).attr('href', string_to_slug(ihref).replace('-desenvolvedores-', '/desenvolvedores/'));
        } else if (ihref.indexOf('/distribuidoras') > -1) {
            $(this).attr('href', string_to_slug(ihref).replace('-distribuidoras-', '/distribuidoras/'));
        }
    });
