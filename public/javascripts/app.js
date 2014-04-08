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

            if ($('#check').html() == 'check') {
                $('#wrapper').empty();
                $('#searchBack').slideDown();
            }
        }
    }).done(function (data) {
        $('body').append(data);
        history.pushState(null, null, '/?t=' + searchStr.toString().replace(',','-'));
        
        $('#gridArticles').waitForImages(function () {
            $("#spinning").hide();
            $('body').css('overflow-y', 'auto');
            container.animate({ 'opacity': 1 });

            if ($('#check').html() == 'check') {
                $('header').removeClass('header row');
                $('#check').remove();
                $('.smallLogo').remove();
            }
            FB.XFBML.parse();
            if(searchStr.length < 1){
                history.pushState(null, null, '/');
                ga('send', 'pageview', '/');
            }else{
                ga('send', 'pageview', '/?t=' + searchStr.toString().replace(',','-'));
            }

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

// 100% videos
$(function() {

	// Find all YouTube videos
	var $allVideos = $("iframe[src^='//www.youtube.com']"),

	    // The element that is fluid width
	    $fluidEl = $("#mainText");

	// Figure out and save aspect ratio for each video
	$allVideos.each(function() {

		$(this)
			.data('aspectRatio', this.height / this.width)
			
			// and remove the hard coded width/height
			.removeAttr('height')
			.removeAttr('width');

	});

	// When the window is resized
	// (You'll probably want to debounce this)
	$(window).resize(function() {

		var newWidth = $fluidEl.width();
		
		// Resize all videos according to their own aspect ratio
		$allVideos.each(function() {

			var $el = $(this);
			$el
				.width(newWidth)
				.height(newWidth * $el.data('aspectRatio'));

		});

	// Kick off one resize to fix all videos on page load
	}).resize();

});

// Analytics specific
/* Page Exit */
    window.onbeforeunload = sendView;
    function sendView(){
        ga('send', 'pageview', '/exit');
    }
