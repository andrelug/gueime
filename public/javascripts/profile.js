$('#profileMenu').find('a').on('click', function () {
    $('#profileMenu').find('a').each(function () {
        $(this).removeClass('selecionado');
    });

    $(this).addClass('selecionado');
    $('.slides').slideUp();
    if ($(this).html() == 'Informações') {
        $('#profileEditing').slideDown();
    }
});