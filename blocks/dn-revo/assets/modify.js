$(function() {
    $(".dc__btn_share").parent().next().find("a").eq(0)
        .off('click')
        .on("click", function(e) {
            e.preventDefault();
            var text = '';
            if ($('meta[property="og:title"]').attr('content')) {
                text = $('meta[property="og:title"]').attr('content');
            } else {
                text = $('title').text();
            }
            var url = encodeURIComponent(location.href);
            text = encodeURIComponent(text);
            window.open("https://twitter.com/share?text=" + text + "&url=" + url);
        });
    // add active class to global navigation
    if ($('#dc__menu_2 .dc__dropdown > a').length > 0) {
        $('#dc__menu_2 .dc__dropdown > a').each(function() {
            var urlPath = location.pathname.replace(/index\.html?$/, '');
            var strPathnames = $(this).data('path');
            if (strPathnames) {
                var pathnames = strPathnames.replace(/\s/g, '').split(',');
                pathnames.forEach(function(pathname) {
                    if (pathname === '/ja/' && urlPath !== '/ja/') return;
                    if (pathname === '/ja/premium/member/' && (
                            (urlPath !== '/ja/premium/member.html'))
                        //||(urlPath !== '/ja/premium/member/benefit.html'))
                    ) {
                        $('#dc__menu_2 .dc__dropdown > a').removeClass('dc__active_typeb');
                        return;
                    }
                    if (pathname === '') return;

                    if (RegExp(pathname).test(urlPath)) {
                        $('#dc__menu_2 .dc__dropdown > a').removeClass('dc__active_typeb');
                        $(this).addClass('dc__active_typeb');
                    }
                }.bind(this));
            }
        });
    }
    // 高さ調整
    (function() {
        var fixedHeight = function() {
            var $parent = $('.dc__js_fixheight');
            var $target = $parent.find('.dc__js_fixheight_child');
            var thisPosY = 0;
            var lastPosY = 0;
            var thisHeight = 0;
            var heights = [];
            var maxHeight = 0;
            var $group = [];
            // 対象のセレクタがなければ中止
            if ($parent.length === 0 || $target.length === 0) return;
            $target.each(function(index, el) {
                // 高さを初期化
                $(el).css({
                    height: ''
                });
                // Y座標と高さを取得
                thisPosY = $(el).position().top;
                thisHeight = $(el).height();
                // 高さとjquery objectを保存
                heights.push(thisHeight);
                $group.push($(el));
                // 2回目以降かつY座標が異なる、または最後のelementだった場合
                if (
                    (lastPosY !== 0 && lastPosY !== thisPosY) ||
                    (index === $target.length - 1)
                ) {
                    maxHeight = Math.max.apply(null, heights);
                    heights = [];
                    $.each($group, function(index, $el) {
                        $el.height(maxHeight);
                    });
                }
                // Y座標の保存
                lastPosY = thisPosY;
            });
        };
        fixedHeight();
        $(window).on('resize', fixedHeight);
        $(document).on('fixedHeight', fixedHeight);
    }());

    // for a bug of body element in iOS8.x
    (function() {
        if ($(window).width() > 768) return;

        if ($('.CCM004_TitleCategory .dc__category_mv').length !== 0) {
            if ($('.CCM004_TitleCategory .dc__category_mv').position().top > $('.CCM004_TitleCategory .dc__category_mv').children().position().top) {
                $('.CCM004_TitleCategory .dc__category_mv').css({
                    marginTop: $('body').css('paddingTop')
                });
            }
        }

        if ($('.CCM005_Html .dc__category_mv').length !== 0) {
            if ($('.CCM005_Html .dc__category_mv').position().top > $('.CCM005_Html .dc__category_mv').children().position().top) {
                $('.CCM005_Html .dc__category_mv').css({
                    marginTop: $('body').css('paddingTop')
                });
            }
        }
    }());

    // プレミアのicon 差し替え
    (function() {
        var $target = $('#homePressList');

        if ($target.length !== 0) {
            $target.find('.dc__text_list').each(function() {
                if ($(this).find('a').length !== 0) {
                    $(this).removeClass('icon_angle_right');
                    $(this).addClass('icon_page');
                }
            });

            $target.find('a').attr('target', '_blank');
        }
    }());

    //「ご入会・ご利用キャンペーン」「キャンペーン一覧用（ご入会キャンペーン）」コンポーネントボタンのアイコンを「>」に差替え対応
    (function() {
        var $target = $('.dc__cp_nav_01,.dc__cp_nav_02');

        if ($target.length !== 0) {
            $target.find('a.dc__btn').each(function() {
                $(this).removeClass('icon_page');
                $(this).addClass('icon_angle_right');
            });
        }
    }());

    //トップ新規向けカードラインナップ導線追加
    (function() {
        var $target = $('.CIX025_JoinAndAvailableCampaign');
        var $addcode = '<div class="dc__fixed_content dc__grid_02 dc__comp_mtb dc__btn_addconv"><div class="dc__row"><div class="dc__col dc__col_6"><div class="free_area"><div class="GridPar1 parsys"><div class="CCM009_Button section"><div class="dc__ele_btn dc__btn_mt dc__text_center "><p><a class="dc__btn icon_angle_right dc__btn_blue dc__btn_big dc__w_320 " href="/ja/cardlineup.html?newbtn">カードラインナップを見る</a></p></div></div></div></div></div><div class="dc__col dc__col_6"><div class="free_area"><div class="GridPar2 parsys"><div class="CCM009_Button section"><div class="dc__ele_btn dc__btn_mt dc__text_center "><p><a class="dc__btn icon_angle_right dc__btn_blue dc__btn_big dc__w_320 " href="/ja/cpn_evt/new_member.html">ご入会キャンペーン一覧はこちら</a></p></div></div></div></div></div></div></div>';

        if ($target.length !== 0) {
            $target.find('.dc__fixed_content').each(function() {
                $(this).append($addcode);
            });
        }
    }());

    　　 //電話番号自動リンク
    (function() {
        if (navigator.userAgent.indexOf('iPhone') != -1 || navigator.userAgent.indexOf('iPad') != -1 || navigator.userAgent.indexOf('iPod') != -1 || navigator.userAgent.indexOf('Android') != -1 || navigator.userAgent.indexOf('Yappli') != -1) {
            $('.dc__tel_number , b').each(function() {
                if ($(this).find('a').length < 1) { //aタグがなかったら
                    var str = $(this).html().replace(/[0-9\-\+]{10,18}/g, function() {
                        var telWithoutHyphen
                        telWithoutHyphen = arguments[0].replace(/\-/g, '');
                        if (arguments[0].match(/^81/)) { //国番号81から始まる場合は「+」付ける「」
                            return '<a href="tel:' + '+' + telWithoutHyphen + '">' + arguments[0] + '</a>';
                        } else if (arguments[0].match(/[0-9\-\+]{10,18}/)) {
                            return '<a href="tel:' + telWithoutHyphen + '">' + arguments[0] + '</a>';
                        } else {
                            return arguments[0];
                        }
                    });
                    $(this).html(str);
                }
            });
        }
    }());

    //Yappliで閲覧時に非表示
    (function() {
        if (navigator.userAgent.indexOf('Yappli') != -1) {
            $(".dc__yappli_non").css("display", "none");
        }
    }());

    //COLリンクCookieがある場合は非表示
    (function() {
        var count_col = Number(Cookies.get("col_signon_count"));
        if (count_col >= 1) {
            $(".dc__colmember_non").css("display", "none");
        }
    }());

    //ロゴ　右クリック禁止
    (function() {
        $('div.dc__logo').on('contextmenu', function(e) {
            return false;
        });
    }());

    //カードラインナップ　画面内の申し込みボタン　画面下部固定で複製
    (function() {
        var btn_code = '<div class="fixed_button"><div class="button_area"><a class="dc__w_250 dc__btn dc__btn_big dc__btn_blue icon_angle_right" href="">このカードを申し込む</a></div></div>';
        if (location.pathname.match(/\/ja\/cardlineup\//) !== null && location.pathname.match(/\/ja\/cardlineup\/(status|nyukai|ginzadiners|jaldiners_new)/) === null) { //カードラインナップ配下のページのみ(一部ページ除く)
            var i = 0;
            $('.dc__btn_blue.dc__btn_big').each(function() {
                i++;
                if (i == 1) {
                    var target_btn = $(this);
                    if (target_btn.attr("href") && target_btn.attr("href").match(/\/JPCRD\/col\//) === null) { //COLは除外
                        var fromURL = target_btn.attr("href");
                        $('.breadcrumb').append(btn_code);
                        $('.fixed_button a').attr("href", fromURL);
                        $('.fixed_button a').text(target_btn.text());
                        if (target_btn.attr("target")) {
                            $('.fixed_button a').removeClass("icon_angle_right");
                            $('.fixed_button a').addClass("icon_page");
                            $('.fixed_button a').attr("target", target_btn.attr("target"));
                        }
                    }
                }
            })
        }
    }());

    //重要なお知らせ 0件時非表示
    (function() {
        if( $(".AES-inform .CIX005_AnnouncementsList > div").length == 0 ){
            $(".AES-inform").hide();
        }
    }());

    //AT対応 PHP iframe読み込み
    (function() {
        var param_name = "cin"; 
        var regex = new RegExp("[?&]" + param_name + "(=([^&#]*)|&|#|$)");
        results = regex.exec( window.location.href );
        if( results && results[2] ){
            var param_value = results[2];
            var pattern = /^\d{1,9}$/;
            var pattern2 = /^(https|http):\/\//;
            if( param_value.match(pattern) ){
                var url_iframe_AT_D = "https://www.diners.co.jp/ja/iframe/blank2.html?kono=" + param_value;
                $('body').append('<iframe src="' + url_iframe_AT_D + '" width="1" height="1" style="display:none"></iframe>');
            }
        }
    }());

    //アプリAndroidサイト内検索ボタン画像⇒テキスト
    (function() {
        if (navigator.userAgent.indexOf('sumitclubapp') != -1 && navigator.userAgent.indexOf('Android') != -1 ) {
            $('form').each(function() {
                if (typeof $(this).attr('action') !== 'undefined'){
                    if( $(this).attr('action').indexOf('search.diners.co.jp') != -1){
                        $(this).removeAttr("target");
                        var input_sub = $(this).find('button');
                        input_sub.children().remove();
                        input_sub.html('<p style="color:#fff">検索</p>');
                        $('.top-footer-search button').css('width', '60px');
                        $('.dc__search_input_submit').html('<p style="color:#fff">検索</p>');
                    }
                }
            });
        }
    }());

});