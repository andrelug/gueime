var container = $('#gridArticles');

var searchStr = [];

tagSearch = function (str) {
    $.ajax({
        type: "GET",
        url: "/tags",
        data: { str: str },
        dataType: 'html',
        beforeSend: function () {
            $("#spinning").show();
            $('body').css('overflow-y', 'hidden');
            container.animate({ 'opacity': 0 }).remove();
            $("html, body").animate({ scrollTop: 0 }, "slow");
        }
    }).done(function (data) {
        $('body').append(data);
        $('#gridArticles').waitForImages(function () {
            $("#spinning").hide();
            $('body').css('overflow-y', 'auto');
            container.animate({ 'opacity': 1 });

        }, null, true);
    });
}

$('#mainInput').keypress(function (event) {
    if (event.keyCode == 13) {
        $('#tagSelection').append('<span>' + $(this).val() + '<a class="tag" id="' + $(this).val() + '">x</a></span>');
        // execute search
        searchStr.push($(this).val());
        console.log(searchStr);
        tagSearch(searchStr);

        $(this).val('');



        // Ajax Busca na página de artigo
        if ($('#check').html() == 'check') {
            history.pushState(null, null, '/');
            $.ajax({
                type: "GET",
                url: '/busca',
                dataType: 'html',
                beforeSend: function () {
                    $('#wrapper').fadeOut();
                    $('body').css('background-color', 'white');
                    $('#searchBack').slideDown();
                }
            }).done(function (data) {
                $('#wrapper').fadeIn().html(data);
                $('header').removeClass('header row');
                $('body').css('background-color', '#ecf0f1');
                $('#check').remove();
            });

        }
    }

});

$(document).on('click', '.tag', function () {
    var id = $(this).attr('id');
    var remove = searchStr.indexOf($("#" + id).parent().html().replace('<a class="tag" id="'+id+'">x</a>', ''));
    searchStr.splice(remove, 1);
    tagSearch(searchStr);
    $("#" + id).parent().remove();
});


// Opening Overlay
$(document).on('click', 'a', function () {
    if ($(this).data("link") == "ajax") {
        console.log("data link correto");
        var ajaxUrl = $(this).attr('href');
        ajaxPage(ajaxUrl);
        history.pushState(null, null, ajaxUrl);
        ga('send', 'pageview', ajaxUrl);
        return false;
    }
});



var ajaxPage = function (url) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: 'html',
        beforeSend: function () {
            $('body').css('overflow-y', 'hidden');
            $('#darken').css('display', 'block');
            $('.content-wrap').fadeIn();

        }
    }).done(function (data) {

        $('.content').html(data);
        $('#loading').delay(500).waitForImages(function () {
            $('#spinningContent').fadeOut(500);
            $('#loading').animate({ 'opacity': 1 }, function () {


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



        });
    });
}


// Closing Overlay

$(document).on('click', '.exit', function () {
    $('.content-wrap').fadeOut();
    $('body').css('overflow-y', 'auto');
    $('#darken').css('display', 'none');
    window.history.go(-1);
    $('.content').empty();
    ga('send', 'pageview', '/');
});

// Typeahead

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;
 
    // an array that will be populated with substring matches
    matches = [];
 
    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');
 
    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        // the typeahead jQuery plugin expects suggestions to a
        // JavaScript object, refer to typeahead docs for more info
        matches.push({ value: str });
      }
    });
 
    cb(matches);
  };
};

var states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii',
  'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
  'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

$('#suggestion .typeahead').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'states',
  displayKey: 'value',
  source: substringMatcher(states)
});