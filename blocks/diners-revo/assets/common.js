$(function(){

  /* header,footer */
  (function() {
    const pathname = window.location.pathname;
    const cookieRemovePages = [
      '/ja/pvt.html',
      '/ja/cardlineup.html',
      '/ja/cardlineup/comparison.html'
    ];
    for (let i = 0; i < cookieRemovePages.length; i++) {
      if (pathname === cookieRemovePages[i]) {
        Cookies.remove('corporateKey', { path: '/' }); //サブドメイン指定あり
        Cookies.remove('corporateKey', { domain:"diners.co.jp",path: "/" }); //サブドメイン指定なし
        break;
      }
    }
    if (pathname === '/ja/corporate.html' || pathname.indexOf('/ja/corporate/') !== -1) {
      Cookies.set("corporateKey", "on", { domain:"diners.co.jp",path: "/" });
    }

    const cookie = siteCookieChecker();
    if (cookie) {
      if (cookie['corporateKey'] === 'on') {
        $('.js-switch-regular').remove();
        $('.dc__corporate_display').css('display', 'block');
        $('.dc__corporate_display_inline').css('display', 'inline-block');
      } else {
        $('.js-switch-corporate').remove();
        $('.dc__regular_display').css('display', 'block');
        $('.dc__regular_display_inline').css('display', 'inline-block');
      }
    }
  })();

  /* dc__share */
  $(".btn_share").on("click", function(){
    $(this).next(".dc__share").slideToggle();
  });

  if($("#dc__dctop").length == 1) {
    var footer_height = $("footer").height() - 10;
    $("#dc__dctop").css("background-position", "center bottom " + footer_height + "px");
  }
  $(window).on("resize", function(){
    if($("#dc__dctop").length == 1) {
      var footer_height = $("footer").height() - 10;
      $("#dc__dctop").css("background-position", "center bottom " + footer_height + "px");
    }
  });

  /* dropdown */
  $(".dc__dropdown .dc__btn_menu").on("click", function(){
    var $scope = $(this).parent(".dc__dropdown");
    $(".dc__dropdown .dc__btn_menu").removeClass("dc__active");
    $(this).addClass("dc__active");
    if($scope.children(".dc__dropdown_box").is(":visible")) {
      $scope.children(".dc__dropdown_box").slideUp(200);
      $(this).removeClass("dc__active");
      return false;
    }
    if($(".dc__dropdown_box:visible").length > 0) {
      $(".dc__dropdown_box:visible").slideUp(200, function(){
        $scope.children(".dc__dropdown_box").slideToggle();
      })
    } else {
      $scope.children(".dc__dropdown_box").slideToggle();
    }
  });
  $(".dc__close_dropdown").on("click", function(){
    $(this).parent(".dc__dropdown_box").slideUp(200);
    $(".dc__dropdown .dc__btn_menu").removeClass("dc__active");
  });

  $(document).on('click', function(e){
    if ($(e.target).parents('.dc__diners_header').length !== 0 || $(e.target).parents('.dc__premium_header').length) return;
    if ($(".dc__dropdown_box:visible").length === 0) return;

    $(".dc__dropdown_box:visible").slideUp(200);
  });

  $(".sp_dropdown").on("click", function(){
    $(this).children(".dc__sp_dropdown_box").slideToggle();
  });

  /* dc_search */
  //180807 閉じるボタンを削除して検索ボタンを追加
  $("span#dc__search_input_close").after(' <button type="submit" class="dc__search_inlineblock dc__search_input_submit"><img class="dc__icon-w_18 dc__icon-h_18" src="/content/dam/diners/img/common/icon_search_white.png" alt="SEARCH" title="SEARCH"></button>');
  $("span#dc__search_input_close").remove();

  //210622 検索フォームに追加ステータス
  $('[name="search_form"], [name="form_search_area"]').append('<input type="hidden" name="mm" value="">');

  //210622 ステータスに応じてvalue変更
  const SITE_COOKIE = siteCookieChecker();
  const rank = cardRunkChecker(SITE_COOKIE);
  let mmInputValue;
  if(rank === 'premium') {
    mmInputValue = 'dp';
  } else if (rank === 'royalPremium') {
    mmInputValue = 'rp';
  } else {
    mmInputValue = '';
  }

  $('[name="search_form"], [name="form_search_area"]').find('input[name="mm"]').val(mmInputValue);

  $(".dc__btn_search").on("click", function(e){
    e.preventDefault();
    if($(".dc__searchbox input").data("init") == undefined) {
      $(".dc__searchbox input").attr("style", "background-color:#efefef !important");
      $(".dc__searchbox input").attr("placeholder", "サイト内検索");
      $(".dc__searchbox input").data("init", true);
    }
    $("#dc__search_input_close").hide();
    $("#dc__search_input_close").stop().delay(200).fadeIn(600);
    $("#dc__search_input_container").css("left", "450px");
    $("#dc__search_input_container").stop().delay(400).animate({left:"24px"}, 450, function(){
      $(".dc__searchbox input").trigger("focus");
    });

    var $parent = $(".dc__searchbox").parent();
    var container_width = $(this).parents(".dc__right").width();
    if(container_width < 400) {
      container_width = 400;
      $(this).parents(".dc__right").width(400)
    }
    var btn_left = $(".dc__btn_search").position().left;
    var right = container_width - btn_left - 40;
    $(".dc__searchbox").css("right", right);
    $(".dc__searchbox").css("display", "block");
    $(".dc__searchbox").css("width", "0rem");
    $(".dc__searchbox").animate({width:"400px"}, 450, function(){
      $(window).on("click", function(e){
        if($(e.target).is(".dc__searchbox input, li.sug_element, a, button, button img") || $(e.target).parents(".gsq_a").length > 0) return; //180717 クリックで閉じる不具合を修正
        var $result = $(e.target).parents(".gsc-results-wrapper-overlay");
        if( $result.length > 0) {
          return;
        }
        e.preventDefault();
        $(".dc__searchbox input").val("");
        $(".dc__searchbox").fadeOut(200);
        $(window).off("click");
      });
    });
  });

  /* accordion */
  $(".dc__btn_accordion").on("click", function(){
    //PC版のdc__tabsの中にある場合、アコーディオンの開閉に合わせてdc__tabsの高さを変える
    if($(this).parents(".dc__tabs").length > 0 && window.innerWidth > 768) {
      $tab = $(this).parents(".dc__tabs");
      var tab_height = $tab.height();
      var $box = $(this).next(".dc__accordion_box");
      var target_height;
      if($box.is(":visible") == false) {
        $box.css("display", "block");
        target_height = tab_height + $box.outerHeight();
        $box.css("display", "none");
      } else {
        target_height = tab_height - $box.outerHeight();
      }
      var $box = $(this).parents(".dc__tab_box");
      $tab.animate({height:target_height}, {duration:400, complete:function(){
      }});
    }

    var $accordionBtn = $(this);
    var $tabs = $(this).next().find('.dc__tabs');

    $(this).toggleClass("dc__active");
    $(this).toggleClass("icon_plus");
    $(this).toggleClass("icon_minus");
    $(this).next(".dc__accordion_box").slideToggle(400, function(){
      $(window).trigger("resize");
    });
  });

  /* accordion */
  $(".dc__search_nav_ac").on("click", function(){
    $(this).toggleClass("dc__active");
    $(this).next(".dc__search_nav_ac_box").slideToggle();
  });


  /* accordion */
  $(".dc__btn_accordion02").on("click", function(){
    $(this).toggleClass("dc__active");
    $(this).next(".dc__accordion_box02").slideToggle();
  });

  /* accordion init in open */
  $(".dc__btn_accordion.dc__accordion_open").each(function(){
    $(this).addClass("icon_minus");
    $(this).removeClass("icon_plus");
    $(this).addClass("dc__active");
    $(this).next(".dc__accordion_box").show();
  });

  /* accordion hashtag */
  var hash = location.hash;
  var $acc = $(hash);
  if($acc.length == 1 && $acc.hasClass("dc__btn_accordion")) {
    $acc.addClass("icon_minus");
    $acc.removeClass("icon_plus");
    $acc.addClass("dc__active");
    $acc.next(".dc__accordion_box").show();
  }


  /* dc__tabs */
  var w = window.innerWidth;
  var x = 768;

  $(".dc__tabs").each(function(){
    if (x < w || $(this).hasClass("dc__tab_typeb")) {
      var $scope = $(this);

      $(window).on("load", function() {
        if($scope.length) {
        var tab_height = $scope.find(".dc__tab_btn.dc__active").outerHeight(true);
        var box_height = $scope.find(".dc__tab_box.dc__active").innerHeight();
        var height = tab_height + box_height;
        $scope.css("height",height+"px");
      }});
      $(window).on("resize", function(){
        if($scope.length) {
        var tab_height = $scope.find(".dc__tab_btn.dc__active").outerHeight(true);
        var box_height = $scope.find(".dc__tab_box.dc__active").innerHeight();
        var height = tab_height + box_height;
        $scope.css("height",height+"px");
      }});
    }
  });

  var current_device = window.innerWidth > 768 ? "pc" : "sp";

  $(window).on("resize", function(){
    $(".dc__tabs").each(function(){
      if(window.innerWidth <= 768) {
        if($(this).hasClass("dc__tab_typeb") == false) {
          $(this).attr("style", "height:auto");
        }
        current_device = "sp";
      } else {
        if(current_device != "pc") {
          // $(this).find(".dc__tab_btn").removeClass("dc__active");
          // $(this).find(".dc__tab_box").hide();
          // $(this).find(".dc__tab_btn").eq(0).addClass("dc__active");
          // $(this).find(".dc__tab_box").eq(0).show();
        }
        current_device = "pc";
      }
    });
  }).trigger("resize");

  $(document).on('click', '.dc__tab_btn', function() {
    var w = window.innerWidth;
    var x = 768;
    var target = this.id;

    if($(this).parent('.dc__tabs_disabled').length > 0) return;
    //SP版タブ表示フラグ
    var is_tab_typeb = $(this).parent('.dc__tabs').hasClass('dc__tab_typeb');
    if (x < w || is_tab_typeb) {
      $(this).parent('.dc__tabs').children(".dc__tab_box").removeClass('dc__active');
      $(this).next(".dc__tab_box").addClass('dc__active');
      $(this).parent('.dc__tabs').children('.dc__tab_btn').removeClass('dc__active');
      $(this).addClass('dc__active');
      var tabheight = $(".dc__tab_box.dc__active").innerHeight();
      var tab_height = $(this).innerHeight();
      var box_height = $(this).next(".dc__tab_box").innerHeight();
      var height = tab_height + box_height;
      $(this).parent('.dc__tabs').css("height",height+"px");

      // アコーディオン内のタブのとき
      if ($(this).parents('.dc__accordion_box').length > 0) {
        var $accordionBox = $(this).parents('.dc__accordion_box');
        $accordionBox.css('height', '');
      }

      // SP版dc__menu_2ndのテキスト修正
      // /ja/cpn_env.htmlのみ
      (function (_this) {
        var $this = $(_this);
        var title = $("#dc__menu_2nd h3").find("a").text();
        var tab_title = $this.text();

        if (/\s\/\s.+$/.test(title) && /cpn_evt\.html$/.test(location.pathname)) {
          title = title.replace(/\s\/\s.+$/, '') + " / " + tab_title;

          $("#dc__menu_2nd h3").find("a").text('').text(title);
        }
      })(this);

    } else if (w <= x) {
      $(this).next().slideToggle();
      $(this).toggleClass('dc__active');
    }

    if ($('#dc__menu_2nd .dc__btn_menu').length > 0 && this.id !== '') {
      var target2ndAnchor = null;

      $('#dc__menu_2nd a.dc__btn_menu').each(function (index, el) {
        if (el.hash.replace(/^#/, '') === target) {
          target2ndAnchor = el;
        }
      });

      if (target2ndAnchor !== null) {
        $('#dc__menu_2nd .dc__btn_menu').removeClass('dc__active');
        $(target2ndAnchor).addClass('dc__active');
      }
    }
  });

  //編集用
  var offset_height = 40;
  $(".dc__tabs_editing .dc__tab_box").each(function(){
    $(this).css("display", "block");
    $(this).css("top", offset_height);
    offset_height += $(this).outerHeight();
    $(".dc__tabs_editing").parent().height(offset_height);
  });

  //tab hashtag
  var hash = location.hash;
  var $tab = $(hash);
  if($tab.length == 1 && $tab.hasClass("dc__tab_btn")) {
    $tab.parent('.dc__tabs').children(".dc__tab_box").removeClass('dc__active');
    $tab.next(".dc__tab_box").addClass('dc__active');
    $tab.parent('.dc__tabs').children('.dc__tab_btn').removeClass('dc__active');
    $tab.addClass('dc__active');
    if ($(window).width() > 768) {
      $tab.trigger('click');
    }
    else {
      if ($tab.parents('.dc__tabs').hasClass('dc__tab_typeb')) {
        $tab.trigger('click');
      }
    }
  }

  /* default hashtag */
  var $target = $(hash);
  if($target.length > 0) {

	  var $imgs = $('img');
	  var maxCount = $imgs.length;
	  var count = 0;
	  var scroll = function(isLoad){
		  if (isLoad) {
			  count ++;
		  }
		  else {
			  maxCount --;
		  }

		  if (count >= maxCount - 1) {
        $(window).scrollTop(0);

        var $target = $(location.hash);
			  var offset = 0;

			  if ($(window).width() > 768) {
			    // offset += ($('#dc__menu_1').length !== 0) ? $('#dc__menu_1').height() : 0;
			    offset += ($('#dc__menu_2').length !== 0) ? $('#dc__menu_2').height() : 0;
			    offset += ($('#dc__menu_2nd').length !== 0) ? $('#dc__menu_2nd').height() : 0;
				  offset = -1 * offset;
			  }
			  else {
				if( typeof $('#dc__menu_1').height() !== 'undefined' )  offset = -1 * $('#dc__menu_1').height();
			  }

			  var y = $target.offset().top + offset;
			  $("html, body").animate({
				  scrollTop: y
			  });
		  }
	  };

	  $imgs.each(function(){
		  var newImage = new Image();
		  newImage.onload = function () {
			  scroll(true);
		  };
		  newImage.onerror = function () {
			  scroll(false);
		  };
		  newImage.src = this.src;
	  });
  }

  /* modal */
  $(document).on("click", ".btn_modal", function() {
    var $modal = $(this).next(".dc__modal_content");
    $modal.show();
    var $content = $modal.find(".dc__content_box");
    var gap = (window.innerWidth > 768) ? 254 : 280;
    var margin = (window.innerWidth > 768) ? "70px" : "10px";
    var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    if($modal.data("prefered_gap") > 0) {
      gap = $modal.data("prefered_gap");
    }

    var ch = window.innerHeight - gap;
    ch = Math.max(ch, 280);
    if($content.height() > ch) {
      $content.height(ch);
      $content.css("overflow-y", "scroll");
      $content.css("width", "100%");
      $content.css("position", "relative");
      $content.css("top", -3);
      $content.parent().css("margin-top", margin);
    }
    $modal.hide();
    $modal.fadeIn(400);
  });

  $(window).on("orientationchange", function(e) {
    var $modal = $(".dc__modal_content:visible");
    if($modal.length == 0) return;
    var $content = $modal.find(".dc__content_box");
    var angle = (screen && screen.orientation && screen.orientation.angle) || window.orientation || 0;
    var gap = (window.innerWidth > 768) ? 254 : 280;
    var ch = window.innerHeight - gap;
    ch = Math.max(ch, 280);
    if($content.height() > ch) {
      $content.height(ch);
    }
  })
  $(document).on('click', '.dc__modal_box .icon_close', function(e) {
    e.preventDefault();
    $(this).parents(".dc__modal_content").fadeOut(250, function(){
      $(this).find(".dc__content_box").css("height", "auto");
    });
  });

  //2017.11.13 add.
  $(document).on('click', '.dc__modal_box .btn_back,.dc__modal_box .btn_go', function(e) {
    $(this).parents(".dc__modal_content").fadeOut(250, function(){
      $(this).find(".dc__content_box").css("height", "auto");
    });
  });
  //

  $(document).on("click", ".dc__modal_content", function(e) {
    //e.preventDefault();
    if($(e.target).hasClass("dc__modal_content")){
      var $scope = $(this);
      $(this).fadeOut(250, function(){
        $(this).find(".dc__content_box").css("height", "auto");
      });
    }
  });

  /*
   * navigation indicator
   */

  var root = "/ja/";
  var path = location.href.split(root)[1] || "";
  var dir1 = path.split("/")[0];
  var dir2 = path.split("/")[2];
  var dir3 = path.split("/")[3];
  //dir1
  if(dir1 && dir1.length > 0) {
    $("#dc__menu_2 .dc__dropdown>a").each(function(){
      var href = $(this).attr("href");
      if(href.indexOf(root) == -1) return true;
      var p = href.split(root)[1].split("/")[0];
      if(p == dir1) {
        $(this).addClass("dc__active_typeb");
        return false;
      }
    });
  }
  $("#dc__menu_2 .dc__dropdown>a").on("click", function(e){
    e.preventDefault();
  });

  if (typeof navigationParams !== 'undefined') {
	  // add active class name to second navigation
	  if (navigationParams.second !== '') {
		  if ($('#dc__menu_2nd').length !== 0) {
        if ($('#dc__menu_2nd .dc__btn_menu.dc__active').length === 0) {
          $('#dc__menu_2nd .dc__btn_menu').each(function () {
            var current = $(this).data('current');
            if (current === navigationParams.second) {
              $(this).addClass('dc__active');

              if ($('#dc__menu_3rd').length !== 0) {
                $(this).addClass('icon_has_child');
              }
            }
          });
        }
		  }
	  }
	  else {
		  // if second navigation dont have active class,
		  // remove third navigation at sp view.
		  if ($(window).width() < 768) {
			  $('#dc__menu_3rd').css({
				  display: 'none'
			  });
		  }
	  }

	  // add active class name to third navigation
	  if (navigationParams.third !== '') {
		  if ($('#dc__menu_3rd').length !== 0) {
			  $('#dc__menu_3rd .dc__btn_menu').each(function () {
				  var current = $(this).data('current');
				  if (current === navigationParams.third) {
					  $(this).addClass('dc__active');
				  }
			  });
		  }
	  }
  }


  /* MENU-2ND-01 */
  $('#dc__menu_2nd .dc__here').on("click", function(e){
    var $scope = $(this);
    var $container = $(this).parents(".dc__fixed_content");
    var is_3rd_open = $(".dc__3rd_open").length > 0;

    if(is_3rd_open) {
      if(e.pageX < 50) {
        //close 3rd menu
        var w = $(window).width();
        $(".dc__3rd_open").animate({
          left:w
        }, function(){
          $scope.removeClass("icon_angle_left");
          $(".dc__3rd_open").removeClass("dc__3rd_open");
        })
        $container.animate({
          height:$container.data("second_menu_height")
        }, function(){
          $container.css("height", "auto");
        });
      } else {
        //close menu with 3rd menu
        var menu_is_open = ($container.height() > 60);
        var container_height = menu_is_open ? 60 : $container.data("third_menu_height");
        $container.animate({
          height:container_height
        }, function(){
          if(menu_is_open){
            $scope.removeClass("icon_angle_left");
          } else {
            $scope.addClass("icon_angle_left");
          }
        });
      }
    } else {
      //close menu with 2nd menu
      $(this).next(".dc__menu_list").slideToggle();
    }
    //default menu toggle
    $(this).children("a").toggleClass("icon_after_angle_down").toggleClass("icon_after_angle_up")
  });

  /* MENU-2ND-01 toggle 3rd menu */
  $('#dc__menu_2nd .dc__btn_menu.icon_has_child').on('click', function(e) {
	  if(window.innerWidth > 768) return;
	  e.preventDefault();
	  $(this).parents("#dc__menu_2nd").find(".dc__here").addClass("icon_angle_left");
    var $container = $(this).parents(".dc__fixed_content");
    var $parent = $(this).parents("ul");
    var $child = $(this).next();
    var w = $(window).width();
    $parent.css("position", "relative");
    $child.addClass("dc__3rd_open");
    $child.show();
    $child.css("position", "absolute");
    $child.css("left", w);
    $child.css("top", 0);
    var gap = $child.height() - $parent.height();
    var container_org_height = $container.data("second_menu_height") || $container.height();
    $container.css("overflow", "hidden");
    $container.data("second_menu_height", container_org_height);
    $container.data("third_menu_height", container_org_height + gap);
    $container.animate({
      height:container_org_height + gap
    });
    $child.animate({
      left:0
    })
  });

  /* MENU-2ND-01 init 3rd menu */
  $(window).on("resize", function(){
    var $2nd_menu = $("#dc__menu_2nd .icon_has_child");
    if(window.innerWidth <= 768) {
      $2nd_menu.each(function(){
        var $3rd_menu = $("#dc__menu_3rd .dc__menu_list");
        $(this).after($3rd_menu);
      });
    } else {
      $2nd_menu.each(function(){
        if($(this).next(".dc__menu_list").length == 1) {
          var $3rd_menu = $(this).next(".dc__menu_list");
          var $3rd_menu_con = $("#dc__menu_3rd");
          var $container = $(this).parents(".dc__fixed_content");
          $3rd_menu.removeAttr("style");
          $container.removeAttr("style");
          $3rd_menu_con.append($3rd_menu);
        }

      });
    }
  }).on('scroll', function () {
    if($(this).width() <= 768) return;

    if ($('#dc__menu_2nd .dc__menu_list a').length > 0) {
      $('#dc__menu_2nd .dc__menu_list a').each(function () {
        var this_hash = $(this).get(0).hash;
        var this_pathname = $(this).get(0).pathname;
        var hash = location.hash;
        var pathname = location.pathname;
        // var offsetY = ($(window).width() > 768) ? -121 : -20;
        var offsetY = ($('.dc__diners_header').length !== 0) ?
          - ($('.dc__diners_header').height() + $('#dc__menu_2nd').height()) :
          - ($('.dc__premium_header').height() + $('#dc__menu_2nd').height());

        if (this_hash !== '' && $(this_hash).length !== 0 && this_pathname === pathname && $(this_hash).hasClass('dc__tab_btn') === false && $(this_hash).hasClass('dc__btn_accordion') === false) { //1807修正
          if ( $(window).scrollTop() >= $(this_hash).position().top + offsetY) {
            $('#dc__menu_2nd .dc__menu_list a').removeClass('dc__active');
            $(this).addClass('dc__active');
          }
        }
      });
    }
  })
  .trigger("resize");

  //2nd menu title
  $("#dc__menu_2nd h3").each(function(){
    var title = $(this).find("a").text();
    var title_3rd = $("#dc__menu_2nd .dc__menu_list .dc__active span").eq(0).text();
    if (title !== title_3rd) {
	    if (title_3rd.length > 0) {
		    title += " / " + title_3rd;
	    }
	    $(this).find("a").text(title);
    }
  });


  /* SIG-NAV-02 */
  $('.dc__sig_nav02 .dc__here').each(function(){
    $(this).next(".dc__menu_list_02").hide();
  });
  $('.dc__sig_nav02 .dc__here').on("click", function(e){
    $(this).next(".dc__menu_list_02").slideToggle();
    $(this).children("a").toggleClass("icon_angle_down_right_").toggleClass("icon_angle_up_right_");
  });

  /* dc__search_list */
  $(".dc__btn_search_list").on("click", function(){
    $(this).next(".dc__search_list").slideToggle();
  });


  /* page-scroll */
  // $('.page-scroll').bind('click',function(t){
  //   var e = $(this);
  //   var y = ($(e.attr('href')).length > 0) ? $(e.attr('href')).offset().top : 0;
  //   if(e.attr('href') == '#top') y = 0;
  //   $('html, body').stop().animate({scrollTop:y}, 1600, 'easeInOutExpo'), t.preventDefault()}
  // );

  /* anchor */
	$(document).on('click', 'a', function (e) {
		if(this.hash.length === 0) return true;
		if(this.pathname !== location.pathname) return true;

		e.preventDefault();
		var $target = $(this.hash + ":visible") || $("body");
    var targetTop = $target.length > 0 ? $target.offset().top : 0;
		// var offsetY = ($(window).width() > 768) ? -121 : -20;

    var offsetY;
    if ($(window).width() > 768) {
//	    offsetY = - ($('#dc__menu_2').height() + $('#dc__menu_2nd').height());
      if( typeof $('#dc__menu_2nd').height() !== 'undefined' ){
        offsetY = -( $('#dc__menu_2').height() + $('#dc__menu_2nd').height() );
      }else if( typeof $('#dc__menu_2').height() !== 'undefined' ){
        offsetY = -($('#dc__menu_2').height());
      }else{
        offsetY = 0;
      }
    }
    else {
      if( typeof $('#dc__menu_1').height() !== 'undefined' ) {
        offsetY = -($('#dc__menu_1').height());
      }else{
        offsetY = 0;
	  }
    }

		if ($target.hasClass('dc__tab_btn')) {
			$target.trigger('click');

			// dc__menu_2ndのとき、current変更
      if ($(this).parents('#dc__menu_2nd').length !== 0) {
        $(this).parents('#dc__menu_2nd').find('.dc__btn_menu').removeClass('dc__active');
        $(this).addClass('dc__active');
      }
		}
		else {
			if (this.hash === '#top') {
				var targetY = offsetY;
			}
			else {
				if ($target.length !== 0) {
					if ($target.offset().top < $(window).scrollTop()) {
						if ($(window).width() > 768) {
//							offsetY = - ($('#dc__menu_1').height() + $('#dc__menu_2').height() + $('#dc__menu_2nd').height());
							if( typeof $('#dc__menu_2nd').height() !== 'undefined' ){
								offsetY = - ($('#dc__menu_1').height() + $('#dc__menu_2').height() + $('#dc__menu_2nd').height());
							}else if( typeof $('#dc__menu_2').height() !== 'undefined' ){
								offsetY = - ($('#dc__menu_1').height() + $('#dc__menu_2').height()  );
							}
						}
						else {
							 if( typeof $('#dc__menu_1').height() !== 'undefined' ) offsetY = -($('#dc__menu_1').height());
						}
					}

          // dc__menu_2ndのとき、dc__menu_2ndを閉じ、閉じた分を再計算
          if ($(window).width() <= 768) {
            if ($(this).parents('#dc__menu_2nd').length !== 0) {
              offsetY -= $(this).parents(".dc__menu_list").height();
              $(this).parents(".dc__menu_list").slideUp();
            }
          }
          else {
            if ($(this).parents('.dc__dropdown_box').length !== 0) {
              $(this).parents('.dc__dropdown_box').slideUp();
            }
          }
				}

				var targetY = targetTop + offsetY
			}
			$("html, body").stop().animate({scrollTop:targetY}, 600, "swing", function(){
        $(window).trigger("scroll");
      });
    }
	});

  /* hash tag */
  // if(location.hash.length > 0 && $(location.hash).length > 0) {
  //   var $target = $(location.hash);
  //   var offset = ($(window).width() > 768) ? -140 : -50;
  //   var y = $target.offset().top + offset;
  //   $("html, body").scrollTop(y);
  // }

  // spmanu slide
  $("#jsi_sp_nav").on("click", function(){
    $(this).parents("header").children(".dc__sp_menu").slideToggle();
    $(this).toggleClass("dc__active");
    var btn_text = ($("#jsi_sp_menu_text").text() == "メニュー") ? "閉じる" : "メニュー";
    $("#jsi_sp_menu_text").text(btn_text);
  });
  $(".sp_btn_menu").on("click", function(){
    $(this).toggleClass("icon_plus");
    $(this).toggleClass("icon_minus");
  });
  $("#spwrap").on('click','.dc__active',function(){
    $("#spwrap").fadeOut();
    $("#menu-btn").removeClass("dc__active");
    $("#menu-web").removeClass("dc__active");
    $("#panel-btn-icon").removeClass("dc__close");
  });
  $(".dc__sp_dropdown_box li").on("click", function(e){
    $(this).parents(".dc__sp_dropdown_box").prev().removeClass("icon_minus").addClass("icon_plus");
    $('#jsi_sp_menu').trigger('click');
  });
  $(window).on("resize", function(){
    if($(this).width() > 768) {
      $("div.dc__sp_menu").hide();
    }
    //menu container height
    var wh = $(window).innerHeight();
    var hh = 50;
    $(".dc__sp_menu").height(wh - hh);
  }).trigger("resize");

  /* dc__menu_3rd bg */
  if($("#dc__menu_3rd").length > 0) {

    var header_height = $("#dc__menu_1").outerHeight() + $("#dc__menu_2").outerHeight() + $("#dc__menu_2nd").outerHeight();
    var footer_height = $("footer").outerHeight();
    var menu_title_height = $(".dc__category_title").outerHeight();
    var menu_height = $("#dc__menu_3rd ul").outerHeight();
    var all_height = header_height + footer_height + menu_title_height + menu_height;

    $(window).on("resize", function(){

      if(window.innerWidth <= 768) return;
      var menu_3rd_bottom = $("#dc__menu_3rd").offset().top + $("#dc__menu_3rd").height();

      //footer position
      var footer_top = $("footer").offset().top;
      if(footer_top < menu_3rd_bottom && $("#dc__menu_3rd").data("stretched") != true) {
        var pos = menu_3rd_bottom - $("footer .dc__footer_menu").offset().top - 10;
        $("footer").css("position", "relative");
        $("footer").css("top", pos);
      }

      //3rdメニュー背景を下まで伸ばす
      $("#dc__menu_3rd ul").css("padding-bottom", 0);//正しいドキュメントの高さを得るためいったんパディングを0にする
      var padding = Math.max(0, $(document).height() - all_height + 150);
      $("#dc__menu_3rd ul").css("padding-bottom", padding);
      $("#dc__menu_3rd").data("stretched", true);

    }).trigger("resize");

    var doc_height = $(document).height();
    setInterval(function(){
      var cheight = $(document).height();
      if(doc_height != cheight) {
        $(window).trigger("resize");
        doc_height = cheight;
      }
    }, 500);

  }

  /* close button */
  $(".dc__btn.dc__close_window").on("click", function(e){
    e.preventDefault();
    window.close();
  });

  /* print button */
  $(".dc__btn.icon_print").on("click", function(e){
    e.preventDefault();
    window.print();
  });

  //クラブ・オンラインへ遷移した回数カウント 202504修正
  $("#diners01, .mainVisual .dc__btn_blue, #diners04").on("click", function(){
    var count = Number(Cookies.get("col_signon_count"));
    if(!count) count = 0;
    count++;
    Cookies.set("col_signon_count", count, { expires: 365, path: "/" });
  });

  //201909追記　EDMからのアクセスもクラブ・オンラインへ遷移したときと同様のCookieをセット
  if(location.search.indexOf("mid=") > -1) {
	Cookies.set("col_signon_count", 1, { expires: 365, path: "/" });
  }

  //最終閲覧ページ
  var array_dir = location.pathname.split(/[\/\.]/);
  if (array_dir[2] !== '' && array_dir[2] !== 'index' && array_dir[2] !== 'pvt') {
    Cookies.set("last_browse_category", array_dir[2], { expires: 90, path: "/" });
  }


  //表示数の制限があるリスト系コンポーネント
  $("*[data-show_count]").each(function(){
    var count = $(this).data("show_count");
    if($(this).data("init_count")) {
      count = $(this).data("init_count");
    };
    var $container = $(this);
    //rowで区切りがあるパターン
    if($container.children(".dc__row").length > 0) {
      $container = $container.children(".dc__row");
    }
    $container.children(":gt(" + String(count - 1) + ")").hide();
  });

  //SIG-INFO-01
  $(".container_sig_info_01").each(function(){
    $(this).children(":gt(5)").hide();
    $(this).data("init_count", 6);
    $(this).data("show_count", 6);

    if($(this).children().length <= 6) {
      $("*[data-for='container_sig_info_01']").hide();
    }
  });

  //SIG-05
  $(".dc__container_sig_05").each(function(){
    if(!$(this).data("init_count")) {
      $(this).children(":gt(7)").hide();
      $(this).data("init_count", 8);
      $(this).data("show_count", 4);
    }

    if($(this).children().length <= 8) {
      $(this).next("div").children("p").children("a").hide();
    }
  });

  //TPC-06
  $(".dc__content_top06").each(function(){
      $(this).children(":gt(3)").hide();
      $(this).data("init_count", 4);
      $(this).data("show_count", 4);

    if($(this).children().length <= 4) {
      $("*[data-for='dc__container_cpev']").hide();
    }
  });

  //EV-NAV-04
  $(".dc__ev_nav_04 .dc__container_cpev").each(function(){
      $(this).children(":gt(9)").hide();
      $(this).data("init_count", 10);
      $(this).data("show_count", 10);

    if($(this).children().length <= 10) {
      $(".dc__ev_nav_04 *[data-for='dc__container_cpev']").hide();
    }
  });

  //もっと見るボタン
  $(".dc__btn_more").each(function(){
    if($(this).data("for")) {
      $(this).on("click", function(e){
        if($(this).data("original_label") == null){
          $(this).data("original_label", $(this).text());
        }
        e.preventDefault();
        var con = $(this).data("for");
        var $container;
        //コンテナ参照
        if($(this).parent().parent().find("." + con).length > 0) {
          $container = $(this).parent().parent().find("." + con);
        } else {
          $container = $("." + con).eq(0);
        }
        var step = $container.data("show_count");
        var init_count = $container.data("init_count");

        //rowで区切りがあるパターン
        if($container.children(".dc__row").length > 0) {
          $container = $container.children(".dc__row");
        }

        var count = $container.children(":visible").length;
        var num_children = $container.children().length;
        if(count < num_children) {
          $container.children(":lt(" + String(count + step) + ")").fadeIn(400);
          if($container.children().length <= (count + step)) {
            var close_label = (location.href.indexOf("/en/") == -1) ? "閉じる" : "CLOSE";
            $(this).text(close_label);
            $(this).toggleClass("icon_angle_down").toggleClass("icon_angle_up");
          }
        } else {
          var default_count = init_count ? init_count : step;
          $container.children(":gt(" + String(default_count - 1) + ")").fadeOut(250);
          $(this).text($(this).data("original_label"));
          $(this).toggleClass("icon_angle_down").toggleClass("icon_angle_up");

          //TPC-06
          if($(this).parents(".dc__tpc_06").length > 0) {
            var st = $("body,html").scrollTop() || $("body").scrollTop();
            var et = $(this).parents(".dc__tpc_06").offset().top;
            var nt = $(this).parents(".dc__tpc_06").get(0).offsetTop;
            var gap = 0;
            if(st > et) gap = 80;
            $("body,html").animate({scrollTop:et - $("header").height() - gap}, 350);
          }
        }
      });
    }
  });

  //TOP-DC-01とSIG-01の高さを揃える
  $(window).on("resize", function(){

    $(".dc__parent_h100").each(function(){
      $(this).css("height", "auto");
      var $parent = ($(this).parents(".dc__row").length > 0) ? $(this).parents(".dc__row") : $(this).parents(".dc__dis_table");
      if(window.innerWidth > 768) {
        var $target = $(this);
        setTimeout(function(){
          var pph = $parent.height();
          $target.height(pph);
          $target.outerHeight(pph);
        }, 100);
      } else {
        $(this).parent().css("height", "auto");
        $(this).css("height", "auto");
      }
    });
  }).trigger("resize");


  $(".dc__btn_share").each(function(){
    var $popup = $(this).parent().next();
    $popup.hide();
    $popup.find("a").eq(0).on("click", function(e){
      e.preventDefault();
      window.open("https://twitter.com/share?shareUrl=" + location.href);
    });
    $popup.find("a").eq(1).on("click", function(e){
      e.preventDefault();
      window.open("https://www.facebook.com/sharer/sharer.php?u=" + location.href);
    });
    $popup.find("a").eq(2).on("click", function(e){
      e.preventDefault();
      var text = '';
      if ($('meta[property="og:title"]').attr('content')) {
        text = $('meta[property="og:title"]').attr('content');
      }
      else {
	      text = $('title').text();
      }
	    var url = location.href;
      window.open("http://line.me/R/msg/text/" + encodeURIComponent(text) + '%0d%0a' + encodeURIComponent(url));
    });

    $(this).on("click", function(e){
      e.preventDefault();
      $(this).parent().next().fadeToggle();
    });
  });

  //bumper link
  $(".dc__bumper_link").each(function(index){
    var href = $(this).attr("href");
    var desc = $(this).attr("data-description") || "";
    var target = $(this).attr("target") || "_self";
    var text = "ダイナースクラブ ウェブサイトから移動します。<br>進む場合は、以下の「進む」をクリックしてください。";
    var text_sumi_en = 'You are leaving Sumitomo Mitsui Trust Club Official Website.<br>To open the website you are entering, please click \"Continue\".';
    var text_diners_en = 'You are leaving Diners Club Official Website.<br>To open the website you are entering, please click \"Continue\".';
    var text_custom = "「" + desc + "」へ移動します。<br>このサイトへ移動する場合には「進む」をクリックしてください。";
    var text_custom_sumi_en = 'You are leaving Sumitomo Mitsui Trust Club Official Website.<br>To proceed further please click \"Continue\".';
    var text_custom_diners_en = 'You are leaving Diners Club Official Website.<br>To proceed further please click \"Continue\".';
    var text_purchase = "「" + desc + "」へ移動します。<br>このサイトへ移動する場合には「進む」をクリックしてください。<br>接続先のサイトは、三井住友トラストクラブ株式会社が<br>管理・運営しているものではありません。"
    var label_go = "進む";
    var label_back = "戻る";
    var label_go_en = "Continue";
    var label_back_en = "Cancel";
    var logo_sumi = "/content/dam/diners/img/common/logo_05.png";
    var logo_diners = "/content/dam/diners/img/common/logo_01.png";

    logo_src = logo_sumi;

    if(location.href.indexOf("diners") > -1 ) {
      logo_src = logo_diners;
    }
	if($(this).hasClass("dc__benefit_course")) {
      logo_src = logo_diners;
    }

    if(desc.length > 0) {
      text = text_custom;
    }

    if($(this).hasClass("dc__en")) {
      label_go = label_go_en;
      label_back = label_back_en;
      text = text_sumi_en;
      if(location.href.indexOf("diners") > -1) {
        text = text_diners_en;
      }
      if(desc.length > 0) {
        text = text_custom_sumi_en;
        if(location.href.indexOf("diners") > -1) {
          text = text_custom_diners_en;
        }
      }
    }
    if($(this).hasClass("dc__benefit_course")) {
      text = '<h4 class="dc__text_center">ご注意事項</h4>\
<div class="dc__mb_small"><ul>\
<li class="dc__text_list dc__list_kome dc__mb_small">店舗によって個別の注意事項がありますので、あらかじめ各店舗の優待情報の「備考」欄を必ずご確認ください。また、以下の注意事項もすべてご確認ください。お申し込みいただいた時点で、これら注意事項に同意したものとします。</li>\
<li class="dc__text_list dc__list_disc ">ご利用は、4月1日～9月30日と10月1日～3月31日の各優待期間中に、1店舗につき1家族様1回とします。</li>\
<li class="dc__text_list dc__list_disc ">ご利用希望日の5日前までにお申し込みください。ただし、土・日や店舗の休業日の関係で予約の手配にお時間をいただく場合もありますのでお早めにお申し込みください。</li>\
<li class="dc__text_list dc__list_disc ">オンラインで予約の手配をお申し込みいただいた時点では、予約は成立していません。お店の空席状況を確認後、予約が確定します。予約手配の結果はメールで回答します。</li>\
<li class="dc__text_list dc__list_disc ">予約申込後の<b><u>キャンセル・変更は原則できません。</u></b>申込後に変更が発生しないよう、<b><u>必ず予約内容を確定のうえお申し込みください。</u></b></li>\
<li class="dc__text_list dc__list_disc dc__mb_small"><b>同じ予約希望日・時間帯で複数店舗のお申し込みは承れません。</b>一つの予約が不成立となった場合に次をお申し込みください。<u>万一、同日の同時間帯で複数店舗へのお申し込みが確認された場合、該当するすべてのお申し込みをキャンセルし、通知をお送りします。</u></li>\
</ul></div>';

      //予約停止中
      // text = '<h4 class="dc__text_center dc__mb_small">お知らせ</h4><div class="dc__mb_small"><ul><li class="dc__text_list dc__list_disc">年末年始にともない、以下の期間アプリからの予約受付を一時停止しています。</li><ul></div><div class="dc__mb_small"><p>＜一時停止期間＞<br>2025年12月26日（金）9:00～2026年1月5日（月）9:00<br>※時間は作業状況により前後することがありますのであらかじめご了承ください。<br><br>お客様にはご不便をおかけいたしますが、ご理解を賜りますよう、よろしくお願いいたします。<br><br>ダイナースクラブ プレミアムカード会員様は、一時停止期間中もプレミアム専用デスクのコンシェルジュサービスにて、お電話でお申し込みを承ります。</p></div>';
    }

    if($(this).hasClass("dc__unmanaged") && desc.length > 0) {
      text = text_purchase;
    }

    var html_str = '<div class="dc__modal_content"><div class="dc__modal_box"><h2 class="dc__box_title"><a href="javascript:void(0);" class="dc__btn dc__btn_gray dc__btn_small icon_close dc__right"></a></h2><div class="dc__content_box"><img class="dc__center dc__mb_big dc__con_pt_40" src="' + logo_src + '" alt=""><p class="dc__text_center dc__mb_big">' + text + '</p><p class="dc__overflow dc__center dc__text_center dc__con_pb_40"><span class="dc__inline_block dc__pr_mini dc__pl_mini"><a href="#" target="_blank" class="dc__btn dc__btn_white dc__btn_small icon_angle_left dc__pr_small btn_back">' + label_back + '</a></span><span class="dc__inline_block dc__pr_mini dc__pl_mini"><a href="' + href + '" target="' + target + '" class="dc__btn dc__btn_white dc__btn_small icon_angle_right dc__pr_small btn_go">' + label_go + '</a></span></p></div></div></div>';

   //予約停止中
    // if($(this).hasClass("dc__benefit_course")) {
    //  html_str = '<div class="dc__modal_content"><div class="dc__modal_box"><h2 class="dc__box_title"><a href="javascript:void(0);" class="dc__btn dc__btn_gray dc__btn_small icon_close dc__right"></a></h2><div class="dc__content_box"><img class="dc__center dc__mb_big dc__con_pt_40" src="' + logo_src + '" alt=""><p class="dc__text_center dc__mb_big">' + text + '</p><p class="dc__overflow dc__center dc__text_center dc__con_pb_40"><span class="dc__inline_block dc__pr_mini dc__pl_mini"><a href="#" target="_blank" class="dc__btn dc__btn_white dc__btn_small icon_angle_left dc__pr_small btn_back">' + label_back + '</a></span></p></div></div></div>';
    // }

    var $dialog = $(html_str);
    $dialog.css("z-index", 999);
    $dialog.data("href", href);
    $dialog.find('.icon_close, .btn_back').on("click", function(e){
      e.preventDefault();
      $(this).parents(".dc__modal_content").fadeOut(250);
      bodyFixedOff();
    });

    $dialog.on("click", function(e){
      if($(e.target).hasClass("dc__modal_content")){
        $(this).fadeOut(250);
        bodyFixedOff();
      } else if($(e.target).hasClass("btn_go")){
        $(this).hide();
        bodyFixedOff();
      }
    });

    var id = "bumper_modal_" + index;
    $dialog.attr("id", id);
    $("body").append($dialog);
    $(this).data("bumper_modal_id", id);
    $(this).on("click", function(e){
      e.preventDefault();
      var modal_id = $(this).data("bumper_modal_id");
      var $modal = $("#" + modal_id);
      $modal.fadeIn(400);
      bodyFixedOn();
    });

    //計測タグ
    var has_href_appear = false;
    var $item = $(this);
    var names = [];
    var values = [];
    if($(this).attr("onclick")) {
      for (var i=0; i < this.attributes.length; i++) {
        var attr = this.attributes[i];
        var name = attr["name"];
        var value = attr["value"];
        if(has_href_appear) {
          names.push(name);
          values.push(value);
        }
        if(name == "href") {
          has_href_appear = true;
        }
      };

      for (var j=0; j < names.length; j++) {
        var name = names[j];
        var value = values[j];
        $item.removeAttr(name);
        $dialog.find(".btn_go").attr(name, value);
      }
    }

  });

  //bumper link for async
	$(document).on('click', ".dc__bumper_link_async", function(e){
	  e.preventDefault();

	  var $button = $(this);

    // render modal html
    if ($(this).data('renderedModal') !== true) {
	    $(this).data('renderedModal', true);

	    var href = $(this).attr("href");
	    var desc = $(this).attr("data-description") || "";
	    var target = $(this).attr("target") || "_self";
	    var text = "ダイナースクラブ ウェブサイトから移動します。<br>進む場合は、以下の「進む」をクリックしてください。";
	    var text_sumi_en = 'You are leaving Sumitomo Mitsui Trust Club Official Website.<br>To open the website you are entering, please click \"Continue\".';
      var text_diners_en = 'You are leaving Diners Club Official Website.<br>To open the website you are entering, please click \"Continue\".';
	    var text_custom = "「" + desc + "」へ移動します。<br>このサイトへ移動する場合には「進む」をクリックしてください。";
      var text_custom_sumi_en = 'You are leaving Sumitomo Mitsui Trust Club Official Website.<br>To proceed further please click \"Continue\".';
	    var text_custom_diners_en = 'You are leaving Diners Club Official Website.<br>To proceed further please click \"Continue\".';
	    var text_purchase = "「" + desc + "」へ移動します。<br>このサイトへ移動する場合には「進む」をクリックしてください。<br>接続先のサイトは、三井住友トラストクラブ株式会社が<br>管理・運営しているものではありません。"
	    var label_go = "進む";
	    var label_back = "戻る";
	    var label_go_en = "Continue";
	    var label_back_en = "Cancel";
	    var logo_sumi = "/content/dam/diners/img/common/logo_05.png";
	    var logo_diners = "/content/dam/diners/img/common/logo_01.png";

	    logo_src = logo_sumi;

	    if(location.href.indexOf("diners") > -1 || location.href.indexOf("imjp")) {
		    logo_src = logo_diners;
	    }

	    if(desc.length > 0) {
		    text = text_custom;
	    }

	    if($(this).hasClass("dc__en")) {
		    label_go = label_go_en;
		    label_back = label_back_en;
		    text = text_sumi_en;
        if(location.href.indexOf("diners") > -1 || location.href.indexOf("imjp")) {
          text = text_diners_en;
        }
		    if(desc.length > 0) {
			    text = text_custom_sumi_en;
          if(location.href.indexOf("diners") > -1 || location.href.indexOf("imjp")) {
            text = text_custom_diners_en;
          }
		    }
	    }

	    if($(this).hasClass("dc__unmanaged") && desc.length > 0) {
		    text = text_purchase;
	    }

	    var html_str = '<div class="dc__modal_content"><div class="dc__modal_box"><h2 class="dc__box_title"><a href="javascript:void(0);" class="dc__btn dc__btn_gray dc__btn_small icon_close dc__right"></a></h2><div class="dc__content_box"><img class="dc__center dc__mb_big dc__con_pt_40" src="' + logo_src + '" alt=""><p class="dc__text_center dc__mb_big">' + text + '</p><p class="dc__overflow dc__center dc__text_center dc__con_pb_40"><span class="dc__inline_block dc__pr_mini dc__pl_mini"><a href="#" target="_blank" class="dc__btn dc__btn_white dc__btn_small icon_angle_left dc__pr_small btn_back">' + label_back + '</a></span><span class="dc__inline_block dc__pr_mini dc__pl_mini"><a href="' + href + '" target="' + target + '" class="dc__btn dc__btn_white dc__btn_small icon_angle_right dc__pr_small btn_go">' + label_go + '</a></span></p></div></div></div>';
	    var $dialog = $(html_str);
	    $dialog.css("z-index", 999);
	    $dialog.data("href", href);
	    $dialog.find('.icon_close, .btn_back').on("click", function(e){
		    e.preventDefault();
		    $(this).parents(".dc__modal_content").fadeOut(250);
	    });

	    $dialog.on("click", function(e){
		    if($(e.target).hasClass("dc__modal_content")){
			    $(this).fadeOut(250);
		    } else if($(e.target).hasClass("btn_go")){
			    $(this).hide();
		    }
	    });

	    $dialog.data("href", href);
	    $("body").append($dialog);
    }

    var $target = $('.dc__modal_content').filter(function () {
      return $(this).data('href') === $button.attr('href');
    });

    console.log($target)

		$target.fadeIn(400);
	});
	
    //bumper iOS・スクロール制御
    var scrollPosition;
    var isiOS = navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('iPad') != -1 || (navigator.userAgent.indexOf('Macintosh') != -1 && "ontouchend" in document) || navigator.userAgent.indexOf('iPod') != -1;
    function bodyFixedOn() {
        if(isiOS){
            scrollPosition = $(window).scrollTop();
            $('body').css('position', 'fixed');
            $('body').css('top', '-' + scrollPosition + 'px');
        }else {
            $('body').css('overflow', 'hidden');
        }
    }
    function bodyFixedOff() {
        if(isiOS){
            $('body').css('position', '');
            $('body').css('top', '');
            $(window).scrollTop(scrollPosition);
        }else {
            $('body').css('overflow', '');
        }
    }
    //bumper アプリ バンパー背景サイズ制御
    if (navigator.userAgent.indexOf('sumitclubapp') != -1) {
 /*
      $(".dc__modal_content").css("margin-top", "78px");
      $(".dc__modal_content").css("height", "calc(100% - 78px - 83px)");
*/
      $(".dc__modal_content").css("height", "calc(100% - 83px)");
    }

  /* TOP-DC-03 */
  $(".dc__top_dc_03").each(function(){
    $(this).find("a.icon_angle_right").each(function(){
      if($(this).attr("target") == "_blank"){
        $(this).removeClass("icon_angle_right").addClass("icon_page");
      }
    });
  });

  /* GEN-4-02, GEN-3-01, GEN-2-03 */
  $(".dc__check_hasbg").each(function(){
    var style = $(this).attr("style");
    if(style && (style.indexOf("background-color") > -1 || style.indexOf("background-image") > -1)) {
      $(this).addClass("dc__p_mid");
    }
  });

  /* SER-DTL-01 */
  $(".dc__ser_dtl_01 .dc__gallery").each(function(){

    //SP source
    var $img_list = $(this).find("img");
    var html = ""
    html += '<div class="dc__carousel dc__cartype-b_typeb dc__sp_btn">';
    html +=   '<div class="slider">';
    $img_list.each(function(i){
      var src = $(this).attr("src");
      if(i == 0) {
        html += '<div class="dc__slider_cell dc__active"><img class="dc__w100" src="' + src + '" alt=""></div>';
      } else {
        html += '<div class="dc__slider_cell"><img class="dc__w100" src="' + src + '" alt=""></div>';
      }
    });
    html +=   '</div>';
    html +=   '<ul class="dc__slider_arrow dc__cartype02">';
    html +=     '<li class="dc__slider_prev dc__cartype-b"><a href="#"><img class="dc__icon-w_30 dc__arrowimage" src="/content/dam/diners/img/common/arrow_left_white.png" /></a></li>';
    html +=     '<li class="dc__slider_next dc__cartype-b"><a href="#"><img class="dc__icon-w_30 dc__arrowimage" src="/content/dam/diners/img/common/arrow_right_white.png" /></a></li>';
    html +=   '</ul>';
    html +=   '<ol class="dc__slider_dots">';
    html +=     '<li><a class="dc__active" href="javascript:void(0);">1</a></li>';
    html +=     '<li><a href="javascript:void(0);">2</a></li>';
    html +=     '<li><a href="javascript:void(0);">3</a></li>';
    html +=     '<li><a href="javascript:void(0);">4</a></li>';
    html +=     '<li><a href="javascript:void(0);">5</a></li>';
    html +=   '</ol>';
    html += '</div>';
    $(this).after($(html));

    //gallery image
    if($img_list.length < 3) {
      $(this).find(".dc__gallery_big").css({ "width": "50%", "max-width": "50%", "flex-basis": "50%" });
      $(this).find(".dc__gallery_small").css({ "width": "50%", "max-width": "50%", "flex-basis": "50%" });
    }
  });

  /* TPC-06 */
 $(".dc__tpc_06").each(function(){
    var $list = $(this).find(".dc__cpev_list_nav li")
    var $contaienr = $list.parent().parent();
    var html = "";
    html += '<div class="dc__sp_btn dc__content_box dc__content_top06">';
    html +=   '<div class="dc__row dc__w100">';
    html +=     '<div class="dc__select_box dc__w100">';
    html +=       '<select class="dc__btn_small dc__w100 dc__cpev_list_pd">';
    $list.each(function(){
      var category = $(this).data("category");
      var label = $(this).find("span").text();
      html += '<option value="' + category + '">' + label + '</option>';
    });
    html +=       '</select>';
    html +=     '</div>';
    html +=   '</div>';
    html += '</div>';
    $contaienr.after($(html));
 });

  /* header position */
  var lastScrollTop = 0;

  //2ndがある場合はパディングを2ndメニュー分増やす
  $(window).on("resize.second_nav", function(){
    if(window.innerWidth > 768) {
      if($("#dc__menu_2nd").length == 1) {
        var current_padding;
        if($("body").data("org_padding")) {
          var current_padding = $("body").data("org_padding");
        } else {
          var p = Number($("body").css("padding-top").replace("px", ""));
          $("body").data("org_padding", p);
          current_padding = p;
        }
        var menu_2nd_height = $("#dc__menu_2nd").height();
        var new_padding = current_padding + menu_2nd_height;
        $("body").css("padding-top", new_padding);
        if($("#dc__menu_2nd").css("position") != "fixed"){
          $("#dc__menu_2nd").css("position", "absolute");
          $("#dc__menu_2nd").css("top", 123);
          $("#dc__menu_2nd").css("width", "100%");
        }
      } else {
        $("body").css("padding-top", "12.2rem");
      }
    } else {
      $("body").css("padding-top", "5rem");
    }
  }).trigger("resize.second_nav");

  $(window).on("scroll", function(){
    if(window.innerWidth <=768 || $(this).data("fixed_header") == false) return;
    //console.log("fix header");
    var scroll_top = $("html,body").scrollTop() || $("body").scrollTop();
    var diff = lastScrollTop - scroll_top;
    var $header = $("header");
    if(lastScrollTop == 0 && scroll_top == 0) return;
    lastScrollTop = scroll_top;

    if($header.css("position") != "fixed" && scroll_top > 82) {
      $("#dc__menu_1").hide();
      $header.css("position", "fixed");
      //menu 2nd
      $("#dc__menu_2nd").css("position", "fixed");
      $("#dc__menu_2nd").css("top", 51);
    }

    if(scroll_top == 0) {
      $("#dc__menu_1").stop().slideDown(250, "swing");
      $header.css("position", "absolute");
      $("#dc__menu_2nd").stop().css({
        position: "absolute",
        top: ($('.dc__premium_header').length) ? 132 : 123
      });
    }

   if($header.css("position") == "fixed") {
      if(diff > 0) {
        $("#dc__menu_1").stop().slideDown(250, "swing");

        $("#dc__menu_2nd").stop().animate({
          top: ($('.dc__premium_header').length) ? 132 : 123
        },{
          duration: 250,
          easing: 'swing',
          complete: function () {
            $(window).trigger('scroll');
          }
        });

      } else if(diff < 0){
        $("#dc__menu_1").stop().slideUp(250, "swing");
        $("#dc__menu_2nd").stop().animate({
          top:51
        },{
          duration: 250,
          easing: 'swing',
          complete: function () {
            $(window).trigger('scroll');
          }
        });
      }
    }

    //dc__menu_1、dc__menu_2の横スクロール
    if(window.innerWidth < 1024 && window.innerWidth > 768) {
      if(scroll_top > 0) {
        $("#dc__menu_1").css("left", -$(window).scrollLeft());
        $("#dc__menu_2").css("left", -$(window).scrollLeft());
        if($("#dc__menu_2nd").length > 0) {
          $("#dc__menu_2nd").css("left", -$(window).scrollLeft());
        }
      } else {
        $("#dc__menu_1").css("left", 0);
        $("#dc__menu_2").css("left", 0);
        if($("#dc__menu_2nd").length > 0) {
          $("#dc__menu_2nd").css("left", 0);
        }
      }
    }

  }).trigger("scroll.second_nav");


  /* 優待検索 ご予約方法リンク設定 */
  //プレミアムエグゼクティブダイニング
  $(document).ready(function() {
    $("a.dc__link_ped").attr("href", "/premium/member/gourmet/executive.html")
  });
  //エグゼクティブダイニング
  $(document).ready(function() {
    $("a.dc__link_ed").attr("href", "/ja/gourmet/executive.html")
  });
  //おもてなしプラン（プレミアム）
  $(document).ready(function() {
    $("a.dc__link_omop").attr("href", "/premium/member/gourmet/omotenashi.html")
  });
  //おもてなしプラン
  $(document).ready(function() {
    $("a.dc__link_omo").attr("href", "/ja/gourmet/omotenashi.html")
  });
  //料亭プラン（プレミアム）
  $(document).ready(function() {
    $("a.dc__link_ryop").attr("href", "/premium/member/gourmet/restaurant.html")
  });
  //料亭プラン
  $(document).ready(function() {
    $("a.dc__link_ryo").attr("href", "/ja/gourmet/restaurant.html")
  });
   //サインレス・スタイル（プレミアム）
   $(document).ready(function() {
     $("a.dc__link_sigp").attr("href", "/ja/gourmet/signlessstyle.html")
   });
  //サインレス・スタイル
  $(document).ready(function() {
    $("a.dc__link_sig").attr("href", "/ja/gourmet/signlessstyle.html")
  });
   //トラベル　ご注意事項（国内）
  $(".dc__link_d_att").each(function(index){
    var h2text = "優待ご利用の際のご注意";
    var text = '<ul><li class="dc__text_list dc__list_kome">各施設によって、優待除外期間や適用条件があります。詳しくは、ご予約の際にご確認ください。</li><li class="dc__text_list dc__list_kome">キャンセル・変更の場合、各施設規定のキャンセル料がかかる場合があります。詳しくは、ご予約の際にご確認ください。</li><li class="dc__text_list dc__list_kome">本優待は他の割引・特典・企画等との重ねてのご利用はできません。</li><li class="dc__text_list dc__list_kome">お支払いはダイナースクラブカードをご利用ください。本優待はダイナースクラブカードでお支払いされる場合のみ適用され ます。</li><li class="dc__text_list dc__list_kome">掲載の優待特典はダイナースクラブ会員様が利用されない場合は適用になりません。</li><li class="dc__text_list dc__list_kome">アーリーチェックイン、レイトチェックアウトは、予約状況によりご利用いただけない場合があります。</li><li class="dc__text_list dc__list_kome">写真はイメージです。内装やお部屋、お料理などは実際と異なる場合があります。</li><li class="dc__text_list dc__list_kome">本サービスのご利用はすべてダイナースクラブ会員様とサービス提供者との間で直接行っていただくものですので、当社は利用に関する責任は負いません。</li><li class="dc__text_list dc__list_kome">本掲載内容は掲載施設から提出された資料を基に作成しています。</li><li class="dc__text_list dc__list_kome">空室があっても優待が適用される客室数に制限があり、ご利用いただけない場合があります。</li><li class="dc__text_list dc__list_kome">掲載内容（優待料金、特典、施設の各情報など）は予告なく変更、終了する場合があります。あらかじめご了承ください。</li><li class="dc__text_list dc__list_kome">掲載の優待内容（優待料金、特典など）は時期により変動する場合があります。あらかじめご了承ください。</li></ul>';
    var html_str = '<div class="dc__modal_content"><div class="dc__modal_box"><h2 class="dc__box_title">' + h2text + '<a href="javascript:void(0);" class="dc__btn dc__btn_gray dc__btn_small icon_close dc__right"></a></h2><div class="dc__content_box">' + text + '</div></div></div>';
    var $dialog = $(html_str);
    $dialog.css("z-index", 999);
    $dialog.find('.icon_close, .btn_back').on("click", function(e){
      e.preventDefault();
      $(this).parents(".dc__modal_content").fadeOut(250);
    });

    $dialog.on("click", function(e){
      if($(e.target).hasClass("dc__modal_content")){
        $(this).fadeOut(250);
      } else if($(e.target).hasClass("btn_go")){
        $(this).hide();
      }
    });

    var id = "modal_att" + index;
    $dialog.attr("id", id);
    $("body").append($dialog);
    $(this).data("modal_att_id", id);
    $(this).on("click", function(e){
      e.preventDefault();
      var modal_id = $(this).data("modal_att_id");
      var $modal = $("#" + modal_id);
      $modal.fadeIn(400);
    });
  });
//トラベル　ご注意事項（海外）
   $(document).ready(function() {
     $(".dc__link_o_att").attr("href", "/ja/travel/a_clubhotels.html#use")
   });
//プレミアム専用デスク　ご注意事項
  $(".dc__link_d_pdsk").each(function(index){
    var h2text = "優待ご利用の際のご注意";
    var text = '<ul><li class="dc__text_list dc__list_kome">掲載の優待特典はプレミアムカード会員様が利用されない場合は適用されません。</li><li class="dc__text_list dc__list_kome">お支払いはダイナースクラブ プレミアムカードをご利用ください。</li><li class="dc__text_list dc__list_kome">予約状況によってはご希望に沿えない場合もありますので、ご了承ください。</li><li class="dc__text_list dc__list_kome">スパのお支払いは一回払いのみとさせていただきます。</li><li class="dc__text_list dc__list_kome">店舗によっては、スパの料金に別途サービス料がかかる場合があります。</li><li class="dc__text_list dc__list_kome">ご利用店舗とご利用者様との間で発生したトラブルに関して、三井住友トラストクラブ株式会社では一切の責任を負いかねますのでご了承ください。</li><li class="dc__text_list dc__list_kome">掲載の特典内容や利用条件、優待除外日などは予告なく変更する場合があります。</li><li class="dc__text_list dc__list_kome">ご予約後のキャンセルについては、各店舗・施設規定のキャンセル料がかかる場合があります。ご予約の際にご確認ください。</li><li class="dc__text_list dc__list_kome">掲載の優待は他の特典との併用はできません。</li><li class="dc__text_list dc__list_kome">掲載の写真はイメージ写真の場合があります。</li></ul>';
    var html_str = '<div class="dc__modal_content"><div class="dc__modal_box"><h2 class="dc__box_title">' + h2text + '<a href="javascript:void(0);" class="dc__btn dc__btn_gray dc__btn_small icon_close dc__right"></a></h2><div class="dc__content_box">' + text + '</div></div></div>';
    var $dialog = $(html_str);
    $dialog.css("z-index", 999);
    $dialog.find('.icon_close, .btn_back').on("click", function(e){
      e.preventDefault();
      $(this).parents(".dc__modal_content").fadeOut(250);
    });

    $dialog.on("click", function(e){
      if($(e.target).hasClass("dc__modal_content")){
        $(this).fadeOut(250);
      } else if($(e.target).hasClass("btn_go")){
        $(this).hide();
      }
    });

    var id = "modal_pdsk" + index;
    $dialog.attr("id", id);
    $("body").append($dialog);
    $(this).data("modal_pdsk_id", id);
    $(this).on("click", function(e){
      e.preventDefault();
      var modal_id = $(this).data("modal_pdsk_id");
      var $modal = $("#" + modal_id);
      $modal.fadeIn(400);
    });
  });
  // 新アプリ表示制御
  $(".dc__newapp_parent_display").parent().css("display", "none");
  $(".dc__webonly_parent_display").parent().css("display", "none");
  if (navigator.userAgent.indexOf('sumitclubapp') != -1) {
    $(".dc__newapp_display").css("display", "block");
    $(".dc__newapp_parent_display").css("display", "block");
    $(".dc__newapp_parent_display").parent().css("display", "block");
  }else{
    $(".dc__webonly_display").css("display", "block");
    $(".dc__webonly_parent_display").css("display", "block");
    $(".dc__webonly_parent_display").parent().css("display", "block");
  }

});

// カルーセルレスポンシブPC/SP 画像変換
$(function(){
  var $setElem = $('.dc__switch .dc__slider_cell img'), //画像のclassを「dc__switch」に
  pcName = '_pc', //画像のファイル名
  spName = '_sp', //画像のファイル名
  replaceWidth = 768; //分岐するサイズ

  $setElem.each(function(){
    var $this = $(this);
    function imgSize(){
      var windowWidth = parseInt($(window).width());
      if(windowWidth >= replaceWidth) {
        $this.attr('src',$this.attr('src').replace(spName,pcName)).css({visibility:'visible'});
      } else if(windowWidth < replaceWidth) {
        $this.attr('src',$this.attr('src').replace(pcName,spName)).css({visibility:'visible'});
      }
    }
    $(window).on("resize", function(){imgSize();});
    imgSize();
  });
});

// SP検索メニュー
$(window).on('load',function(){
      $(".dc__sp_searchbox input").attr("placeholder", "サイト内検索");
});


//リサイズ時ウインドウ幅が768を跨ぐ場合はリロード
$(function(){

  var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

  if(width > 768) {
    $("body").data("device", "pc");
  } else {
    $("body").data("device", "sp");
  }

  $(window).on("resize", function(){
    var width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if(width > 768 && $("body").data("device") == "sp") {
      setTimeout(function(){
        location.reload(true);
      });
    }
    if(width <= 768 && $("body").data("device") == "pc") {
      setTimeout(function(){
        location.reload(true);
      });
    }
  });
});

/* Replace all SVG images with inline SVG */
$("img.svg").each(function(){var a=jQuery(this),b=a.attr("id"),c=a.attr("class"),d=a.attr("src"),e=a.attr("width"),f=a.attr("height");jQuery.get(d,function(d){var g=jQuery(d).find("svg");"undefined"!=typeof b&&(g=g.attr("id",b)),"undefined"!=typeof c&&(g=g.attr("class",c+" replaced-svg")),"undefined"!=typeof e&&(g=g.attr("width",e)),"undefined"!=typeof f&&(g=g.attr("height",f)),g=g.removeAttr("xmlns:a"),!g.attr("viewBox")&&g.attr("height")&&g.attr("width")&&g.attr("viewBox","0 0 "+g.attr("height")+" "+g.attr("width")),a.replaceWith(g)},"xml")});

/*
 * jQuery Easing v1.4.1 - http://gsgd.co.uk/sandbox/jquery/easing/
 * Open source under the BSD License.
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * https://raw.github.com/gdsmith/jquery-easing/master/LICENSE
*/
!function(n){"function"==typeof define&&define.amd?define(["jquery"],function(e){return n(e)}):"object"==typeof module&&"object"==typeof module.exports?exports=n(require("jquery")):n(jQuery)}(function(n){function e(n){var e=7.5625,t=2.75;return n<1/t?e*n*n:n<2/t?e*(n-=1.5/t)*n+.75:n<2.5/t?e*(n-=2.25/t)*n+.9375:e*(n-=2.625/t)*n+.984375}void 0!==n.easing&&(n.easing.jswing=n.easing.swing);var t=Math.pow,u=Math.sqrt,r=Math.sin,i=Math.cos,a=Math.PI,c=1.70158,o=1.525*c,s=2*a/3,f=2*a/4.5;n.extend(n.easing,{def:"easeOutQuad",swing:function(e){return n.easing[n.easing.def](e)},easeInQuad:function(n){return n*n},easeOutQuad:function(n){return 1-(1-n)*(1-n)},easeInOutQuad:function(n){return n<.5?2*n*n:1-t(-2*n+2,2)/2},easeInCubic:function(n){return n*n*n},easeOutCubic:function(n){return 1-t(1-n,3)},easeInOutCubic:function(n){return n<.5?4*n*n*n:1-t(-2*n+2,3)/2},easeInQuart:function(n){return n*n*n*n},easeOutQuart:function(n){return 1-t(1-n,4)},easeInOutQuart:function(n){return n<.5?8*n*n*n*n:1-t(-2*n+2,4)/2},easeInQuint:function(n){return n*n*n*n*n},easeOutQuint:function(n){return 1-t(1-n,5)},easeInOutQuint:function(n){return n<.5?16*n*n*n*n*n:1-t(-2*n+2,5)/2},easeInSine:function(n){return 1-i(n*a/2)},easeOutSine:function(n){return r(n*a/2)},easeInOutSine:function(n){return-(i(a*n)-1)/2},easeInExpo:function(n){return 0===n?0:t(2,10*n-10)},easeOutExpo:function(n){return 1===n?1:1-t(2,-10*n)},easeInOutExpo:function(n){return 0===n?0:1===n?1:n<.5?t(2,20*n-10)/2:(2-t(2,-20*n+10))/2},easeInCirc:function(n){return 1-u(1-t(n,2))},easeOutCirc:function(n){return u(1-t(n-1,2))},easeInOutCirc:function(n){return n<.5?(1-u(1-t(2*n,2)))/2:(u(1-t(-2*n+2,2))+1)/2},easeInElastic:function(n){return 0===n?0:1===n?1:-t(2,10*n-10)*r((10*n-10.75)*s)},easeOutElastic:function(n){return 0===n?0:1===n?1:t(2,-10*n)*r((10*n-.75)*s)+1},easeInOutElastic:function(n){return 0===n?0:1===n?1:n<.5?-(t(2,20*n-10)*r((20*n-11.125)*f))/2:t(2,-20*n+10)*r((20*n-11.125)*f)/2+1},easeInBack:function(n){return(c+1)*n*n*n-c*n*n},easeOutBack:function(n){return 1+(c+1)*t(n-1,3)+c*t(n-1,2)},easeInOutBack:function(n){return n<.5?t(2*n,2)*(7.189819*n-o)/2:(t(2*n-2,2)*((o+1)*(2*n-2)+o)+2)/2},easeInBounce:function(n){return 1-e(1-n)},easeOutBounce:e,easeInOutBounce:function(n){return n<.5?(1-e(1-2*n))/2:(1+e(2*n-1))/2}})});

/*! jquery.cookie v1.4.1 | MIT */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?a(require("jquery")):a(jQuery)}(function(a){function b(a){return h.raw?a:encodeURIComponent(a)}function c(a){return h.raw?a:decodeURIComponent(a)}function d(a){return b(h.json?JSON.stringify(a):String(a))}function e(a){0===a.indexOf('"')&&(a=a.slice(1,-1).replace(/\\"/g,'"').replace(/\\\\/g,"\\"));try{return a=decodeURIComponent(a.replace(g," ")),h.json?JSON.parse(a):a}catch(b){}}function f(b,c){var d=h.raw?b:e(b);return a.isFunction(c)?c(d):d}var g=/\+/g,h=a.cookie=function(e,g,i){if(void 0!==g&&!a.isFunction(g)){if(i=a.extend({},h.defaults,i),"number"==typeof i.expires){var j=i.expires,k=i.expires=new Date;k.setTime(+k+864e5*j)}return document.cookie=[b(e),"=",d(g),i.expires?"; expires="+i.expires.toUTCString():"",i.path?"; path="+i.path:"",i.domain?"; domain="+i.domain:"",i.secure?"; secure":""].join("")}for(var l=e?void 0:{},m=document.cookie?document.cookie.split("; "):[],n=0,o=m.length;o>n;n++){var p=m[n].split("="),q=c(p.shift()),r=p.join("=");if(e&&e===q){l=f(r,g);break}e||void 0===(r=f(r))||(l[q]=r)}return l};h.defaults={},a.removeCookie=function(b,c){return void 0===a.cookie(b)?!1:(a.cookie(b,"",a.extend({},c,{expires:-1})),!a.cookie(b))}});

/**
 * Minified by jsDelivr using Terser v5.37.0.
 * Original file: /npm/js-cookie@2.2.1/src/js.cookie.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
/*!
 * JavaScript Cookie v2.2.1
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
!function(e){var n;if("function"==typeof define&&define.amd&&(define(e),n=!0),"object"==typeof exports&&(module.exports=e(),n=!0),!n){var t=window.Cookies,o=window.Cookies=e();o.noConflict=function(){return window.Cookies=t,o}}}((function(){function e(){for(var e=0,n={};e<arguments.length;e++){var t=arguments[e];for(var o in t)n[o]=t[o]}return n}function n(e){return e.replace(/(%[0-9A-Z]{2})+/g,decodeURIComponent)}return function t(o){function r(){}function i(n,t,i){if("undefined"!=typeof document){"number"==typeof(i=e({path:"/"},r.defaults,i)).expires&&(i.expires=new Date(1*new Date+864e5*i.expires)),i.expires=i.expires?i.expires.toUTCString():"";try{var c=JSON.stringify(t);/^[\{\[]/.test(c)&&(t=c)}catch(e){}t=o.write?o.write(t,n):encodeURIComponent(String(t)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,decodeURIComponent),n=encodeURIComponent(String(n)).replace(/%(23|24|26|2B|5E|60|7C)/g,decodeURIComponent).replace(/[\(\)]/g,escape);var f="";for(var u in i)i[u]&&(f+="; "+u,!0!==i[u]&&(f+="="+i[u].split(";")[0]));return document.cookie=n+"="+t+f}}function c(e,t){if("undefined"!=typeof document){for(var r={},i=document.cookie?document.cookie.split("; "):[],c=0;c<i.length;c++){var f=i[c].split("="),u=f.slice(1).join("=");t||'"'!==u.charAt(0)||(u=u.slice(1,-1));try{var a=n(f[0]);if(u=(o.read||o)(u,a)||n(u),t)try{u=JSON.parse(u)}catch(e){}if(r[a]=u,e===a)break}catch(e){}}return e?r[e]:r}}return r.set=i,r.get=function(e){return c(e,!1)},r.getJSON=function(e){return c(e,!0)},r.remove=function(n,t){i(n,"",e(t,{expires:-1}))},r.defaults={},r.withConverter=t,r}((function(){}))}));


var app = app || {};
app.common_init =function(){
  /* accordion */
  $(".dc__search_nav_ac").on("click", function(){
    $(this).toggleClass("dc__active");
    $(this).next(".dc__search_nav_ac_box").slideToggle();
  });


  /* accordion */
  $(".dc__btn_accordion02").on("click", function(){
    $(this).toggleClass("dc__active");
    $(this).next(".dc__accordion_box02").slideToggle();
  });

  /*$('.btn_modal').click(function() {
    var $modal = $(this).next(".dc__modal_content");
    $modal.show();
    var $content = $modal.find(".dc__content_box");
    var gap = ($(window).width() > 768) ? 254 : 280;
    var margin = ($(window).width() > 768) ? "70px" : "10px";
    var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    if($modal.data("prefered_gap") > 0) {
      gap = $modal.data("prefered_gap");
    }

    var ch = window.innerHeight - gap;
    if($content.height() > ch) {
      $content.height(ch);
      $content.css("overflow-y", "scroll");
      $content.css("width", "100%");
      $content.css("position", "relative");
      $content.css("top", -3);
      $content.parent().css("margin-top", margin);
    }
    $modal.hide();
    $modal.fadeIn(400);
  });
  $('.dc__modal_box .icon_close').on("click", function(e){
    e.preventDefault();
    $(this).parents(".dc__modal_content").fadeOut(250, function(){
      $(this).find(".dc__content_box").css("height", "auto");
    });
  });
  $('.dc__modal_content').on("click", function(e){
    //e.preventDefault();
    if($(e.target).hasClass("dc__modal_content")){
      var $scope = $(this);
      $(this).fadeOut(250, function(){
        $(this).find(".dc__content_box").css("height", "auto");
      });
    }
  });*/
}


function siteCookieChecker() {
  let siteCookie = document.cookie;
  let siteCookieDataArr = [];

  if(siteCookie) {
    let splitSiteCookieData = siteCookie.split('; ');

    for(let i = 0; i < splitSiteCookieData.length; i++) {
      let data = splitSiteCookieData[i].split('=');
      siteCookieDataArr[data[0]] = decodeURIComponent(data[1]);
    }
  }

  return siteCookieDataArr;
}

function cardRunkChecker(cookie) {
  let cardRank;
  const loginRoot = cookie['loginRoot'];
  const Loginkey = cookie['Loginkey'];
  const LoginkeyOption = cookie['LoginkeyOption'];

  if(loginRoot !== 'on') {
    return;
  }

  if(Loginkey && LoginkeyOption) {
    cardRank = 'royalPremium';
  } else if (Loginkey && !LoginkeyOption) {
    cardRank = 'premium';
  } else if (!Loginkey) {
    return '';
  }

  return cardRank;
}

function redirectToRpcPage (url, rank) {
  if(rank === 'royalPremium') {
    location.href = url;
  } else {
    return;
  }
}

//サイト内検索ではAAのcookie「s_sq」を削除する
$(function(){
    var domain_pt = window.location.hostname;
    var domain_target = 'search.diners.co.jp';
    $(window).on("beforeunload", function(e){
        if(domain_pt.indexOf(domain_target) !== -1){
            Cookies.set('s_sq', '' , {domain:"diners.co.jp", path: '/'});
        }
    });
});
