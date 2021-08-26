# `@daysmart/serverless-frankenstack-plugin`

Serverless framework plugin to resolve inputs from a frankenstack template locally.

## Usage

```
custom:
    frankenstack:
        template: /path/to/template.yml
        component: my-component # name of the component to deploy
        inputsProperty: config # the custom property to store the resolved frankenstack inputs to
```
