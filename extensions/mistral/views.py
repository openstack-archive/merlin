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

from django.core.urlresolvers import reverse_lazy
from django import http
from django.views.generic import View
from horizon import tables
from horizon.views import APIView
import yaml

from mistral import api
from mistral import forms as mistral_forms
from mistral import tables as mistral_tables


class CreateWorkbookView(APIView):
    template_name = 'project/mistral/create.html'


class ActionTypesView(View):
    def get(self, request, *args, **kwargs):
        key = request.GET.get('key')
        schema = {
            'option1': ['keyA', 'keyB'],
            'option2': ['keyC', 'keyD'],
            'option3': ['keyE', 'keyF']
        }
        response = http.HttpResponse(content_type='application/json')
        if key:
            response.write(json.dumps(schema.get(key)))
        else:
            response.write(json.dumps(schema.keys()))
        return response


class IndexView(tables.DataTableView):
    template_name = 'project/mistral/index.html'
    table_class = mistral_tables.WorkbooksTable

    def get_data(self):
        return api.list_workbooks(self.request)
