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

const ingressTemplate = {
    "apiVersion": "extensions/v1beta1",
    "kind": "Ingress",
    "metadata": {
      "namespace": null,
      "name": null,
      "annotations": {
        "kubernetes.io/ingress.class": "traefik",
      }
    },
    "spec": {
      "rules": [
        {
          "host": null,
          "http": {
            "paths": [
              {
                "path": "/",
                "backend": {
                  "serviceName": null,
                  "servicePort": 80
                }
              }
            ]
          }
        }
      ]
    }
  }
  
  
module.exports.newIngress = function (observed) {
    let ingress = {...ingressTemplate};
    let namespace = observed.parent.metadata.namespace;
    let name = observed.parent.metadata.name;
    let domain = observed.parent.spec.domain;
    ingress.metadata.name = name;
    ingress.metadata.namespace = namespace;
    ingress.spec.rules[0].host = name + "." + domain;
    ingress.spec.rules[0].http.paths[0].backend.serviceName = name;
    return ingress;
};
