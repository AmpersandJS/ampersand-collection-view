/*global document*/
var test = require('tape');
var AmpCollection = require('ampersand-collection');
var AmpModel = require('ampersand-model');
var AmpView = require('ampersand-view');
var CollectionView = require('../ampersand-collection-view');


// test data
var data = [
    {id: 1, name: 'mary', age: 20},
    {id: 2, name: 'sue', age: 25},
    {id: 3, name: 'dave', age: 30}
];

// item model
var Person = AmpModel.extend({
    props: {id: 'number', name: 'string', age: 'number'},
    derived: {
        isStillYoung: {
            deps: ['age'],
            fn: function () {
                return this.age <= 20;
            }
        }
    }
});

// collection for that model
var Collection = AmpCollection.extend({
    model: Person,
    last: function () {
        return this.models[this.models.length - 1];
    },
    first: function () {
        return this.models[0];
    }
});

var ItemView = AmpView.extend({
    template: '<div></div>',
    bindings: {
        'model.name': ''
    },
    render: function () {
        this.renderWithTemplate();
        this.el.id = '_' + this.model.id;
        return this;
    }
});

var AlternativeItemView = AmpView.extend({
    template: '<span></span>',
    bindings: {
        'model.name': ''
    }
});

var MainView = AmpView.extend({
    initialize: function () {
        this.el = document.createElement('div');
        this.el.id = 'container';
        this.collection = new Collection(data);
    },
    render: function (opts) {
        this.el.innerHTML = '<ul></ul>';
        this.renderCollection(this.collection, ItemView, this.query('ul'), opts);
        return this;
    }
});

function getRendered(view) {
    return Array.prototype.slice.call(view.el.querySelectorAll('div'));
}

function numberRendered(view) {
    return getRendered(view).length;
}

test('should render all when calling `render`', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var cv = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    t.equal(cv.el.innerHTML, '');
    cv.render();
    t.equal(cv.el.innerHTML, '<div id="_1">mary</div><div id="_2">sue</div><div id="_3">dave</div>');
    t.end();
});

test('should render different view based on a given expression', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var cv = new CollectionView({
        el: div,
        collection: coll,
        view: function (options) {
            if (options.model.isStillYoung) {
                return new AlternativeItemView(options);
            }

            return new ItemView(options);
        }
    });
    t.equal(cv.el.innerHTML, '');
    cv.render();
    t.equal(cv.el.innerHTML, '<span>mary</span><div id="_2">sue</div><div id="_3">dave</div>');
    t.end();
});

test('should call `remove` on view corresponding to removed model', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var cv = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    var count = 0;
    cv.render();
    t.equal(cv.views.length, 3);
    var firstView = cv.views[0];
    firstView.remove = function () {
        count++;
    };
    coll.remove(coll.at(0));
    t.equal(cv.views.length, 2);
    t.equal(count, 1, 'remove should have been called once');
    t.end();
});

test('adding to collection should work', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var cv = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    cv.render();
    var firstView = cv.views[0];
    var firstEl = firstView && firstView.el;

    coll.add({name: 'henrik', id: 4});
    t.equal(cv.views.length, 4);
    t.equal(cv.el.innerHTML, '<div id="_1">mary</div><div id="_2">sue</div><div id="_3">dave</div><div id="_4">henrik</div>');
    t.equal(cv.views[0], firstView);
    t.equal(cv.views[0].el, firstEl);

    t.end();
});

test('adding at specific index should work', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var cv = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    cv.render();

    coll.add({name: 'henrik', id: 4}, { at: 1 });
    t.equal(cv.el.innerHTML, '<div id="_1">mary</div><div id="_4">henrik</div><div id="_2">sue</div><div id="_3">dave</div>');

    t.end();
});

test('add', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var view = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    view.render();
    view.collection.add({id: 6});
    t.equal(numberRendered(view), view.collection.length);
    t.end();
});

test('remove', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var view = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    view.render();
    view.collection.remove(view.collection.models[view.collection.models.length - 1]);
    t.equal(numberRendered(view), view.collection.length);
    t.end();
});

test('reset', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var view = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    view.render();
    t.equal(numberRendered(view), 3);

    view.collection.reset();
    t.equal(numberRendered(view), view.collection.length);
    t.equal(numberRendered(view), 0);

    view.collection.reset([
        {id: 10, name: 'mary', age: 20},
    ]);
    t.equal(view.collection.length, 1);
    t.equal(view.views.length, 1);
    t.equal(numberRendered(view), 1);

    t.end();
});

