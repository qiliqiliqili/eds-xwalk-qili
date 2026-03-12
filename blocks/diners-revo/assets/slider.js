window.addEventListener('load', function () {
  var current_bp = window.innerWidth > 768 ? "pc" : "sp";

  $(".dc__carousel").each(function(){

    var $container = $(this);
    var $slider = $(this).find(".slider");
    var slide_to_show = $container.data("num_diaplay") || 1;
    var autoplay_interval = $container.data("autoslide_interval") || 0;
    var should_autoplay = (autoplay_interval > 0);
    var num_slide = $container.find(".dc__slider_cell").length;
    $container.data("num_slide", num_slide);
    $slider.slick({
      autoplay: should_autoplay,
      autoplaySpeed: autoplay_interval,
      slidesToShow: slide_to_show,
      slidesToScroll: slide_to_show,
      arrows:false,
      responsive: [
        {
          breakpoint: 769,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1
          }
        }
      ]
    });

    if(slide_to_show > 1) {
      //set margin
      $slider.find(".dc__slider_cell").addClass("dc__multicell");
      $slider.find(".slick-list").addClass("multicell")
    }

    $slider.on("afterChange", function(e, slick){
      var i = slick.slickCurrentSlide();
      if(slick.options.slidesToShow > 1) {
        i /= slick.options.slidesToShow;
      }
      $container.find(".dc__slider_dots li a").removeClass("dc__active");
      $container.find(".dc__slider_dots li").eq(i).find("a").addClass("dc__active");
    });

    $container.find(".dc__slider_prev").on("click", function(e){
      e.preventDefault();
      $slider.slick("slickPrev");
    });

    $container.find(".dc__slider_next").on("click", function(e){
      e.preventDefault();
      $slider.slick("slickNext");
    });

    //内容が一件の場合、左右送りボタンとインジケータ非表示
    if($container.find(".dc__slider_cell").length == 1) {
      $container.find(".dc__slider_arrow").hide();
      $container.find(".dc__slider_dots").hide();
    }

    onBreakPoint();
  });

  $(window).on("resize", function(){
    if(current_bp == "sp" && window.innerWidth > 768) {
      current_bp = "pc";
      onBreakPoint();
    } else if(current_bp == "pc" && window.innerWidth <= 768) {
      current_bp = "sp";
      onBreakPoint();
    }

  }).trigger('resize');

  function onBreakPoint() {
    $(".dc__carousel").each(function(){
      var $container = $(this);
      var $slider = $(this).find(".slider");
      var slide_to_show = $container.data("num_diaplay") || 1;
      var num_slide = $container.data("num_slide");
      var $idc_container = $container.find(".dc__slider_dots");
      var active_index = $idc_container.find(".dc__active").parent().index() / num_slide;
      if(current_bp == "sp") {
        slide_to_show = 1;
      }

      //set indicator
      $idc_container.empty();
      var len = (current_bp == "pc") ? num_slide / slide_to_show : num_slide;
      for (var i=0; i < len; i++) {
        var $idc = $('<li><a href="javascript:void(0);">' + (i + 1) + '</a></li>');
        if(i == 0) {
          $idc.children("a").addClass("dc__active");
        }
        $idc_container.append($idc);
      }

      $container.find(".dc__slider_dots li").on("click", function(e){
        e.preventDefault();
        var i = $(this).index() * slide_to_show;
        $slider.slick("slickGoTo", i);
      });

      if(slide_to_show > 1) {
        $slider.find(".dc__slider_cell").addClass("dc__multicell");
        $slider.find(".slick-list").addClass("multicell");
      } else {
        $slider.find(".dc__slider_cell").removeClass("dc__multicell");
        $slider.find(".slick-list").removeClass("multicell");
      }

    });

  }//onBreakPoint


}, false);
