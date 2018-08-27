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

var service = require('./website/service.js');
var ingress = require('./website/ingress.js');
var deploy = require('./website/deploy.js');

module.exports = async function (context) {
  //let now = new Date();
  let observed = context.request.body;
  let desired = { status: {}, children: [] };

  try {
    let key = Object.keys(observed.children["Deployment.apps/v1"]);
    console.log(key);
    if (key.length > 0) {
      // a deploy has been already created      
      let currentDeploy = observed.children["Deployment.apps/v1"][key];
      desired.status = {
        current: currentDeploy.status.readyReplicas,
        updated: currentDeploy.status.updatedReplicas,
        available: currentDeploy.status.availableReplicas,
        generation: currentDeploy.status.observedGeneration,
        route: observed.parent.metadata.name + '.' + observed.parent.spec.domain
      };
    } else {
      desired.status = {
        current: 0,
        updated: 0,
        available: 0,
        generation: 0,
        route: observed.parent.metadata.name + '.' + observed.parent.spec.domain
      }
    };
    desired.children = [
      service.newService(observed),
      ingress.newIngress(observed),
      deploy.newDeploy(observed)
    ]
  } catch (e) {
    return {status: 500, body: e.stack};
  }
  return {status: 200, body: desired, headers: {'Content-Type': 'application/json'}};
};
