/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const serviceTemplate = {
    "apiVersion": "v1",
    "kind": "Service",
    "metadata": {
      "name": null,
      "namespace": null
    },
    "spec": {
      "ports": [
        {
          "protocol": "TCP",
          "port": 80,
          "targetPort": 80
        }
      ],
      "selector": {
        "run": null
      }
    }
  }
  
  
module.exports.newService = function (observed) {
    let service = {...serviceTemplate};
    let namespace = observed.parent.metadata.namespace;
    let name = observed.parent.metadata.name;
    service.metadata.name = name;
    service.metadata.namespace = namespace;
    service.spec.selector.run = name;
    return service;
};
