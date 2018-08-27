# Starting Guide
This is a simple example on how to build a Kubernetes custom controller using the Metacontroller framework.

## Background
Kubernetes APIs server can be extended by defining custom resources. To define a new resource type, we need to post a **Custom Resource Definition** object or **CRD** to the APIs server. The CRD object is the description of the custom resource type. Once the CRD is posted, we can then create instances of the custom resource by posting JSON or YAML manifests to the API server, the same we do with any other Kubernetes resource.

In this example, we want to allow users of kubernetes to run static websites as easily as possible, without having to deal in details with pods, services, and other Kubernetes resources. What we want to achieve is to let users to create objects of type *"website"*.

When a user creates an instance of the bebsite resource, we want the cluster to spin up a new deployment, a volume pointing to a Git reposistory hosting the static HTML pages, and expose the website to the external with a single action.

However, creating CRD, so that users can define websites, is unuseful if those we don’t make something tangible happening in the cluster. To make this an useful feature, each custom resource definition needs an associated controller, i.e. an active component doing something on the worker nodes, basing on the custom objects, the same way that all the core Kubernetes resources have an associated controller. In our case, a custom website controller, will be responsible for watching the website creation events and create all the required objects, including the pods and the service, that concretely implement the website.

## Metacontroller
To achieve our scope, we'll create a custom controller for websites using the [Metacontroller](https://github.com/GoogleCloudPlatform/metacontroller) framework.

Writing custom controllers with the meta-controller framewrok is pretty easy. With meta-controller, custom controllers are simple web hooks called by the meta-controller itself which is running as a pod in the control plane.

Once defined the custom resource in terms of the parent resource (e.g. the website), and the associated children resources (e.g. pods, services, deployments actually implementing the website), we instruct the metacontroller to map the parent with the children resources. Then the metacontroller will take care of reconciliation process between the observed and the desired state of the custom resources following the business logic defined into the web hook.

The web hooks can be written in any programming language understanding JSON.

## Setup
Having a Kubernetes 1.8+ cluster running, we first to install the Metacontroller. First, clone this repo in your local working environment where you have the ``kubectl`` cli.

    git clone https://github.com/kalise/kube-website-controller
    cd kube-website-controller

Create the namespace, service account, and role/binding

    cd meta-controller
    kubectl apply -f meta-controller-ns.yaml
    kubectl apply -f meta-controller-sa.yaml
    kubectl apply -f meta-controller-rbac.yaml

*Note: the metacontroller can be installed in any namespace.*

Create the CRDs for the Metacontroller APIs, and the Metacontroller itself as StatefulSet

    kubectl apply -f meta-controller-crd.yaml
    kubectl apply -f meta-controller.yaml

## Create a CRD for websites
We are going to create a CRD for our websites as for the ``website-crd.yaml`` file

    cd ..
    kubectl apply -f website-crd.yaml

In this file, we describe a parent resource, i.e. the website with all required fields. To tell the Metacontroller how to reconcile this custom resource with the actual resurces, i.e. the pods and other objects implementing the website, we need to define a composite controller descriptor as for the ``website-cc.yaml`` file  

```yaml
apiVersion: metacontroller.k8s.io/v1alpha1
kind: CompositeController
metadata:
  name: website-controller
spec:
  generateSelector: true
  parentResource:
    apiVersion: noverit.com/v1
    resource: websites
  childResources:
  - apiVersion: apps/v1
    resource: deployments
    updateStrategy:
      method: InPlace
  - apiVersion: v1
    resource: services
    updateStrategy:
      method: Recreate
  - apiVersion: extensions/v1beta1
    resource: ingresses
    updateStrategy:
      method: Recreate
  hooks:
    sync:
      webhook:
        url: http://website-controller/sync
```

In this case:

  1. We set ``generateSelector`` to  let the controller create a unique label selector for the parent object and use it for identify the child resources.
  2. The ``parentResource`` is our custom resource called ``websites``.
  3. The parent resource represents objects that are composed of other objects called children. The ``childResources`` list is composed by a Deployment, a Service and an Ingress.
  4. For each child resource, we can optionally set an ``updateStrategy`` to specify what to do if a child object needs to be updated. Since a service and an ingress are effectively immutable, we use the ``Recreate`` method for those, which means “delete the outdated object and create a new one”. For the deployment we use instead the ``InPlace`` update method, which means "update the outdated object that differs from the desired state".
  5. The ``hooks`` tells Metacontroller how to invoke the webhook, which is where we’ll define the business logic of our website controller. In our example, we use the embedded DNS to resolve the address of the ``website-controller`` service to reach the pod where our custom controller is running.
  
Create the composite controller descriptor

    kubectl apply -f website-cc.yaml

## Write the webhook
Metacontroller will handle the reconciliation loop for us, but we still need to tell it what our controller actually does. 

To define our business logic, we write a webhook that generates child objects based on the observed status, which is provided as a JSON object in the webhook request. The webhook response will contain the desired status in JSON format. Once the metacontroller receives the response, it compares the desired status with the actual status and it will take actions by sending requests to the APIs server.

The web hooks can be written in any programming language understanding JSON. In our case, we have a nodejs web server defined into ``./src/server.js`` file running the ``./src/sync.js`` function that actually implements our business logic.

## Deploy the webhook
Our webhook can be packaged as a Docker image and executed as a kubernetes deployment. Because it should be reachable by the metacontroller, we will wrap it as an in-cluster kubernetes service.

Create the controller













