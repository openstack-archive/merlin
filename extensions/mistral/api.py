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

from horizon.test import utils as test_utils

from mistral import models


def create_workbook(request, name, yaml):
    wb = models.Workbook.objects.create(name=name, yaml=yaml)
    wb.save()
    return True


def modify_workbook(request, id, name, yaml):
    try:
        wb = models.Workbook.objects.get(id=id)
        wb.name = name
        wb.yaml = yaml
        wb.save()
    except models.Workbook.DoesNotExist:
        return False

    return True


def remove_workbook(request, id):
    models.Workbook.objects.get(id=id).delete()


def list_workbooks(request):
    return models.Workbook.objects.values('id', 'name')


def get_workbook(request, id):
    try:
        return models.Workbook.objects.get(id=id)
    except models.Workbook.DoesNotExist:
        return None
