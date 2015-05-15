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
``openstack_dashboard.settings``
   ```
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.sqlite3',
           'NAME': 'horizon.sqlite3'
       }
   }
   ```

   and run ``openstack-dashboard/manage.py syncdb`` after that.
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

For more info please refer to https://wiki.openstack.org/wiki/Merlin
