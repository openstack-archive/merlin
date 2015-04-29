# Copyright (c) 2014 Mirantis, Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

import json

from django.core.urlresolvers import reverse_lazy, reverse
from django import http
from django.views import generic as generic_views
from horizon import messages
from horizon import tables
from horizon.views import APIView
import yaml

from mistral import api
from mistral import forms as mistral_forms
from mistral import tables as mistral_tables


class EditWorkbookView(APIView):
    template_name = 'project/mistral/create.html'

    def get_context_data(self, workbook_id=None, **kwargs):
        commit_ns = 'horizon:project:mistral:commit'
        if workbook_id is None:
            commit_url = reverse(commit_ns, args=())
        else:
            commit_url = reverse(commit_ns, args=(workbook_id,))
        context = {
            'commit_url': commit_url,
            'discard_url': reverse('horizon:project:mistral:index')
            }
        if workbook_id is not None:
            context['id'] = workbook_id
            context['yaml'] = api.get_workbook(self.request, workbook_id).yaml
        return context


class CommitWorkbookView(generic_views.View):
    def post(self, request, workbook_id=None, **kwargs):
        def read_data():
            data = json.loads(request.read())
            return data['name'], data['yaml']

        if workbook_id is None:
            name, yaml = read_data()
            api.create_workbook(request, name, yaml)
            message = "The workbook {0} has been successfully created".format(
                name)
        else:
            name, yaml = read_data()
            api.modify_workbook(request, workbook_id, name, yaml)
            message = "The workbook {0} has been successfully modified".format(
                name)
        messages.success(request, message)
        return http.HttpResponseRedirect(
            reverse_lazy('horizon:project:mistral:index'))


class ActionTypesView(generic_views.View):
    def get(self, request, *args, **kwargs):
        key = request.GET.get('key')
        schema = {
            'nova.create_server': ['image', 'flavor', 'network_id'],
            'neutron.create_network': ['name', 'create_subnet'],
            'glance.create_image': ['image_url']
        }
        response = http.HttpResponse(content_type='application/json')
        if key:
            result = schema.get(key)
            if result is None:
                return http.HttpResponse(status=404)
            response.write(json.dumps(schema.get(key)))
        else:
            response.write(json.dumps(schema.keys()))
        return response


class IndexView(tables.DataTableView):
    template_name = 'project/mistral/index.html'
    table_class = mistral_tables.WorkbooksTable

    def get_data(self):
        return api.list_workbooks(self.request)
