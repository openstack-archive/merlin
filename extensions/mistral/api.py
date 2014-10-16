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


_workbooks = []


def find_max_id():
    max_id = 0
    for workbook in _workbooks:
        if max_id < int(workbook.id):
            max_id = int(workbook.id)

    return max_id


def create_workbook(request, json):
    name = json['name']
    for workbook in _workbooks:
        if name == workbook['name']:
            raise LookupError('Workbook with that name already exists!')

    obj = test_utils.ObjDictWrapper(id=find_max_id()+1, **json)
    _workbooks.append(obj)
    return True


def modify_workbook(request, json):
    id = json['id']
    for i, workbook in enumerate(_workbooks[:]):
        if unicode(id) == unicode(workbook.id):
            _workbooks[i] = test_utils.ObjDictWrapper(**json)
            return True

    return False


def remove_workbook(request, id):
    for i, workbook in enumerate(_workbooks[:]):
        if unicode(id) == unicode(workbook.id):
            del _workbooks[i]
            return True

    return False


def list_workbooks(request):
    return _workbooks


def get_workbook(request, id):
    for workbook in _workbooks:
        if unicode(id) == unicode(workbook.id):
            return workbook.__dict__

    return None
