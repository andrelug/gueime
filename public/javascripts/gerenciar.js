var varDocument = $(document);

// DataTable
$('.gerenciarTable').dataTable({
    "oLanguage": {
        "oPaginate": {
            "sFirst": "Primeira página",
            "sLast": "Última página",
            "sNext": "Próxima página",
            "sPrevious": "Página anterior"
        },
    "sEmptyTable": "Nenhum item disponível",
    "sInfo": "Mostrando _START_ a _END_ de _TOTAL_ itens",
    "sInfoEmpty": "Nenhum item para mostrar",
    "sInfoFiltered": "filtrado de _MAX_ itens",
    "sInfoThousands": ".",
    "sLengthMenu": "_MENU_ itens",
    "sLoadingRecords": "Por favor Aguarde - Carregando",
    "sProcessing": "Trabalhando",
    "sSearch": "Procura: ",
    "sZeroRecords": "Nenhum item"
    }
});

$(document).on('click', '.deletarGen', function (event) {
    event.preventDefault();
    var action = prompt("Você quer deletar (del) ou desabilitar (des)?");
    var esse = $(this);
    var href = $(this).attr('data-href');
    if (action == 'del') {
        $.ajax({
            url: href,
            type: 'PUT',
            data: { action: 'del' }
        }).done(function (data) {
            if (data == 'OK') {
                esse.parents('tr').fadeOut();
            }
        });
    } else if( action == 'des'){
        $.ajax({
            url: href,
            type: 'PUT',
            data: { action: 'des' }
        }).done(function (data) {
            console.log(data);
            if (data == 'OK') {
                esse.parents('tr').fadeOut(function () {
                    $(this).find('.status').html('deletado (<a href="' + href.replace('/deletar', '/restore') + '" class="restore">Restore</a>)');
                    $(this).fadeIn();
                });
            }
        });
    }
});

$(document).on('click', '.deletarUser', function (event) {
    event.preventDefault();
    var action = prompt("Você quer deletar (del) ou desabilitar (des)?");
    var esse = $(this);
    var href = $(this).attr('href');
    if (action == 'del') {
        $.ajax({
            url: href,
            type: 'PUT',
            data: { action: 'del' }
        }).done(function (data) {
            if (data == 'OK') {
                esse.parents('tr').fadeOut();
            }
        });
    } else if( action == 'des'){
        $.ajax({
            url: href,
            type: 'PUT',
            data: { action: 'des' }
        }).done(function (data) {
            console.log(data);
            if (data == 'OK') {
                esse.parents('tr').fadeOut(function () {
                    $(this).find('.statusUser').html('true (<a href="' + href.replace('/deletar', '/restore') + '" class="restoreUser">Restore</a>)');
                    $(this).fadeIn();
                });
            }
        });
    }
});

varDocument.on('click', '.restore', function (event) {
    event.preventDefault();
    var action = confirm('Quer voltar com esse elemento?');
    var href = $(this).attr('href');
    var esse = $(this);

    if (action == true) {
        $.ajax({
            url: href,
            type: 'PUT'
        }).done(function (data) {
            if (data == 'OK') {
                esse.parents('tr').fadeOut(function () {
                    esse.parent().text('publicado');
                    $(this).fadeIn();
                });

            }
        });
    }
});

varDocument.on('click', '.restoreUser', function (event) {
    event.preventDefault();
    var action = confirm('Quer voltar com esse elemento?');
    var href = $(this).attr('href');
    var esse = $(this);

    if (action == true) {
        $.ajax({
            url: href,
            type: 'PUT'
        }).done(function (data) {
            if (data == 'OK') {
                esse.parents('tr').fadeOut(function () {
                    esse.parent().text('false');
                    $(this).fadeIn();
                });

            }
        });
    }
});



varDocument.ready(function () {
    $('.statusSelect').each(function () {
        var status = $(this).parent().siblings('.profStatus').text();
        $(this).find('option[value="' + status + '"]').attr('selected', 'selected');
    });

   $('.statusArticleSelect').each(function () {
        var status = $(this).parent().siblings('.status').text();
        $(this).find('option[value="' + status + '"]').attr('selected', 'selected');
    });
});

$(document).on('change', '.statusSelect', function () {
    var esse = $(this);
    var status = $(this).find('option:selected').text();
    var user = $(this).attr('title');
    $.ajax({
        url: '/changeUserStatus',
        type: 'PUT',
        data: { status: status, user: user }
    }).done(function (data) {
        esse.parent().siblings('.profStatus').fadeOut(function(){
            $(this).text(status).fadeIn();
        });
    });
});

$(document).on('change', '.statusArticleSelect', function () {
    var esse = $(this);
    var status = $(this).find('option:selected').text();
    var art = $(this).attr('title');
    $.ajax({
        url: '/changeArticleStatus',
        type: 'PUT',
        data: { status: status, art: art }
    }).done(function (data) {
        esse.parent().siblings('.status').fadeOut(function(){
            $(this).text(status).fadeIn();
        });
    });
});
