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

from horizon import forms
import yaml

from mistral import api


class BaseWorkbookForm(forms.SelfHandlingForm):
    workbook = forms.CharField(widget=forms.HiddenInput,
                               required=False)


class CreateWorkbookForm(BaseWorkbookForm):
    def handle(self, request, data):
        json = yaml.safe_load(data['workbook'])
        return api.create_workbook(request, json)


class EditWorkbookForm(BaseWorkbookForm):
    def handle(self, request, data):
        json = yaml.safe_load(data['workbook'])
        return api.modify_workbook(request, json)
