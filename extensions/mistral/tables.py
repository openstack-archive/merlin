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

from django.core.urlresolvers import reverse_lazy, reverse
from django.utils.translation import ugettext_lazy as _
from django.template import defaultfilters
from horizon import tables

from mistral import api


class CreateWorkbook(tables.LinkAction):
    name = 'create'
    verbose_name = _('Create Workbook')
    url = reverse_lazy('horizon:project:mistral:edit', args=())
    icon = 'plus'


class ModifyWorkbook(tables.LinkAction):
    name = 'modify'
    verbose_name = _('Modify Workbook')

    def get_link_url(self, datum):
        return reverse('horizon:project:mistral:edit',
                       args=(self.table.get_object_id(datum),))


class RemoveWorkbook(tables.DeleteAction):
    name = 'remove'
    verbose_name = _('Remove Workbook')
    data_type_singular = _('Workbook')

    def delete(self, request, obj_id):
        return api.remove_workbook(request, obj_id)


class WorkbooksTable(tables.DataTable):
    name = tables.Column('name', verbose_name=_('Workbook Name'))

    def get_object_id(self, datum):
        return datum['id']

    class Meta:
        table_actions = (CreateWorkbook,)
        row_actions = (ModifyWorkbook, RemoveWorkbook)
        name = 'workbooks'
