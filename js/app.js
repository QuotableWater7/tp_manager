//  these should have been wrapped in config variable... oops
var en;
var catalog_id = "CAEHUMS13FE7C46FDE";
var pageStart = 0
var numDisplay = 20;		//  used to track user paging
var selected_catalog = "";
var api_key = "";


$(document).ready(function() {
	_html = _.template($("#tp-selector-tmpl").html(), "");
	showView("tp-selector-view", _html);

	// ------- Event Handlers ------- //
	$(".list-tps").click(function() {
		//var api_key = $("#tp-id").val() === "" ? "CXUQGUSG0ZNDWJQGH" : $("#tp-id").val();
		api_key = $("#tp-id").val();
		en = new EchoNest(api_key);
		listCatalogs(api_key);
	});

	$(".nav-pills li").click(function() {
		$("div.view").each(function(index, el) {
			if (!_.contains(el.className, "hide-view")) {
				$(el).addClass("hide-view");
			}
		});

		var view = $(this).attr("id");
		showView(view);
	});

	$(window).keydown(function(event) {
	    if(event.keyCode == 13) {
			event.preventDefault();
			/*if (!$("#search-artist").attr("disabled")) {
			  $("#results").html("");
			  searchArtist($("#artist").val());
			}*/
		    return false;
		}
	});
});

function createCatalog(name) {
	en.catalog.create(name,
		function(data) {
			listCatalogs(api_key);
			$("#err-create-tp").addClass("hide-view");
		},
		function(err) {
			$("#err-create-tp").removeClass("hide-view").html(err.response.status.message);
		}
	);
}

function listCatalogs(api_key) {
	en.catalog.list(api_key, 
		function(data) {
			$("#err-tp-selector").addClass("hide-view");
			console.log("response", data.response);

			//  make it possible to create a TP
			_html = _.template($("#create-tp-tmpl").html(), "");
			$("div.create-tp-view").html(_html);

			$("#create-tp").click(function() {
				createCatalog($("#tp-name").val());
			});

			//  handle catalogs html

			var _html = _.template($("#catalog-item-tmpl").html(), data.response);
			showView("tp-list-view", _html);

			$(".view-tp").click(function() {
				viewCatalog(this.id, 0);
			});

			$(".delete-tp").click(function() {
				deleteCatalog(this.id);
			});
		}, 
		function(err) {
			$("#err-tp-selector").removeClass("hide-view").text("That API key does not exist.  Try again.");
		}
	);
}

function viewCatalog(catalog_id, start) {
	//  reset pageStart if the catalog ID is changing
	if (catalog_id != selected_catalog) {
		pageStart = 0;
	}
	selected_catalog = catalog_id;

	en.catalog.read(catalog_id, start, numDisplay, "",
		function(data) {
			window.scrollTo(0,0);

			_html = _.template($("#artist-tmpl").html(), data.response.catalog);
			showView("catalog-contents-view", _html);

			rTotal = data.response.catalog.total;

			$("#add-artist").click(function() {
				searchArtist($("#artist").val());
			});

			$(".catalog-contents-view i.icon-remove").click(function() {
				deleteFromCatalog(this.id);
				$(this).parent().remove();
			});

			//  hacky thing to page results
			$(".page").click(function() {
				if (this.className.indexOf("page-left") != -1) {
					if (pageStart - 20 >= 0) {
						pageStart -= 20;
						viewCatalog(selected_catalog, pageStart);
					}
				} else {
					if (pageStart + 20 < rTotal) {
						pageStart += 20;
						viewCatalog(selected_catalog, pageStart);
					}
				}

			});
		},
		function(err) {

		}
	);
}

function deleteCatalog(catalog_id) {
	en.catalog.delete(catalog_id,
		function(data) {
			listCatalogs(api_key);
		},
		function(err) {

		}
	);
}

function searchArtist(artist_name) {
	var now = new Date();
	date_str = now.getTime().toString();
	
	en.artist.search({name: artist_name},
		function(data) {
			if (data && data.response && data.response.artists) {
				newHtml = _.template($("#add-artist-tmpl").html(), data.response);
				$("#results").html(newHtml);
				
				$("#plus-artist").click(function() {
					var artist_id = $("#artist-select").find(":selected").attr("name");
					var artist_name = $("#artist-select").find(":selected").text();
					var update_json = [{action: "update", item: {item_id: "item-" + date_str, artist_id: artist_id}}];
					console.log(update_json);
					
				
					//  add to taste profile
					en.catalog.update(
						selected_catalog, 
						update_json, 
						function(data) {
							$("#results").html("<b>" + artist_name + "</b> added to Taste Profile.<br/>");

							//  poll until success, then update view
							en.catalog.pollForStatus(
								data.response.ticket,
								function(data) {
									viewCatalog(selected_catalog, 0);
								},
								function(err) {

								});
						}, 
						function(err) {
							console.log(err)
						}
					);
					
					return false;
				});
			}
		}, 
		function(err) {

		}
	);
}

function deleteFromCatalog(item_id) {
	update_json = [{action: "delete", item: {item_id: item_id}}];

	en.catalog.update(
		selected_catalog,
		update_json,
		function(data) {
			viewCatalog(selected_catalog, 0);
		},
		function(err) {

		}
	);
}

function showView(whichView, html) {
	//  ------ Manage views -------  //
	$("div.view").each(function(index, el) {
		if (!_.contains(el.className, "hide-view")) {
			$(el).addClass("hide-view");
		}
	});

	var $view = $("div." + whichView);
	$view.removeClass("hide-view");

	if (html)
		$view.html(html);
	

	//  ------ Manage Nav Tabs ------  //
	$(".nav-pills li").each(function(idx, el) {
		$(el).removeClass("active");
	});

	$("li." + whichView).addClass("active");
}