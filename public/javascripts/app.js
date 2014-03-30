var nav = $('#nav-sticky'),
    nav_sticky = nav.offset().top; //get the Y-position of section


$(window).on({
    scroll:function(){ // fires when user scrolls
        var current_position = window.pageYOffset; // get the current window Y-Position
        if( current_position > nav_sticky ) {
            nav.addClass('sticky');
            $('#slideshow').css('margin-top',45); // add class to make the nav sticky using css
        } else {
            nav.removeClass('sticky');
            $('#slideshow').css('margin-top',0); // remove sticky css class
        }
    }
});

