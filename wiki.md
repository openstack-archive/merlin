bin - utils scripts. Now contains only one script for checking and install version of node.js. Mostly needed for Jenkins jobs now.

extensions - temporary directory, contains dashboards. Will be moved into separate repo one time.
merlin
  merlin/merlin/test/js - set of files with jasmine unit-tests for merlin components such as directives, filters,templates and so on.
  merlin/merlin/static/merlin/templates - templates for panels, groups, fields.
  merlin/merlin/static/merlin/scss/merlin.scss - scss for Merlin, nothing special.
  merlin/merlin/static/merlin/js/custom-libs/ - dir with patched libraries which Merlin use.
  merlin/merlin/static/merlin/js - merlin core files.
  merlin/merlin/static/merlin/js/merlin.directives.js - file with Merlin directives.
  merlin/merlin/static/merlin/js/merlin.field.models.js - a set of useful models of different field types like frozendict, dictionary, directedDictionary, which can be used as a base for app implementation. Model is important for Merlin because it uses  models description to render interface, since models are part of schema.
  merlin/merlin/static/merlin/js/merlin.filters.js - a set of additional angular.js filters. They are useful for describing of how panels should be rendered, grouped and exctracted.
  merlin/merlin/static/merlin/js/merlin.init.js - small file which constructs Merlin. Sets some configuration (like interpolation symbols), sets initial values of a few vars, runs templates prefetching, and so one.
  merlin/merlin/static/merlin/js/merlin.panel.models.js - contains mixins for defining and panipulating panels.
  merlin/merlin/static/merlin/js/merlin.templates.js - file with a factory for fetching app templates (for fields, for example), which can be compiled and rendered.
  merlin/merlin/static/merlin/js/merlin.utils.js  - a set of methods for work with metadata and objects.
tools/ - a set of scripts for working with venv. Mostly needed for Jenkins jobs now.


 ### But where are any controllers?
The are in the app. Merlin has no controllers, since they are too domain-specific. You can take a look at merlin/extensions/ directory. In the /enabled/ dir there is typycal panel file to add new panel into Horizon Dashboard. 
/mistral/ directory contains Workbook builder app based on Merlin. There is some django-code to render view to show dashboard in the Horizon. And in the merlin/extensions/mistral/static/mistral is Merlin based code. templates/fields contains definition of additional (Mistral-specific) types of fields.

mistral.init.js contains fetching custom mistral teplates for fields.
mistralworkbook.controllers.js - contains main controller which contains functions for domain-specific actions. For example, actions for creating and initialisating Action and Workflow objects. 

Lets take a look at the typycal definition.
Model:
  'field-name': {
   ' 
   }


          'base': {                                 // a fieldname           
            '@class': fields.string.extend({        // the base barricade.js class which we are going to extend ('parent class')
               create: function(json, parameters) { // overrided constructor
                 var self = fields.string.create.call(this, json, parameters),
                   schema = {},
                   url = utils.getMeta(self, 'autocompletionUrl');

                 self.getSchema = function(key) {   // 
                   var deferred = $q.defer();
                   if ( !(key in schema) ) {
                     $http.get(url+'?key='+key).success(function(keys) {
                       schema[key] = keys;
                       deferred.resolve(keys);
                     }).error(function() {
                       deferred.reject();
                     });
                   } else {
                     deferred.resolve(schema[key]);
                   }
                   return deferred.promise;
                 };
                 return self;
               }
             }, {
              '@meta': {
                'index': 1,
                'row': 0,
                'autocompletionUrl': '/project/mistral/actions/types'
              }
            })
          },


 ### Merlin directives:
  * editable: allows to edit field name in-place. For example, you have a field named 'Input 1' and you want to replace this name with "Base input" value. If you add editable directive to such field, you will get a marker icon near this field, and with clicking on this icon you can type new name and save or discard changes.
  * showFocus
  * panel: shows to Merlin that element with this directive should be rendered as a panel.
  * collapsibleGroup: shows to Merlin that element with this directive should be rendered as a group with ability to collapse.
  * validatableWith
  * typedField: gets from template cache template by type name and renders it.

 ### Merlin filters:
  * extractPanels, extractItems, extractRows - used to unpack data from Barricade.js format 
into format for convinient template rendering. Also, you can apply a few filters for one barricade.js object.

 ### Glossary:

  * Schema - is a main object for describing structure of your interface. This object describes how fields and containers are bounded between themselfs, and how the are being modified.
Merlin use schema to validate user input, render forms, fields and models. If you want to define, that if user set field "type" for "action", that first field in the form should be "Base" - scheme is the place where you should to define it.
  * Model - is a prototype for field. Model could describe a different types of fields: strings, text (large string), numer, dictionary, frozendictionary (immutable dictionary), and so on.
  * Using models helps to render and validate fields. Uou can extend existing models and create your custom field types. Barricade.js object becames an Merlin object when we add modelMixin.
Field - is an atom of form. Should be inherited from some model (Merlin model or your custom model).
  * Panel - visual group of containers.
  * Container - Barricade.js object type (immutable objects, arrays, mutable objects). 

 ### How does Merlin know how to render field, panel or gorup?
Merlin uses templates for this. Each type of field has its own template with html and css-markup, so you can define filters, directives, on-click events, and rules for filling variables for each type of field.
The same mechanism is implemented for groups and panels.


 ### How does Merlin gets/sets model value with barricade.js?
Each model has getter/setter, so, when you acces to model.value field, if you doing it without param, you callin getter, if you pass any param - you calling a setter. For proper work of this feature we have to use ng-model-options="{getterSetter: true}" ability of angular.js.
Currently angular-ui bootstrap library has a bug which doesn't allow use getterSetter: true, and since it is a problem for autosuggestion feature, we filed a bug (and a patch) to the angular-ui repo (ling), and until it will not be released, we managed to use patched version of this library.
Thats why we have ui-bootstrap-tpls-0.13.0.patched.js file in custom-lib directory.

 ### What about testing?
We have basic tests for directives, filters, templates and utils. They implemented with jasmine framework and can be runned with Karma runner (see karma-unit.conf.js for more details). 
We also use Grunt for concatenation and minification tasks. Also unit tests could be runned with grunt. Type `grunt karma` in your terminal to run tests.
