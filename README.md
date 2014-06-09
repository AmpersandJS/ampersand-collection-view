# render-collection

Renders a collection with one view per model within an element in a way that cleans up and unbinds all views when removed.


## install

```
npm install render-collection
```


## usage

```js
var View = require('ampersand-view');
var CollectionRenderer = require('collection-renderer');
var ItemView = require('../item-view');
var templates = require('../templates');


module.exports = View.extend({
    template: templates.messagePage,
    render: function () {
        this.renderWithTemplate();
        this.coll = new CollectionRenderer({
            el: this.get('.messageContainer'),
            collection: this.collection,
            itemView: ItemView
        });
        this.registerSubview(this.coll);
    }
});

```
