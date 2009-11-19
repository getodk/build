//------------------------------------------------------------------------------
//
// jquery.cloudkit.js source
//
// Copyright (c) 2008, 2009 Jon Crosby http://joncrosby.me
//
// For the complete source with the bundled dependencies,
// run 'rake dist' and use the contents of the dist directory.
//
//------------------------------------------------------------------------------

(function($) {

  $.cloudkit = $.cloudkit || {};

  //----------------------------------------------------------------------------
  // Resource Model
  //----------------------------------------------------------------------------
  var buildResource = function(collection, spec, metadata) {
    var that = {};
    var meta = {};
    var json = spec;

    // return a key that is unique across all local items
    var generateId = function() {
      return (new Date).getTime() + '-' + Math.floor(Math.random()*10000);
    };

    var saveFromRemote = function() {
      meta = metadata;
      meta.id = generateId();
    };

    that.save = function(callbacks) {
      if (!(typeof metadata === 'undefined')) {
        return saveFromRemote();
      }
      $.ajax({
        type: 'POST',
        url: collection,
        data: JSON.stringify(spec),
        contentType: 'application/json',
        dataType: 'json',
        processData: false,
        complete: function(response, statusText) {
          if (response.status == 201) {
            meta = JSON.parse(response.responseText);
            meta.id = generateId();
            callbacks.success();
          } else {
            callbacks.error(response.status);
          }
        }
      });
    };

    that.update = function(spec, callbacks) {
      var id = meta.id;
      $.ajax({
        type: 'PUT',
        url: meta.uri,
        data: JSON.stringify(spec),
        contentType: 'application/json',
        dataType: 'json',
        beforeSend: function(xhr) {
          xhr.setRequestHeader('If-Match', meta.etag);
        },
        processData: false,
        complete: function(response, statusText) {
          if (response.status == 200) {
            meta = JSON.parse(response.responseText);
            meta.id = id;
            json = spec;
            callbacks.success();
          } else {
            // TODO implement default 412 strategy as progressive diff/merge
            callbacks.error(response.status);
          }
        }
      });
    };

    that.destroy = function(callbacks) {
      var id = meta.id
      $.ajax({
        type: 'DELETE',
        url: meta.uri,
        dataType: 'json',
        beforeSend: function(xhr) {
          xhr.setRequestHeader('If-Match', meta.etag);
        },
        processData: false,
        complete: function(response, statusText) {
          meta = JSON.parse(response.responseText);
          meta.id = id;
          if (response.status == 200) {
            meta.deleted = true;
            callbacks.success();
          } else {
            callbacks.error(response.status);
          }
        }
      });
    };

    that.json = function() {
      return json;
    };

    that.id = function() {
      return meta.id;
    };

    that.uri = function() {
      return meta.uri;
    };

    that.isDeleted = function() {
      return (meta.deleted == true);
    }

    return that;
  };

  //----------------------------------------------------------------------------
  // Internal Data Store
  //----------------------------------------------------------------------------
  var buildStore = function(collection) {
    var that = {};

    var key = function(resource) {
      return collection+resource.id();
    };

    var persist = function(resource) {
      var k = key(resource);
      $.data(window, k, resource);
      var index = $.data(window, collection+'index') || [];
      index.push(k);
      $.data(window, collection+'index', index);
    };

    that.create = function(spec, callbacks) {
      resource = buildResource(collection, spec);
      resource.save({
        success: function() {
          persist(resource);
          callbacks.success(resource);
        },
        error: function(status) {
          callbacks.error(status);
        }
      });
    };

    that.createFromRemote = function(spec, metadata) {
      resource = buildResource(collection, spec, metadata);
      resource.save();
      persist(resource);
      return resource;
    };

    that.all = function(spec) {
      // TODO - don't ignore spec
      var result = [];
      var index = $.data(window, collection+'index');
      $(index).each(function(count, id) {
        var item = $.data(window, id);
        if (!item.isDeleted()) {
          result.push(item);
        }
      });
      return result;
    };

    that.get = function(id) {
      return $.data(window, collection+id);
    };

    that.query = function(spec) {
      var jsonObjects = [];
      var self = this;
      $(this.all()).each(function(index, item) {
        json = $.extend(item.json(), {'___id___':item.id()});
        jsonObjects.push(json);
      });
      var query_result = JSONQuery(spec, jsonObjects);
      var resources = []
      $(query_result).each(function(index, item) {
        resources.push(self.get(item['___id___']));
      });
      return resources;
    }

    return that;
  };

  //----------------------------------------------------------------------------
  // Private API
  //----------------------------------------------------------------------------

  var collectionURIs = []; // collection URIs found during boot via discovery
  var collections    = {}; // local stores, one per remote resource collection

  // load remote collection URIs
  var loadMeta = function(callbacks) {
    $.ajax({
      type: 'GET',
      url: '/cloudkit-meta',
      complete: function(response, statusText) {
        data = JSON.parse(response.responseText);
        if (response.status == 200) {
          collectionURIs = data.uris;
          callbacks.success();
        } else if (response.status >= 400) {
          callbacks.error(response.status);
        } else {
          callbacks.error('unexpected error');
        }
      }
    });
  };

  // configure a local collection
  var configureCollection = function(collection) {
    $.data(window, collection+'index', []);
    var name = collection.replace(/^\//, '');
    collections[name] = buildStore(collection);
  };

  // load remote data into local store
  var populateCollectionsFromRemote = function(index, callbacks) {
    if (index == collectionURIs.length) {
      callbacks.success();
      return;
    }
    $.ajax({
      type: 'GET',
      url: collectionURIs[index]+"/_resolved",
      dataType: 'json',
      processData: false,
      complete: function(response, statusText) {
        if (response.status == 200) {
          var resources = JSON.parse(response.responseText).documents;
          var name = collectionURIs[index].replace(/^\//, '');
          for (var i = 0; i < resources.length; i++) {
            var resource = resources[i];
            collections[name].createFromRemote(
              JSON.parse(resource.document),
              {
                uri: resource.uri,
                etag: resource.etag,
                last_modified: resource.last_modified
              }
            );
          }
          populateCollectionsFromRemote(index+1, callbacks);
        } else {
          callbacks.error(response.status);
        }
      }
    });
  };

  // extend jquery
  $.fn.extend($.cloudkit, {

    //--------------------------------------------------------------------------
    // Public API
    //--------------------------------------------------------------------------

    // setup the local store
    boot: function(callbacks) {
      collectionURIs = [];
      collections = [];
      loadMeta({
        success: function() {
          $(collectionURIs).each(function(index, collection) {
            configureCollection(collection);
          });
          populateCollectionsFromRemote(0, {
            success: function() {
              callbacks.success();
            },
            error: function(status) {
              callbacks.error(status);
            }
          });
        },
        error: function(status) {
          callbacks.error(status);
        }
      });
    },

    // return all collections
    collections: function() {
      return collections;
    },

    // return a specific collection
    collection: function(name) {
      return this.collections()[name];
    }
  });
})(jQuery);
