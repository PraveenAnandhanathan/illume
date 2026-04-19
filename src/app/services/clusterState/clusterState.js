	(function( app ) {

	var services = app.ns("services");
	var ux = app.ns("ux");

	services.ClusterState = ux.Observable.extend({
		defaults: {
			cluster: null
		},
		init: function() {
			this._super();
			this.cluster = this.config.cluster;
			this.clusterState = null;
			this.status = null;
			this.nodeStats = null;
			this.clusterNodes = null;
		},
		refresh: function() {
			var self = this, clusterState, status, nodeStats, clusterNodes, clusterHealth;
			// Track which requests have resolved (success or handled failure)
			var resolved = { clusterState: false, status: false, nodeStats: false, clusterNodes: false, clusterHealth: false };
			function updateModel() {
				// Fire once all requests have resolved — even those that failed gracefully
				if( resolved.clusterState && resolved.status && resolved.nodeStats && resolved.clusterNodes && resolved.clusterHealth ) {
					self.clusterState = clusterState;
					self.status = status || { _shards: { successful: 0, total: 0 }, indices: {} };
					self.nodeStats = nodeStats || { nodes: {} };
					self.clusterNodes = clusterNodes || { nodes: {} };
					self.clusterHealth = clusterHealth || { status: "grey" };
					self.fire( "data", self );
				}
			}
			var _cluster = this.cluster;
			_cluster.get("_cluster/state", function( data ) {
				clusterState = data;
				resolved.clusterState = true;
				updateModel();
			}, function() {
				_cluster.get("_all", function( data ) {
					clusterState = {routing_table:{indices:{}}, metadata:{indices:{}}};
					for(var k in data) {
						clusterState["routing_table"]["indices"][k] = {"shards":{"1":[{
                            "state":"UNASSIGNED",
                            "primary":false,
                            "node":"unknown",
                            "relocating_node":null,
                            "shard":'?',
                            "index":k
                        }]}};
						clusterState["metadata"]["indices"][k] = {};
						clusterState["metadata"]["indices"][k]["mappings"] = data[k]["mappings"];
						clusterState["metadata"]["indices"][k]["aliases"] = $.makeArray(Object.keys(data[k]["aliases"]));
						clusterState["metadata"]["indices"][k]["settings"] = data[k]["settings"];
					}
					resolved.clusterState = true;
					updateModel();
				}, function() {
					// Both _cluster/state and _all failed — mark resolved with empty state
					clusterState = {routing_table:{indices:{}}, metadata:{indices:{}}};
					resolved.clusterState = true;
					updateModel();
				});
			});
			this.cluster.get("_stats", function( data ) {
				status = data;
				resolved.status = true;
				updateModel();
			}, function() {
				// _stats may return 403 with xpack basic — treat as non-fatal
				resolved.status = true;
				updateModel();
			});
			this.cluster.get("_nodes/stats", function( data ) {
				nodeStats = data;
				resolved.nodeStats = true;
				updateModel();
			}, function() {
				resolved.nodeStats = true;
				updateModel();
			});
			this.cluster.get("_nodes", function( data ) {
				clusterNodes = data;
				resolved.clusterNodes = true;
				updateModel();
			}, function() {
				resolved.clusterNodes = true;
				updateModel();
			});
			this.cluster.get("_cluster/health", function( data ) {
				clusterHealth = data;
				resolved.clusterHealth = true;
				updateModel();
			}, function() {
				resolved.clusterHealth = true;
				updateModel();
			});
		},
		_clusterState_handler: function(state) {
			this.clusterState = state;
			this.redraw("clusterState");
		},
		_status_handler: function(status) {
			this.status = status;
			this.redraw("status");
		},
		_clusterNodeStats_handler: function(stats) {
			this.nodeStats = stats;
			this.redraw("nodeStats");
		},
		_clusterNodes_handler: function(nodes) {
			this.clusterNodes = nodes;
			this.redraw("clusterNodes");
		},
		_clusterHealth_handler: function(health) {
			this.clusterHealth = health;
			this.redraw("status");
		}
	});

})( this.app );
