$(function() {
	$navigation = $('.navigation');

	// Search Items
	$('#search').on('keyup', function(e) {
		var value = $(this).val();

		if(value === "") {
			// reset search
			$navigation.find('li').show();
			$navigation.find('.itemMembers').hide();
			moveUpAndOpenPageElement();
		}
		else if(value) {
			var regexp = new RegExp(value, 'i');
			$navigation.find('li, .itemMembers').hide();

			$navigation.find('li').each(function(i, v) {
				var $item = $(v);
				var data = $item.data();
				var searchString = ((data.name) ? data.name : "") + ((data.title) ? data.title : "");

				if(searchString.length > 0 && regexp.test(searchString)) {
					$item.show();
					$item.closest('.itemMembers').show();
					$item.closest('.item').show();
				}
			});
		}
		$navigation.find('.list').scrollTop(0);
	});

	// Toggle when click an item element
	$navigation.on('click', '.title', function(e) {
		$(this).parent().find('.itemMembers').toggle();
	});

	function moveUpAndOpenPageElement() {
		// Show an item related a current documentation automatically
		var filename = $('.page-title').data('filename').replace(/\.[a-z]+$/, '').replace(/^module\-/, 'module:');
		var $currentItem = $navigation.find('.item[data-name*="' + filename + '"]:eq(0)');
		if($currentItem.length) {
			$currentItem
				.remove()
				.prependTo('.navigation .list')
				.show()
				.find('.itemMembers')
				.show();
		}
	}
	moveUpAndOpenPageElement();

	// Adding id attributes for h2 in tutorials
	$("section.tutorial article h2").each(function() {
		var $h2 = $(this);
		var title = $h2.text();
		var cssId = title.replace(/ /g, '-').replace(/[^0-9a-zA-Z\-\_]/g, '').toLowerCase();
		$h2.attr("id", cssId);
	});

	// Auto resizing on navigation
	var _onResize = function() {
		var height = $(window).height();
		$navigation.height(height).find('.list').height(height - 109);
	};

	$(window).on('resize', _onResize);
	_onResize();
});