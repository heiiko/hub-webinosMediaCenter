var current = '#startscreen',
    isAnimating = false,
    endCurrPage = false,
    endNextPage = false;

$(document).ready(function() {
   init();
});

function init() {
    $('.pt-page').each(function() {
        var $page = $( this );
        $page.data( 'originalClassList', $page.attr( 'class' ) );
    } );

    $(current).addClass('pt-page-current');
    $('#tosimplebrowserbutton').on('click', function(){ gotoPageById('#browser');
        $('.mainmenu').animate({'width': 'toggle'});
        $('.overlay').animate({'opacity': 'toggle'}, 1000);
     });
    $('#toadvancedbrowserbutton').on('click', function(){ gotoPageById('#browser'); });
    $('#torendererbutton').on('click', function(){ gotoPageById('#renderer'); });
    $('#tocontrollerbutton').on('click', function(){ gotoPageById('#controller'); });
    console.log("buttonsready");
}

function onEndAnimation($outpage, $inpage) {
    endCurrPage = false;
    endNextPage = false;
    resetPage($outpage, $inpage);
    isAnimating = false;
}

function resetPage($outpage, $inpage) {
    $outpage.attr('class', $outpage.data('originalClassList'));
    $inpage.attr('class', $inpage.data('originalClassList') + ' pt-page-current');
}

function gotoPageById(id) {
        console.log("starttransition");
    if (!isAnimating && (current != id)) {
        isAnimating = true;
        var $currPage = $(current);
        var $prevPage = $(id).addClass('pt-page-current'),
            outClass = 'pt-page-scaleDown',
            inClass = 'pt-page-moveFromTop pt-page-ontop';

        current = id;

        $currPage.addClass(outClass).on('webkitAnimationEnd', function() {
            $currPage.off('webkitAnimationEnd');
            endCurrPage = true;
            if (endNextPage) {
                    onEndAnimation($currPage, $prevPage);
            }
        });
        
        $prevPage.addClass(inClass).on('webkitAnimationEnd', function() {
            $prevPage.off('webkitAnimationEnd');
            endNextPage = true;
            if (endCurrPage) {
                    onEndAnimation($currPage, $prevPage);
            }
        });
    }
}
