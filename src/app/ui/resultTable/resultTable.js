(function( $, app ) {

	var ui = app.ns("ui");

	ui.ResultTable = ui.Table.extend({
		defaults: {
			width: 500,
			height: 400,
			cluster: null
		},

		init: function() {
			this._super();
			this.on("rowClick", this._showPreview_handler);
			this.selectedRow = null;
			$(document).bind("keydown", this._nav_handler);
		},
		remove: function() {
			$(document).unbind("keydown", this._nav_handler);
			this._super();
		},
		attach: function(parent) {
			if(parent) {
				var height = parent.height() || ( $(document).height() - parent.offset().top - 41 ); // 41 = height in px of .uiTable-tools + uiTable-header
				var width = parent.width();
				this.el.width( width );
				this.body.width( width ).height( height );
			}
			this._super(parent);
		},
		showPreview: function(row) {
			row.addClass("selected");
			this.preview = new app.ui.JsonPanel({
				title: i18n.text("Browser.ResultSourcePanelTitle"),
				json: row.data("row")._source,
				onClose: function() { row.removeClass("selected"); }
			});
		},
		_deleteDoc_handler: function(ev) {
			ev.stopPropagation();
			var row = $(ev.target).closest("TR");
			var hit = row.data("row");
			if( !hit || !hit._source ) { return; }
			var src = hit._source;
			var index = src._index;
			var id = src._id;
			if( !index || !id ) { return; }
			if( !window.confirm( i18n.text("Browser.DeleteConfirm", index, id) ) ) { return; }
			var cluster = this.config.cluster;
			if( !cluster ) { return; }
			cluster["delete"]( index + "/_doc/" + id, null,
				function() {
					row.fadeOut(300, function() { row.remove(); });
				},
				function() {
					alert( i18n.text("Browser.DeleteFailed") );
				}
			);
		},
		_nav_handler: function(jEv) {
			if(jEv.keyCode !== 40 && jEv.keyCode !== 38) {
				return;
			}
			this.selectedRow && this.preview && this.preview.remove();
			if(jEv.keyCode === 40) { // up arrow
				this.selectedRow = this.selectedRow ? this.selectedRow.next("TR") : this.body.find("TR:first");
			} else if(jEv.keyCode === 38) { // down arrow
				this.selectedRow = this.selectedRow ? this.selectedRow.prev("TR") : this.body.find("TR:last");
			}
			this.selectedRow && this.showPreview(this.selectedRow);
		},
		_showPreview_handler: function(obj, data) {
			this.showPreview(this.selectedRow = data.row);
		},
		// Override body template to add a Delete button column
		_body_template: function(data, columns) {
			var self = this;
			var hasCluster = !!this.config.cluster;
			return { tag: "TABLE", children: []
				.concat(this._headerRow_template(columns, hasCluster))
				.concat(data.map(function(row) {
					var cells = columns.map(function(column){
						return { tag: "TD", cls: "uiTable-cell", children: [ { tag: "DIV", text: (row[column] || "").toString() } ] };
					});
					if( hasCluster ) {
						cells.push({ tag: "TD", cls: "uiTable-cell uiTable-deleteCell", children: [
							{ tag: "BUTTON", type: "button", cls: "uiTable-deleteBtn", text: i18n.text("Browser.Delete"),
								onclick: self._deleteDoc_handler }
						]});
					}
					return { tag: "TR", data: { row: row }, cls: "uiTable-row", children: cells };
				}))
			};
		},
		_headerRow_template: function(columns, hasDeleteCol) {
			var row = this._super(columns);
			if( hasDeleteCol ) {
				row.children.push({ tag: "TH", cls: "uiTable-header-cell uiTable-deleteCell", children: [{ tag: "DIV", children: [{ tag: "DIV", cls: "uiTable-headercell-text", text: "" }] }] });
			}
			return row;
		}
	});

})( this.jQuery, this.app );
