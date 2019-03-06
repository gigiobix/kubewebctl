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

    git clone https://github.com/kalise/kubewebctl
    cd kubewebctl

Create the namespace, service account, and role/binding

    cd meta-controller
    kubectl apply -f meta-controller-rbac.yaml

*Note: the metacontroller can be installed in any namespace.*

Create the CRDs for the Metacontroller APIs, and the Metacontroller itself as StatefulSet

    kubectl apply -f meta-controller-crd.yaml
    kubectl apply -f meta-controller.yaml

## Create a CRD for websites
Create a CRD as for the ``web-crd.yaml`` file

    cd ../webctl
    kubectl apply -f web-crd.yaml

In this file, we describe a parent resource, i.e. the website with all required fields.

To tell the Metacontroller how to reconcile this custom resource with the actual resurces, i.e. the pods and other objects implementing the website, we need to define a custom controller as for the next section.

## Write the webhook
Metacontroller will handle the reconciliation loop for us, but we still need to tell it what our controller actually does. 

To define our business logic, we write a webhook that generates child objects based on the observed status, which is provided as a JSON object in the webhook request. The webhook response will contain the desired status in JSON format. Once the metacontroller receives the response, it compares the desired status with the actual status and it will take actions by sending requests to the APIs server.

The web hooks can be written in any programming language understanding JSON. In our case, we have a nodejs web server defined into ``./src/server.js`` file running the ``./src/hooks/sync.js`` function that actually implements our business logic.

## Deploy the webhook
Our webhook can be packaged as a Docker image and executed as a kubernetes deployment. Because it should be reachable by the metacontroller, we will wrap it as an in-cluster kubernetes service. The file ``web-controller.yaml`` defines such components

Create the controller

    kubectl apply -f web-controller.yaml

## Try it out
Finally, we can create our custom website from the ``kubeo.yaml`` file

```yaml
apiVersion: applications.clastix.io/v1
kind: Website
metadata:
  namespace:
  name: kubeo
  labels:
spec:
  replicas: 3
  gitRepo: https://github.com/kalise/kubeo.git
  domain: web.clastix.io
```

Apply the file

    kubectl apply -f kubeo.yaml

and check the website

    kubectl get ws
    NAME  DESIRED READY UPDATED AVAIL GEN AGE  ROUTE
    kubeo 3       3     3       3     1   16m  kubeo.noverit.com

Our website custom controller should see this and then it creates the related child resources: a deploy and its child pods, a service, and an ingress to expose the service to the external (assuming an ingress controller is in place).

Check all the created child resources:

    kubectl get deploy
    NAME      DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
    kubeo     3         3         3            3           22m

    kubectl get pods
    NAME                     READY     STATUS    RESTARTS   AGE
    kubeo-5f7bbd9564-kf6nn   1/1       Running   0          22m
    kubeo-5f7bbd9564-vmlc7   1/1       Running   0          22m
    kubeo-5f7bbd9564-xdjs9   1/1       Running   0          22m

    kubectl get services
    NAME      TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
    kubeo     ClusterIP   10.32.0.81    <none>        80/TCP    23m

    kubectl get ingress
    NAME      HOSTS                  ADDRESS   PORTS     AGE
    kubeo     kubeo.web.clastix.io             80        23m

Now the custom controller works with the metacontroller to reconcile the actual status of the child resources according to the parent desired status.

For example, scaling down the website

    kubectl scale ws kubeo --replicas=0

we see the controller scaling down the child deploy and this will scale down the number of controlled pod.

## Clean up
Deleting the website, we'll see the metacontroller remove all the child resources too

    kubectl delete ws kubeo

## Next Steps
Refer to the Metacontroller reposistory for further examples and in deep explanation.



