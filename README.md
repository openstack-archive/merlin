# Instructions on integrating Merlin extensions into Horizon
Although the repo contains directories meant to be used as Django apps
(with templates, static files, urls & views), the whole project is not
meant to be run as a standalone Django web-application (with its own
settings.py etc). Instead, it should be embedded into running Horizon
instance. To do so you should perform the following steps:

1. The easiest way to always use the latest version of Merlin is by using
symlinks. Identify the directory where ``openstack_dashboard`` and ``horizon``
reside. Let's assume this is ``/usr/lib/python2.7/site-packages`` and merlin
repo is located at ``/home/user/dev/merlin``. Then run the
following commands
   ```
   # for main Merlin sources
   ln -s /home/user/dev/merlin/merlin /usr/lib/python2.7/site-packages/merlin
   # for files of the Merlin's Mistral extension
   ln -s /home/user/dev/merlin/extensions/mistral /usr/lib/python2.7/site-packages/mistral
   ```

2. Next thing to do is add panel with Mistral Workbook builder (a Merlin
extension) into Horizon. To do it, copy the pluggable config for the Mistral
panel:
   ```
   cp /home/user/dev/merlin/extensions/enabled/_50_add_mistral_panel.py /usr/lib/python2.7/site-packages/openstack_dashboard/enabled/
   ```

3. This step is TEMPORARY and will be needed until the real API for listing/ loading/ saving 
of Mistral workbooks is implemented. You need to add the following setting to the top of
``/home/user/dev/horizon/openstack_dashboard/local/local_settings.py``
   ```
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.sqlite3',
           'NAME': 'horizon.sqlite3'
       }
   }
   ```

   and run ``/home/user/dev/horizon/manage.py syncdb`` after that.
4. Restart Horizon web-server. According to the default values in
``_50_add_mistral_panel.py`` you would be able to **Mistral** panel inside
the **Project** dashboard, **Orchestration** panel group.

# How to run Merlin unit-tests locally
1. ``cd /home/user/dev/merlin``
2. ``npm install``
  * If npm is not installed yet, run ``sudo apt-get install npm`` (let's assume you're
  using Ubuntu) and ``sudo apt-get install nodejs-legacy``
3. ``node_modules/.bin/bower install``
4. ``sudo npm install -g grunt-cli``
5. ``grunt test:unit``

# Glossary:

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


 ### Merlin filters:
  * extractPanels, extractItems, extractRows - used to unpack data from Barricade.js format
into format for convenient template rendering. Also, you can apply a few filters for one Barricade object.

# FAQ
 ### But where are any controllers?
The are in the app. Сore Merlin code currently doesn't define any controllers because all logic is put into the model, i.e. Barricade objects".

 ### How can I use Merlin in my app?
You can take a look at the `/mistral/` directory, which contains Workbook builder app based on Merlin. There is some django-code to render view to show dashboard in the Horizon.
And in the `merlin/extensions/mistral/static/mistral` is Merlin based code. `templates/fields` contains definition of additional (Mistral-specific) types of fields.
You can take a look at `merlin/extensions/` directory. In the `/enabled/` dir there is typical panel file to add new panel into Horizon Dashboard.
`mistral.init.js` contains fetching custom mistral templates for fields. In this file Angular 'mistral' module is initialized first time, so it should be loaded before any other scripts defining entities within 'mistral' module.
`mistral.workbook.controllers.js` - contains main controller which contains functions for domain-specific actions. For example, actions for creating and initializing Action and Workflow objects.

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

 ### How does Merlin know how to render field, panel or group?
Merlin uses templates for this. Each type of field has its own template with html and css-markup, so you can define filters, directives, on-click events, and rules for filling variables for each type of field.
The same mechanism is implemented for groups and panels.

 ### How does Merlin gets/sets model value with barricade.js?
Each model has getter/setter, so, when you access to model.value field, if you doing it without param, you calling getter, if you pass any param - you calling a setter. For proper work of this feature we have to use ng-model-options="{getterSetter: true}" ability of angular.js.
Currently angular-ui bootstrap library has a bug which doesn't allow use getterSetter: true, and since it is a problem for autosuggestion feature, we filed a bug (and a patch) to the angular-ui repo (ling), and until it will not be released, we managed to use patched version of this library.
That's why we have ui-bootstrap-tpls-0.13.0.patched.js file in custom-lib directory.

 ### And what about testing?
We have basic tests for directives, filters, templates and utils. They implemented with jasmine framework and can be runned with Karma runner (see karma-unit.conf.js for more details).
We also use Grunt for concatenation and minification tasks. Also unit tests could be runned with grunt. Type `grunt karma` in your terminal to run tests.
For more info please refer to https://wiki.openstack.org/wiki/Merlin
