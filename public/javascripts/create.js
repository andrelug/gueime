var imageCover;
var docTitle;
var nJson
$(function () {

    Dropzone.options.dropzoneImage = {
        paramName: "file", // The name that will be used to transfer the file
        maxFilesize: 2, // MB,
        addRemoveLinks: true,
        previewsContainer: null,
        init: function () {
            this.on('addedfile', function () {
                $('#loadingAj').show();
            });
            this.on("complete", function (file) {
                console.log(file);
                console.log(file.name);
                if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
                    $('#dropzoneImage').css('width', '20%');
                    $('#loadingAj').fadeOut();
                    imageCover = '/uploads/' + file.name;
                    $('.mainImage').delay(500).attr('style', 'background: url(/uploads/' + file.name + ') no-repeat center 0px;');
                }
            });
        }
    };

    $('#createContent').redactor({
        lang: 'pt_br',
        plugins: ['fontcolor', 'awesome', 'fontsize', 'fontfamily'],
        placeholder: 'Texto sensacional',
        minHeight: 300,
        imageUpload: '/artigoImage',
        convertImageLinks: true,
        convertVideoLinks: true,
        imageUploadCallback: function (image, json) {

        },
        autosave: '/novoArtigo',
        autosaveInterval: 10, // seconds
        autosaveCallback: function (json) {
            console.log(json);

        }
    });

    $('#createTitle').redactor({
        lang: 'pt_br',
        toolbar: false,
        minHeight: 97,
        autosave: '/novoTitulo',
        autosaveInterval: 12, // seconds
        autosaveCallback: function (json) {
            console.log(json);
            nJson = decodeURIComponent(json.content);
            docTitle = decodeURIComponent(json.content);
            $('.teste').html(nJson);

        }
    });
});

$(document).ready(function(){
    var $bg = $('.mainImage'),
        origin = {x: 0, y: 0},
        start = {x: 0, y: 0},
        movecontinue = false;

    function move (e){
        var moveby = {
            x: origin.x - e.clientX,
            y: origin.y - e.clientY
        };

        if (movecontinue === true) {
            start.x = start.x - moveby.x;
            start.y = start.y - moveby.y;

            $(this).css('background-position', /*start.x + 'px ' Usar isso para mover tbm horizontal*/ 'center ' + start.y + 'px');
        }

        origin.x = e.clientX;
        origin.y = e.clientY;

        e.stopPropagation();
        return false;
    }

    function handle (e){
        movecontinue = false;
        $bg.unbind('mousemove', move);

        if (e.type == 'mousedown') {
            origin.x = e.clientX;
            origin.y = e.clientY;
            movecontinue = true;
            $bg.bind('mousemove', move);
        } else {
            $(document.body).focus();
        }

        e.stopPropagation();
        return false;
    }

    function reset (){
        start = {x: 0, y: 0};
        $(this).css('backgroundPosition', '0 0');
    }

    $bg.bind('mousedown mouseup mouseleave', handle);
    $bg.bind('dblclick', reset);
});



// Create Steps

$("#wizard").steps({
    transitionEffect: 2,
    labels: {
        current: "atual",
        pagination: "paginação",
        finish: "terminar",
        next: "próximo",
        previous: "anterior",
        loading: "carregando"
    },
    onFinished: function (event, currentIndex) {
        var form = $(this);

        var image = $('.mainImage').attr('style');
        $('input[name=position]').attr('value', image);
        $('input[name=coverUrl]').attr('value', imageCover);
        $('input[name=docTitle]').attr('value', docTitle);

        form.submit();
    }
});
$('#sendButton').on('click', function () {

    $('#perguntas').slideDown();
    $(this).slideUp();
    $('.steps').css('display', 'none');

})

$('#jogoSimNao').find('a').on('click', function () {
    if ($(this).html() === 'sim') {
        $('#qualJogo').slideDown();
        $('#jogoSimNao').slideUp();
    }else{
        $('#semJogo').slideDown();
        $('#jogoSimNao').slideUp();
    }

});

$('#autorSimNao').find('a').on('click', function () {
    if ($(this).html() === 'sim') {
        $('#qualAutor').slideDown();
        $('#autorSimNao').slideUp();
    }else{
        $('#semAutor').slideDown();
        $('#autorSimNao').slideUp();
    }

});

$('#continuaSimNao').find('a').on('click', function () {
    if ($(this).html() === 'sim') {
        $('#qualContinua').slideDown();
        $('#continuaSimNao').slideUp();
    }else{
        $('#semContinua').slideDown();
        $('#continuaSimNao').slideUp();
    }

});

$('#serieSimNao').find('a').on('click', function () {
    if ($(this).html() === 'sim') {
        $('#qualSerie').slideDown();
        $('#serieSimNao').slideUp();
    }else{
        $('#semSerie').slideDown();
        $('#serieSimNao').slideUp();
    }

});

$('#qualJogo').find('a').on('click', function () {
    $('#qualJogo').slideUp();
    $('#jogoSimNao').slideDown();
});
$('#semJogo').find('a').on('click', function () {
    $('#semJogo').slideUp();
    $('#jogoSimNao').slideDown();
});

$('#qualAutor').find('a').on('click', function () {
    $('#qualAutor').slideUp();
    $('#autorSimNao').slideDown();
});
$('#semAutor').find('a').on('click', function () {
    $('#semAutor').slideUp();
    $('#autorSimNao').slideDown();
});

$('#qualContinua').find('a').on('click', function () {
    $('#qualContinua').slideUp();
    $('#continuaSimNao').slideDown();
});
$('#semContinua').find('a').on('click', function () {
    $('#semContinua').slideUp();
    $('#continuaSimNao').slideDown();
});

$('#qualSerie').find('a').on('click', function () {
    $('#qualSerie').slideUp();
    $('#serieSimNao').slideDown();
});
$('#semSerie').find('a').on('click', function () {
    $('#semSerie').slideUp();
    $('#serieSimNao').slideDown();
});