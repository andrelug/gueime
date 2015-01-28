var imageCover,
        docTitle,
        nJson,
        exitNoSave = true,
        varLoadingAj = $('#loadingAj'),
        varMainImage = $('.mainImage'),
        varSendButton = $('#sendButton');

    Dropzone.options.dropzoneImage = {
        paramName: "file", // The name that will be used to transfer the file
        maxFilesize: 2, // MB,
        addRemoveLinks: true,
        previewsContainer: null,
        init: function () {
            this.on('addedfile', function () {
                varLoadingAj.show();
            });
            this.on("complete", function (file) {
                if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
                    $('#dropzoneImage').css('width', '20%');
                    varLoadingAj.fadeOut();
                    imageCover = '/uploads/' + thisUser + file.name;
                    varMainImage.delay(500).attr('style', 'background: url(/uploads/' + thisUser + file.name + ') no-repeat center 0px;');
                    window.setTimeout(function () { varMainImage.delay(6000).attr('style', 'background: url(https://s3-sa-east-1.amazonaws.com/portalgueime/images/userInput/' + thisUser + file.name + ') no-repeat center 0px;'); }, 6000);
                }
            });
        }
    };

    $('#createContent').redactor({
        lang: 'pt_br',
        plugins: ['fontcolor', 'fontsize', 'fontfamily'],
        placeholder: 'Texto sensacional',
        minHeight: 300,
        imageUpload: '/artigoImage',
        convertImageLinks: true,
        toolbarFixed: true,
        toolbarFixedTopOffset: 98,
        convertVideoLinks: true,
        imageUploadCallback: function (image, json) {
            window.setTimeout(function () {
                var oldUrl = json.filelink;
                var fileName = json.filelink.replace('http://www.gueime.com.br/uploads/', '')
                var newUrl = 'https://s3-sa-east-1.amazonaws.com/portalgueime/images/' + fileName;
                $('img[src="' + oldUrl + '"]').attr('src', newUrl);
            }, 6000);

        },
        autosave: '/novoArtigo/' + thisArticle,
        autosaveInterval: 10, // seconds
        autosaveCallback: function (json) {
            console.log(json);

        }
    });

    $('#createTitle').redactor({
        lang: 'pt_br',
        toolbar: false,
        minHeight: 97,
        placeholder: 'Ótimo Título',
        autosave: '/novoTitulo/' + thisArticle,
        autosaveInterval: 5, // seconds
        pastePlainText: true,
        deniedTags: ['blockquote', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'img', 'a', 'ul', 'li', 'code', 'pre'],
        autosaveCallback: function (name, json) {
            nJson = decodeURIComponent(json.content);
            
            docTitle = decodeURIComponent(json.content);
            console.log(json.content);
            $('.teste').html(nJson);

        }
    });

$('.gueimeWhite').css('display', 'block').css('left', 'auto').css('right', 30);

$('.deletar').on('click', function () {
    var result = confirm("Quer realmente deletar?");
    if(result == true){
        $('#deletar').submit();
    }
});

$(document).ready(function(){
    var $bg = varMainImage,
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

varSendButton.on('click', function () {
    $('#perguntas').slideDown();
    varSendButton.slideUp();
});

// Create Steps
var editChecked;
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

        var image = varMainImage.attr('style');
        $('input[name=position]').attr('value', image);
        if($('input[name=coverUrl]').attr('value') == undefined || imageCover != undefined){
            $('input[name=coverUrl]').attr('value', imageCover);
        }
        $('input[name=docTitle]').attr('value', docTitle);
        exitNoSave = false;

        editCheck = $('#editCheck').html();
        editChecked;
        if (editCheck == 'check') {
            editChecked = true;
        } else {
            editChecked = false;
        }


        $.ajax({
            url: '/titleCheck/' + thisArticle,
            typo: "get",
            data: { title: docTitle, check: editChecked }
        }).done(function (data) {
            if (data == 'yes') {
                form.submit();
            } else {
                $('#slugErr').slideDown().delay(2000).slideUp();
            }
        });

        
    }
});



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

// AUTOCOMPLETES

function split( val ) {
    return val.split( /,\s*/ );
}
function extractLast( term ) {
    return split( term ).pop();
}
$('input[name="jogo"]')
    .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "ui-autocomplete" ).menu.active ) {
            event.preventDefault();
        }
    })
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoGame", {
                query: extractLast( request.term )
            }, response );
        },
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
            var terms = split( this.value );
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push( ui.item.value );
            // add placeholder to get the comma-and-space at the end
            terms.push( "" );
            this.value = terms.join( ", " );
            return false;
        }
    });

$('input[name="outrosAutores"]')
    .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "ui-autocomplete" ).menu.active ) {
            event.preventDefault();
        }
    })
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoAuthor", {
                query: extractLast( request.term )
            }, response );
        },
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
            var terms = split( this.value );
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push( ui.item.value );
            // add placeholder to get the comma-and-space at the end
            terms.push( "" );
            this.value = terms.join( ", " );
            return false;
        }
    });

$('input[name="continuacaoHistoria"]')
    
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoStory", {
                query: extractLast( request.term )
            }, response );
        }
    });

$('input[name="categoriaArtigo"]')
    .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "ui-autocomplete" ).menu.active ) {
            event.preventDefault();
        }
    })
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoArtCat", {
                query: extractLast( request.term )
            }, response );
        },
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
            var terms = split( this.value );
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push( ui.item.value );
            // add placeholder to get the comma-and-space at the end
            terms.push( "" );
            this.value = terms.join( ", " );
            return false;
        }
    });

$('input[name="serieArtigo"]')
    
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoArtSerie", {
                query: extractLast( request.term )
            }, response );
        }
    });

$('input[name="tipoVideo"]')
    
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoTipoVideo", {
                query: extractLast( request.term )
            }, response );
        }
    });


$('input[name="consoles"]')
    .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "ui-autocomplete" ).menu.active ) {
            event.preventDefault();
        }
    })
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoConsoles", {
                query: extractLast( request.term )
            }, response );
        },
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
            var terms = split( this.value );
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push( ui.item.value );
            // add placeholder to get the comma-and-space at the end
            terms.push( "" );
            this.value = terms.join( ", " );
            return false;
        }
    });

$('input[name="generos"]')
    .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "ui-autocomplete" ).menu.active ) {
            event.preventDefault();
        }
    })
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoGeneros", {
                query: extractLast( request.term )
            }, response );
        },
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
            var terms = split( this.value );
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push( ui.item.value );
            // add placeholder to get the comma-and-space at the end
            terms.push( "" );
            this.value = terms.join( ", " );
            return false;
        }
    });

$('input[name="desenvolvedores"]')
    .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "ui-autocomplete" ).menu.active ) {
            event.preventDefault();
        }
    })
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoDes", {
                query: extractLast( request.term )
            }, response );
        },
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
            var terms = split( this.value );
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push( ui.item.value );
            // add placeholder to get the comma-and-space at the end
            terms.push( "" );
            this.value = terms.join( ", " );
            return false;
        }
    });

$('input[name="publicadoras"]')
    .bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "ui-autocomplete" ).menu.active ) {
            event.preventDefault();
        }
    })
    .autocomplete({
        minLength: 2,
        source: function (request, response) {  
            $.getJSON("/autoPub", {
                query: extractLast( request.term )
            }, response );
        },
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
            var terms = split( this.value );
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push( ui.item.value );
            // add placeholder to get the comma-and-space at the end
            terms.push( "" );
            this.value = terms.join( ", " );
            return false;
        }
    });
