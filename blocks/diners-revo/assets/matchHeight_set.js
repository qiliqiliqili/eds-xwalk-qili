$(function(){
	var isiPad = navigator.userAgent.match(/iPad/i) != null;
	if( isiPad ) {
		$('.AccordionPar > .CCM001_Grid > .dc__fixed_content > .dc__row > .dc__col > .free_area').matchHeight();
		$('.CCM019_2columnGrid .dc__layout_6 > .dc__row').matchHeight();
		$('.CCM017_3columnGrid .dc__layout_2 > .dc__row').matchHeight();
		$('.CCM005_Html .dc__col_6 > .free_area').matchHeight();
		$('.CCM005_Html .dc__col_4 > .free_area').matchHeight();
		$('.ContactPar1 > .dc__row > .dc__col_6 > .free_area').matchHeight();

		//アコーディオン
		$(".dc__btn_accordion").on("click", function(){
			$('.AccordionPar .dc__col_6 > .free_area').matchHeight();
			$('.AccordionPar .dc__col_4 > .free_area').matchHeight();
			$.fn.matchHeight._maintainScroll = true;
		});
		//タブ
		$(document).on('click', '.dc__tab_btn', function() {
			$('.ContactPar1 > .dc__row > .dc__col_6 > .free_area').matchHeight();
			$('.CCM005_Html .dc__col_6 > .free_area .CCM001_Grid .dc__col_6 > .free_area').matchHeight({remove: true});
		});

		//モーダル
		$(document).on('click', '.btn_modal', function() {
			$('.CCM026_ModalWindow .CCM005_Html .dc__col_6 > .free_area').matchHeight();
			$('.CCM026_ModalWindow .CCM005_Html .dc__col_4 > .free_area').matchHeight();
			$('.CCM026_ModalWindow .CCM021_Step .dc__col_6 > .free_area').matchHeight();
		});
	}
	//SIGNATURE TOPで使用
	$('.matchHeight').matchHeight();
});