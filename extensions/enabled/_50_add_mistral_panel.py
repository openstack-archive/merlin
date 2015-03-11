# The name of the panel to be added to HORIZON_CONFIG. Required.
PANEL = 'mistral'
# The name of the dashboard the PANEL associated with. Required.
PANEL_DASHBOARD = 'project'
# The name of the panel group the PANEL is associated with.
PANEL_GROUP = 'orchestration'

ADD_INSTALLED_APPS = ['merlin', 'mistral']

# Python panel class of the PANEL to be added.
ADD_PANEL = 'mistral.panel.MistralPanel'

ADD_ANGULAR_MODULES = ['angular.filter']
ADD_JS_FILES = ['merlin/lib/angular-filter.js', 'merlin/js/lib/ui-bootstrap-tpls-0.12.0.js']
