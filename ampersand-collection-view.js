var _ = require('underscore');
var BBEvents = require('backbone-events-standalone');
var ampExtend = require('ampersand-class-extend');

// options
var options = ['collection', 'el', 'viewOptions', 'view', 'filter', 'reverse'];


function CollectionView(spec) {
    _.extend(this, _.pick(spec, options));
    this.views = [];
    this.listenTo(this.collection, 'add', this._addViewForModel);
    this.listenTo(this.collection, 'remove', this._removeViewForModel);
    this.listenTo(this.collection, 'move sort', this._rerenderAll);
    this.listenTo(this.collection, 'refresh reset', this._reset);
}

_.extend(CollectionView.prototype, BBEvents, {
    // for view contract compliance
    render: function () {
        this._renderAll();
        return this;
    },
    remove: function () {
        _.invoke(this.views, 'remove');
        this.stopListening();
    },
    _getViewByModel: function (model) {
        return _.find(this.views, function (view) {
            return model === view.model;
        });
    },
    _createViewForModel: function (model) {
        var view = new this.view(_({model: model, collection: this.collection}).extend(this.viewOptions));
        this.views.push(view);
        view.parent = this;
        view.renderedByParentView = true;
        view.render();
    },
    _getOrCreateByModel: function (model) {
        return this._getViewByModel(model) || this._createViewForModel(model);
    },
    _addViewForModel: function (model, collection, options) {
        var view = this._getViewByModel(model);
        var matches = this.filter ? this.filter(model) : true;
        if (!matches) {
            return;
        }
        if (!view) {
            view = new this.view(_({model: model, collection: this.collection}).extend(this.viewOptions));
            this.views.push(view);
            view.parent = this;
            view.renderedByParentView = true;
            view.render({containerEl: this.el});
        }
        if (options && options.rerender) {
            this._insertView(view);
        } else {
            this._insertViewAtIndex(view);
        }
    },
    _insertViewAtIndex: function (view) {
        if (!view.insertSelf) {
            var pos = this.collection.indexOf(view.model);
            var modelToInsertBefore, viewToInsertBefore;

            if (this.reverse) {
                modelToInsertBefore = this.collection.at(pos - 1);
            } else {
                modelToInsertBefore = this.collection.at(pos + 1);
            }

            viewToInsertBefore = this._getViewByModel(modelToInsertBefore);

            this.el.insertBefore(view.el, viewToInsertBefore && viewToInsertBefore.el);
        }
    },
    _insertView: function (view) {
        if (!view.insertSelf) {
            if (this.reverse) {
                this.el.insertBefore(view.el, this.el.firstChild);
            } else {
                this.el.appendChild(view.el);
            }
        }
    },
    _removeViewForModel: function (model) {
        var view = this._getViewByModel(model);
        if (!view) {
            return;
        }
        var index = this.views.indexOf(view);
        if (index !== -1) {
            // remove it if we found it calling animateRemove
            // to give user option of gracefully destroying.
            view = this.views.splice(index, 1)[0];
            this._removeView(view);
        }
    },
    _removeView: function (view) {
        if (view.animateRemove) {
            view.animateRemove();
        } else {
            view.remove();
        }
    },
    _renderAll: function () {
        this.collection.each(this._addViewForModel, this);
    },
    _rerenderAll: function (collection, options) {
        this.collection.each(function (model) {
            this._addViewForModel(model, this, _.extend(options, {rerender: true}));
        }, this);
    },
    _reset: function () {
        var newViews = [];
        // get any existing views we may have cached
        if (this.views.length) {
            newViews = this.collection.map(this._getOrCreateByModel);
        }
        var toRemove = _.difference(this.views, newViews);
        toRemove.forEach(this._removeView, this);
        this.views = newViews;
        this.views.forEach(this._insertView, this);
    }
});

CollectionView.prototype.extend = ampExtend;

module.exports = CollectionView;
