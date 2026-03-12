/**
 * カード比較画面への遷移
 * /ja/cardlineup/ の下のページ名あるいはディレクトリ名をカードIDとみなして処理しています
 * /ja/cardlineup/dinersclubcard.html
 * /ja/cardlineup/dinersclubcard/xxxxxx.html
 *                               ~~~~~~~~~~~~~~
 */
$(function(){
  
  var path = location.pathname;
  var isCorporate = path.indexOf('/ja/corporate/') !== -1;
  var underPath = location.pathname.split(/\/cardlineup\//)[1] || '';
  var cardId = underPath.split(/[\/\.]/)[0];

  $(".dc__btn_compare").on("click", function(e){
    e.preventDefault();

    $.cookie("__comparison_card_list", cardId, { path:"/" });
    location.href = isCorporate ? "/ja/corporate/cardlineup/comparison.html" : "/ja/cardlineup/comparison.html";
  });
  
});