test('sort and resort', function (t) {
    var domIds = [];
    var coll = new Collection(data);
    var div = document.createElement('div');
    var view = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    view.render();

    // Sort by name
    view.collection.comparator = function (model) {
        return model.get('name');
    };
    view.collection.sort();

    // All elements rendered and in order of name
    t.equal(numberRendered(view), view.collection.length);
    domIds = [];
    getRendered(view).forEach(function (el) {
        domIds.push(Number(el.id.slice(1)));
    });
    t.deepEqual(domIds, [3, 1, 2]);

    // Sort by age
    view.collection.comparator = function (model) {
        return model.get('age');
    };
    view.collection.sort();

    // All elements rendered and in order of name
    t.equal(numberRendered(view), view.collection.length);
    domIds = [];
    getRendered(view).forEach(function (el) {
        domIds.push(Number(el.id.slice(1)));
    });
    t.deepEqual(domIds, [1, 2, 3]);

    t.end();
});

test('sort and resort reversed', function (t) {
    var domIds = [];
    var coll = new Collection(data);
    var div = document.createElement('div');
    var view = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView,
        reverse: true
    });
    view.render();

    // Sort by name
    view.collection.comparator = function (model) {
        return model.get('name');
    };
    view.collection.sort();

    // All elements rendered and in order of name
    t.equal(numberRendered(view), view.collection.length);
    domIds = [];
    getRendered(view).forEach(function (el) {
        domIds.push(Number(el.id.slice(1)));
    });
    t.deepEqual(domIds, [2, 1, 3]);

    // Sort by age
    view.collection.comparator = function (model) {
        return model.get('age');
    };
    view.collection.sort();

    // All elements rendered and in order of name
    t.equal(numberRendered(view), view.collection.length);
    domIds = [];
    getRendered(view).forEach(function (el) {
        domIds.push(Number(el.id.slice(1)));
    });
    t.deepEqual(domIds, [3, 2, 1]);

    t.end();
});

test('animateRemove', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var view = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    view.render();
    var prevAnimateRemove = ItemView.prototype.animateRemove;
    ItemView.prototype.animateRemove = function () {
        var self = this;
        this.el.className = 'fadeOut';
        setTimeout(function () {
            self.remove();
        }, 100);
        t.ok('animateRemove called');
    };
    view.collection.remove(view.collection.last());
    setTimeout(function () {
        t.equal(numberRendered(view), view.collection.length);
        // set it back
        ItemView.prototype.animateRemove = prevAnimateRemove;
        t.end();
    }, 150);
});

test('filtered', function (t) {
    var view = new MainView();
    view.render({
        filter: function (model) {
            return model.get('name').length > 3;
        }
    });
    t.equal(numberRendered(view), 2);
    t.end();
});

test('reversed', function (t) {
    var view = new MainView();
    view.render({
        reverse: true
    });
    var domIds = [];
    getRendered(view).forEach(function (el) {
        domIds.push(Number(el.id.slice(1)));
    });
    t.deepEqual(domIds, [3, 2, 1]);
    t.end();
});

test('cleanup', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    var view = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView
    });
    view.render();
    t.equal(numberRendered(view), view.collection.length);
    var firstModel = view.collection.first();
    var firstView = view.views[0];
    firstView.listenTo(firstModel, 'change:something', function () {});
    t.equal(view.collection.first()._events['change:something'].length, 1);
    view.remove();
    // when main view is removed so should registered event handler
    // from subview
    t.notOk(view.collection.first()._events['change:something']);
    t.end();
});

test('child view can choose to insert self', function (t) {
    var view = new MainView();
    ItemView.prototype.insertSelf = true;
    ItemView.prototype.render = function (extraInfo) {
        t.ok(extraInfo.containerEl);
        this.renderWithTemplate();
    };

    view.render();
    t.equal(numberRendered(view), 0, 'Parent should not have rendered anything');
    view.remove();
    t.end();
});

test('helpful exceptions for missing parameters', function (t) {
    var coll = new Collection(data);
    var div = document.createElement('div');
    t.throws(function noParams() {
        new CollectionView();
    }, ReferenceError, 'Collection view missing required parameters: collection, el');
    t.throws(function noCollection() {
        new CollectionView({ el: div });
    }, ReferenceError, 'Collection view requires a collection');
    t.throws(function noCollection() {
        new CollectionView({ collection: coll });
    }, ReferenceError, 'Collection view requires an el');
    t.end();
});

test('should let you pass in `parent`', function (t) {
    var coll = new Collection(data);
    var parent = {};
    var div = document.createElement('div');
    var cv = new CollectionView({
        el: div,
        collection: coll,
        view: ItemView,
        parent: parent
    });
    t.equal(parent, cv.parent);
    t.end();
});

