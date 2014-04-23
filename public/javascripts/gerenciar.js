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

$('.deletarGen').on('click', function (event) {
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
    } else {
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

$('.deletarUser').on('click', function (event) {
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
    } else {
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

$(document).on('click', '.restore', function (event) {
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

$(document).on('click', '.restoreUser', function (event) {
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