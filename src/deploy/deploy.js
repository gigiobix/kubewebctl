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

const deployTemplate = {
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "metadata": {
      "name": null,
      "namespace": null
    },
    "spec": {
      "replicas": 0,
      "selector": {
        "matchLabels": {
          "run": null
        }
      },
      "strategy": {
        "rollingUpdate": {
          "maxSurge": 1,
          "maxUnavailable": 1
        },
        "type": "RollingUpdate"
      },
      "template": {
        "metadata": {
          "labels": {
            "run": null
          }
        },
        "spec": {
            "initContainers": [
              {
                "name": "git-clone",
                "image": "alpine/git",
                "args": ["clone", "--", null, "/repo"],
                "volumeMounts": [
                  {
                    "name": "content-data",
                    "mountPath": "/repo"
                  }
                ]
              }
            ],
            "containers": [
              {
                "name": "nginx",
                "image": "nginx:latest",
                "volumeMounts": [
                  {
                    "name": "content-data",
                    "mountPath": "/usr/share/nginx/html"
                  }
                ]
              }
            ],
            "volumes": [
              {
                "name": "content-data",
                "emptyDir": {
                }
              }
            ]
        }
      }
    }
  }
  
module.exports.newDeploy = function (observed) {
    let deploy = {...deployTemplate};
    let namespace = observed.parent.metadata.namespace;
    let name = observed.parent.metadata.name;
    let replicas = observed.parent.spec.replicas;
    let gitRepo = observed.parent.spec.gitRepo;
    deploy.metadata.name = name;
    deploy.metadata.namespace = namespace;
    deploy.spec.replicas = replicas;
    deploy.spec.selector.matchLabels.run = name;
    deploy.spec.template.metadata.labels.run = name;
    deploy.spec.template.spec.initContainers[0].args[2] = gitRepo;
    return deploy;
};
