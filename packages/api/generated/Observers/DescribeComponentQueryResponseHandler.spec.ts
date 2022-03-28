import { Component } from "../Entities/Component";
import { ComponentDeployment } from "../Entities/ComponentDeployment";
import { DescribeComponentQuery } from "../Entities/DescribeComponentQuery";
import { createNewObservation, generateTraceId } from "../Observation2";
import { DescribeComponentQueryResponseHandler } from "./DescribeComponentQueryResponseHandler";

describe('DescribeComponentQuery_resp', () => {
    it('returns component with component deployment inputs', () => {
        const describeComponentQuery: DescribeComponentQuery.DataSchema = {
            Env: 'test',
            ComponentName: 'comp'
        }

        const describeComponentQueryObservation = createNewObservation(
            DescribeComponentQuery.EntityObservation,
            describeComponentQuery,
            generateTraceId()
        );

        const component: Component.DataSchema = {
            DeploymentGuid: 'foo',
            Env: 'test',
            Name: 'comp',
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Outputs: [{
                Key: 'foo',
                Value: 'bar'
            }]
        };

        const componentObservation = createNewObservation(
            Component.EntityObservation,
            component,
            generateTraceId()
        );

        const componentDeployment: ComponentDeployment.DataSchema = {
            DeploymentGuid: 'foo',
            Env: 'test',
            Name: "comp",
            Provider: {
                Name: 'provider',
                Config: [{
                    Key: 'key',
                    Value: 'value'
                }]
            },
        };

        const componentDeploymentObservation = createNewObservation(
            ComponentDeployment.EntityObservation,
            componentDeployment,
            generateTraceId()
        );

        const dependentObservations = [[componentObservation], [componentDeploymentObservation]]

        const resp: any = DescribeComponentQueryResponseHandler(describeComponentQueryObservation, dependentObservations, { time: new Date()})

        expect(resp.deploymentGuid).toEqual('foo')
        expect(resp.name).toEqual('comp')
        expect(resp.env).toEqual('test')
        expect(resp.outputs).toEqual([{name: 'foo', value: 'bar'}])

    });

    it('secrets are masked in inputs', () => {
        const describeComponentQuery: DescribeComponentQuery.DataSchema = {
            Env: 'test',
            ComponentName: 'comp'
        }

        const describeComponentQueryObservation = createNewObservation(
            DescribeComponentQuery.EntityObservation,
            describeComponentQuery,
            generateTraceId()
        );

        const component: Component.DataSchema = {
            DeploymentGuid: 'foo',
            Env: 'test',
            Name: 'comp',
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString(),
            Outputs: [{
                Key: 'foo',
                Value: 'ssm:/test/comp/foo'
            }]
        };

        const componentObservation = createNewObservation(
            Component.EntityObservation,
            component,
            generateTraceId()
        );

        const componentDeployment: ComponentDeployment.DataSchema = {
            DeploymentGuid: 'foo',
            Env: 'test',
            Name: "comp",
            Provider: {
                Name: 'secrets',
                Config: [{
                    Key: 'key',
                    Value: 'value'
                }]
            },
            Inputs: [{
                Key: 'foo',
                Value: 'mysuperlongverylongneverendingsecretkeythatnooneshouldknow'
            }]
        };

        const componentDeploymentObservation = createNewObservation(
            ComponentDeployment.EntityObservation,
            componentDeployment,
            generateTraceId()
        );

        const dependentObservations = [[componentObservation], [componentDeploymentObservation]]

        const resp: any = DescribeComponentQueryResponseHandler(describeComponentQueryObservation, dependentObservations, { time: new Date()})

        expect(resp.deploymentGuid).toEqual('foo')
        expect(resp.name).toEqual('comp')
        expect(resp.env).toEqual('test')
        expect(resp.inputs[0].value).not.toEqual('mysuperlongverylongneverendingsecretkeythatnooneshouldknow')
        expect(resp.inputs[0].value).toMatch(/m\*{1,18}w/)
        expect(resp.outputs).toEqual([{name: 'foo', value: 'ssm:/test/comp/foo'}])
    });
})