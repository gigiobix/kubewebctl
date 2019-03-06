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

var service = require('./children/service/service.js');
var ingress = require('./children/ingress/ingress.js');
var deploy = require('./children/deploy/deploy.js');

module.exports = async function (args) {
  let now = new Date();
  let desired = {
      status: {},
      children: []
    };
  let key = Object.keys(args.children["Deployment.apps/v1"]);
  console.log("%s - [hook.js] observed is:\n%o\n", now, args.parent);
  if (key.length > 0) { // a deploy is already in place, so simply update the desired state     
    let currentDeploy = args.children["Deployment.apps/v1"][key];
    desired.status = {
      current: currentDeploy.status.readyReplicas,
      updated: currentDeploy.status.updatedReplicas,
      available: currentDeploy.status.availableReplicas,
      generation: currentDeploy.status.observedGeneration,
      route: args.parent.metadata.name + '.' + args.parent.spec.domain
    };
  } else { 
    desired.status = {
      current: 0,
      updated: 0,
      available: 0,
      generation: 0,
      route: args.parent.metadata.name + '.' + args.parent.spec.domain
    }
  };
  desired.children = [
    service.newService(args),
    ingress.newIngress(args),
    deploy.newDeploy(args)
  ]
  console.log("%s - [hook.js] desired is:\n%o\n", now, desired);
  return desired;
};
