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

from django.utils.translation import ugettext_lazy as _
from django.template import defaultfilters
from horizon import tables

from mistral import api

class CreateWorkbook(tables.LinkAction):
    name = 'create'
    verbose_name = _('Create Workbook')
    url = 'horizon:project:mistral:create'
    classes = ('ajax-modal',)
    icon = 'plus'


class EditWorkbook(tables.LinkAction):
    name = 'edit'
    verbose_name = _('Edit Workbook')
    url = 'horizon:project:mistral:edit'
    classes = ('ajax-modal',)


class RemoveWorkbook(tables.DeleteAction):
    name = 'remove'
    verbose_name = _('Remove Workbook')
    data_type_singular = _('Workbook')

    def delete(self, request, obj_id):
        return api.remove_workbook(request, obj_id)


class WorkbooksTable(tables.DataTable):
    name = tables.Column('name', verbose_name=_('Workbook Name'))
    running = tables.Column('running', verbose_name=_('Running'),
                            filters=(defaultfilters.yesno,))

    class Meta:
        table_actions = (CreateWorkbook, RemoveWorkbook)
        name = 'workbooks'
        row_actions = (EditWorkbook, RemoveWorkbook)
