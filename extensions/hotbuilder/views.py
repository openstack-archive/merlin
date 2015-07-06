# Copyright 2014 Rackspace
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json

from django.views.generic import TemplateView, View
from django.http import HttpResponse

from hotbuilder import api


class JSONView(View):
    def get_data(self, request, *args, **kwargs):
        pass
        
    def get(self, request, *args, **kwargs):
        return HttpResponse(
            json.dumps(self.get_data(request, *args, **kwargs)),
            content_type='application/json')


class ResourceTypesView(JSONView):
    def get_data(self, request, *args, **kwargs):
        return [resource.resource_type for resource in
                api.resource_type_list(request)]


class ShowResourceView(JSONView):
    def get_data(self, request, *args, **kwargs):
        return api.resource_type_show(request, kwargs['resource_type'])


class IndexView(TemplateView):
    template_name = 'hotbuilder/index.html'
