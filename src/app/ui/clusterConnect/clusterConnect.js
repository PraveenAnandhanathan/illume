(function( $, app, i18n ) {

	var ui = app.ns("ui");
	var services = app.ns("services");

	ui.ClusterConnect = ui.AbstractWidget.extend({
		defaults: {
			cluster: null
		},
		init: function() {
			this._super();
			this.prefs = services.Preferences.instance();
			this.cluster = this.config.cluster;
			this._clusterHistory = this.prefs.get("app-cluster-history") || [];
			this.el = $.joey(this._main_template());
			this._uriEl = this.el.find(".uiClusterConnect-uri");
			this._userEl = this.el.find(".uiClusterConnect-user");
			this._passEl = this.el.find(".uiClusterConnect-pass");
			this._historyEl = this.el.find(".uiClusterConnect-history");
			this._loadSavedAuth();
			this.cluster.get( "", this._node_handler );
		},

		_loadSavedAuth: function() {
			var saved = this.prefs.get("app-auth") || {};
			if( saved.user ) {
				this._userEl.val( saved.user );
				this._passEl.val( saved.pass || "" );
			}
		},

		_node_handler: function(data) {
			if(data) {
				this.prefs.set("app-base_uri", this.cluster.base_uri);
				if(data.version && data.version.number)
					this.cluster.setVersion(data.version.number);
			}
		},

		_reconnect_handler: function() {
			var base_uri = this._uriEl.val().trim();
			if( !base_uri ) { return; }
			var user = this._userEl.val().trim();
			var pass = this._passEl.val();

			// Save auth credentials to localStorage
			this.prefs.set("app-auth", { user: user, pass: pass });

			// Save cluster address to history (keep last 10)
			var hist = this._clusterHistory.filter(function(u) { return u !== base_uri; });
			hist.unshift(base_uri);
			this._clusterHistory = hist.slice(0, 10);
			this.prefs.set("app-cluster-history", this._clusterHistory);
			this._renderHistory();

			$("body").empty().append(new app.App("body", { id: "es",
				base_uri: base_uri,
				auth_user: user,
				auth_password: pass
			}));
		},

		_renderHistory: function() {
			var self = this;
			this._historyEl.empty();
			if( this._clusterHistory.length === 0 ) { return; }
			this._clusterHistory.forEach(function( uri ) {
				self._historyEl.append(
					$("<div>").addClass("uiClusterConnect-historyItem").text(uri).on("click", function() {
						self._uriEl.val(uri);
						self._reconnect_handler();
					})
				);
			});
		},

		_main_template: function() {
			var self = this;
			return { tag: "SPAN", cls: "uiClusterConnect", children: [
				{ tag: "INPUT", type: "text", cls: "uiClusterConnect-uri", placeholder: "http://localhost:9200",
					onkeyup: function( ev ) {
						if(ev.which === 13) { ev.preventDefault(); self._reconnect_handler(); }
						// show/hide history dropdown
						self._historyEl.toggle( self._uriEl && self._uriEl.val().length === 0 );
					},
					onfocus: function() { self._renderHistory(); self._historyEl.show(); },
					onblur: function() { setTimeout(function(){ self._historyEl.hide(); }, 200); },
					id: this.id("baseUri"), value: this.cluster.base_uri },
				{ tag: "DIV", cls: "uiClusterConnect-history" },
				{ tag: "INPUT", type: "text", cls: "uiClusterConnect-user", placeholder: i18n.text("Header.Username") },
				{ tag: "INPUT", type: "password", cls: "uiClusterConnect-pass", placeholder: i18n.text("Header.Password"),
					onkeyup: function( ev ) { if(ev.which === 13) { ev.preventDefault(); self._reconnect_handler(); } }
				},
				{ tag: "BUTTON", type: "button", text: i18n.text("Header.Connect"), onclick: this._reconnect_handler }
			]};
		}
	});

})( this.jQuery, this.app, this.i18n );

