(function( $, app, i18n ){

	var ui = app.ns("ui");
	var data = app.ns("data");

	ui.Browser = ui.Page.extend({
		defaults: {
			cluster: null  // (required) instanceof app.services.Cluster
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.prefs = services.Preferences.instance();
			this._pageSize = this.prefs.get("browser-pageSize") || 50;
			this._currentPage = 1;
			this.query = new app.data.Query( { cluster: this.cluster, size: this._pageSize } );
			this._refreshButton = new ui.Button({
				label: i18n.text("General.RefreshResults"),
				onclick: function() { this._currentPage = 1; this.query.setPage(1); this.query.query(); }.bind(this)
			});
			this.el = $(this._main_template());
			this._pageSizeEl = this.el.find(".uiBrowser-pageSize");
			this._pageInfoEl = this.el.find(".uiBrowser-pageInfo");
			new data.MetaDataFactory({
				cluster: this.cluster,
				onReady: function(metadata) {
					this.metadata = metadata;
					this.store = new data.QueryDataSourceInterface( { metadata: metadata, query: this.query } );
					this.store.on("data", this._updatePageInfo.bind(this));
					this.queryFilter = new ui.QueryFilter({ metadata: metadata, query: this.query });
					this.queryFilter.attach(this.el.find("> .uiBrowser-filter") );
					this.resultTable = new ui.ResultTable( {
						onHeaderClick: this._changeSort_handler,
						store: this.store,
						cluster: this.cluster
					} );
					this.resultTable.attach( this.el.find("> .uiBrowser-table") );
					this.updateResults();
				}.bind(this)
			});
		},
		updateResults: function() {
			this.query.query();
		},
		_updatePageInfo: function() {
			var total = this.store.meta && this.store.meta.total;
			if( total && typeof total === "object" ) { total = total.value; }
			total = total || 0;
			var totalPages = Math.max(1, Math.ceil(total / this._pageSize));
			this._pageInfoEl.text( "Page " + this._currentPage + " / " + totalPages + "  (" + total + " hits)" );
			this.el.find(".uiBrowser-prevPage").prop("disabled", this._currentPage <= 1);
			this.el.find(".uiBrowser-nextPage").prop("disabled", this._currentPage >= totalPages);
		},
		_changeSort_handler: function(table, wEv) {
			this.query.setSort(wEv.column, wEv.dir === "desc");
			this._currentPage = 1;
			this.query.setPage(1);
			this.query.query();
		},
		_prevPage_handler: function() {
			if( this._currentPage <= 1 ) { return; }
			this._currentPage--;
			this.query.setPage(this._currentPage);
			this.query.query();
		},
		_nextPage_handler: function() {
			this._currentPage++;
			this.query.setPage(this._currentPage);
			this.query.query();
		},
		_changePageSize_handler: function() {
			this._pageSize = parseInt(this._pageSizeEl.val(), 10) || 50;
			this.prefs.set("browser-pageSize", this._pageSize);
			this.query.config.size = this._pageSize;
			this.query.search.size = this._pageSize;
			this._currentPage = 1;
			this.query.setPage(1);
			this.query.query();
		},
		_main_template: function() {
			var self = this;
			return { tag: "DIV", cls: "uiBrowser", children: [
				new ui.Toolbar({
					label: i18n.text("Browser.Title"),
					left: [ ],
					right: [ this._refreshButton ]
				}),
				{ tag: "DIV", cls: "uiBrowser-filter" },
				{ tag: "DIV", cls: "uiBrowser-pagination", children: [
					{ tag: "BUTTON", type: "button", cls: "uiBrowser-prevPage", text: "\u25c4 " + i18n.text("Browser.PrevPage"),
						onclick: function() { self._prevPage_handler(); } },
					{ tag: "SPAN", cls: "uiBrowser-pageInfo" },
					{ tag: "BUTTON", type: "button", cls: "uiBrowser-nextPage", text: i18n.text("Browser.NextPage") + " \u25ba",
						onclick: function() { self._nextPage_handler(); } },
					" " + i18n.text("Browser.PageSize") + " ",
					{ tag: "SELECT", cls: "uiBrowser-pageSize",
						onchange: function() { self._changePageSize_handler(); },
						children: [10, 25, 50, 100, 250, 500].map(function(n) {
							return { tag: "OPTION", value: n, text: n, selected: n === self._pageSize };
						})
					}
				]},
				{ tag: "DIV", cls: "uiBrowser-table" }
			] };
		}
	});

})( this.jQuery, this.app, this.i18n );
