 ### File structure:
* `extensions` - a directory where all plugin UIs built upon Merln are currently located. Once together Merlin and they stabilize enough, it will make sense to move them out to the repo, where the project's UI is located.
* `merlin`
  * `merlin/test/js` - set of files with jasmine unit-tests for merlin components such as directives, filters,templates and so on.
  * `merlin/static/merlin/templates` - client-side (Angular) templates for panels, groups, fields.
  * `merlin/static/merlin/scss/merlin.scss` - Merlin SASS stylesheets.
  * `merlin/static/merlin/js/custom-libs/` - dir with patched libraries which Merlin use.
  * `merlin/static/merlin/js` - merlin core files.
  * `merlin/static/merlin/js/merlin.directives.js` - file with Merlin directives.
  * `merlin/static/merlin/js/merlin.field.models.js` - a set of useful models of different field types like frozendict, dictionary, directedDictionary, which can be used as a base for app implementation. Model is important for Merlin because it uses  models description to render interface, since models are part of schema.
  * `merlin/static/merlin/js/merlin.filters.js` - a set of additional angular.js filters. They are useful for describing of how panels should be rendered, grouped and extracted.
  * `merlin/static/merlin/js/merlin.init.js` - small file which constructs Merlin. Sets some configuration (like interpolation symbols), sets initial values of a few vars, runs templates prefetching, and so one. In this file Angular 'merlin' module is initialized first time, so it should be loaded before any other scripts defining entities within 'merlin' module.
  * `merlin/static/merlin/js/merlin.panel.models.js` - contains mixins for defining and panipulating panels.
  * `merlin/static/merlin/js/merlin.templates.js` - file with a factory for fetching app templates (for fields, for example), which can be compiled and rendered.
  * `merlin/static/merlin/js/merlin.utils.js`  - a set of methods for work with metadata and objects.


 ### But where are any controllers?
The are in the app. Сore Merlin code currently doesn't define any controllers because all logic is put into the model, i.e. Barricade objects".

 ### How can I use Merlin in my app?
You can take a look at the /mistral/ directory, which contains Workbook builder app based on Merlin. There is some django-code to render view to show dashboard in the Horizon.
And in the `merlin/extensions/mistral/static/mistral` is Merlin based code. `templates/fields` contains definition of additional (Mistral-specific) types of fields.
You can take a look at `merlin/extensions/` directory. In the `/enabled/` dir there is typical panel file to add new panel into Horizon Dashboard.


mistral.init.js contains fetching custom mistral templates for fields. In this file Angular 'mistral' module is initialized first time, so it should be loaded before any other scripts defining entities within 'mistral' module.
mistral.workbook.controllers.js - contains main controller which contains functions for domain-specific actions. For example, actions for creating and initializing Action and Workflow objects.

Lets take a look at the typical definition.
```
'base-input': {
    '@class': fields.dictionary.extend({ // which model we are going to use as prototype
      create: function(json, parameters) {
        var self = fields.dictionary.create.call(this, json, parameters);
        self.setType('frozendict');
        return self;
      }
    }, {
      '@required': false,
      '?': { //'?' is a marker for Barricade MutableObject
        '@class': fields.string.extend({}, {
          '@meta': { '@meta' tells Merlin how to render it
            'row': 0
          }
        })
      },
      '@meta': {
        'index': 2,
        'title': 'Base Input'
      }
    })
},
```

 ### Merlin directives:
  * editable: allows to edit field name in-place. For example, you have a field named 'Input 1' and you want to replace this name with "Base input" value. If you add editable directive to such field, you will get a marker icon near this field, and with clicking on this icon you can type new name and save or discard changes.
  * showFocus: this directive auto-sets the focus to an input field once it is shown.
  * panel: tells Merlin to render this element as a panel.
  * collapsibleGroup: tells Merlin to render this element as a group with ability to collapse.
  * validatableWith: sets up the DOM nodes related to validation of model being edited in this widget (and specifies the name of this model on scope).
  * typedField: retrieves a template by its name which is the same as model's type and renders it, recursive <typed-field></..>-s are possible.

 ### Merlin filters:
  * extractPanels, extractItems, extractRows - used to unpack data from Barricade.js format 
into format for convenient template rendering. Also, you can apply a few filters for one Barricade object.

 ### Glossary:

  * Schema - is a main object for describing structure of a model. This object describes how fields and containers are bounded between themselfs, and how the are being modified.
Merlin use schema to validate user input, render forms, fields and models. If you want to define, that if user sets field "type" for "action", that first field in the form should be "Base" - scheme is the place where you should to define it.
  * Model - is a prototype for field. Model could describe a different types of fields: strings, text (large string), numer, dictionary, frozendictionary (immutable dictionary), and so on.
  * Using models helps to render and validate fields. Uou can extend existing models and create your custom field types. Barricade.js object becames an Merlin object when we add modelMixin.
Field - is an atom of form. Should be inherited from some model (Merlin model or your custom model).
  * Panel - visual group of containers.
  * Container - Barricade-specific object type (immutable objects, arrays, mutable objects).

 ### The final structure of UI is defined by:
  * the schema
  * the actual data this schema is paired with to create Barricade object
  * filters and directives being used in an html for rendering the Barricade object provided on the scope

 ### How does Merlin know how to render field, panel or group?
Merlin uses templates for this. Each type of field has its own template with html and css-markup, so you can define filters, directives, on-click events, and rules for filling variables for each type of field.
The same mechanism is implemented for groups and panels.

 ### How does Merlin gets/sets model value with barricade.js?
Each model has getter/setter, so, when you acces to model.value field, if you doing it without param, you callin getter, if you pass any param - you calling a setter. For proper work of this feature we have to use ng-model-options="{getterSetter: true}" ability of angular.js.
Currently angular-ui bootstrap library has a bug which doesn't allow use getterSetter: true, and since it is a problem for autosuggestion feature, we filed a bug (and a patch) to the angular-ui repo (ling), and until it will not be released, we managed to use patched version of this library.
That's why we have ui-bootstrap-tpls-0.13.0.patched.js file in custom-lib directory.

 ### What about testing?
We have basic tests for directives, filters, templates and utils. They implemented with jasmine framework and can be runned with Karma runner (see karma-unit.conf.js for more details).
We also use Grunt for concatenation and minification tasks. Also unit tests could be runned with grunt. Type `grunt karma` in your terminal to run tests.