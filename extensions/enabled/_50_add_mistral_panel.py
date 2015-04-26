# The name of the panel to be added to HORIZON_CONFIG. Required.
PANEL = 'mistral'
# The name of the dashboard the PANEL associated with. Required.
PANEL_DASHBOARD = 'project'
# The name of the panel group the PANEL is associated with.
PANEL_GROUP = 'orchestration'

ADD_INSTALLED_APPS = ['merlin', 'mistral']

# Python panel class of the PANEL to be added.
ADD_PANEL = 'mistral.panel.MistralPanel'

ADD_ANGULAR_MODULES = ['merlin', 'mistral']
ADD_JS_FILES = ['merlin/js/custom-libs/ui-bootstrap-tpls-0.13.0-SNAPSHOT.js',
                'merlin/js/merlin.init.js',
                'merlin/js/merlin.templates.js',
                'mistral/js/mistral.init.js']
