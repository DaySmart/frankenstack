import { Component } from "../Entities/Component";
import { ComponentDeployment } from "../Entities/ComponentDeployment";
import { ComponentRollbackQuery } from "../Entities/ComponentRollbackQuery"
import { createNewObservation, generateTraceId } from "../Observation2";
import { ComponentRollbackQueryResponseHandler } from './ComponentRollbackQueryResponseHandler';

describe('ComponentRollbackQuery_resp', () => {
    it('returns last component deployment', () => {
        const rollbackQuery: ComponentRollbackQuery.DataSchema = {
            ComponentName: 'comp',
            Env: 'test'
        };

        const rollbackQueryObservation = createNewObservation(
            ComponentRollbackQuery.EntityObservation, 
            rollbackQuery,
            generateTraceId()
        );

        const component: Component.DataSchema = {
            DeploymentGuid: 'foo',
            Env: 'test',
            Name: 'comp',
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString()
        };

        const componentObservation = createNewObservation(
            Component.EntityObservation,
            component,
            generateTraceId()
        );

        const component2: Component.DataSchema = {
            DeploymentGuid: 'bar',
            Env: 'test',
            Name: 'comp',
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString()
        };

        const componentObservation2 = createNewObservation(
            Component.EntityObservation,
            component2,
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

        const componentDeployment2: ComponentDeployment.DataSchema = {
            DeploymentGuid: 'bar',
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

        const componentDeploymentObservation2 = createNewObservation(
            ComponentDeployment.EntityObservation,
            componentDeployment2,
            generateTraceId()
        );

        const dependentObservations = [[componentObservation, componentObservation2], [componentDeploymentObservation, componentDeploymentObservation2]];

        const resp: any = ComponentRollbackQueryResponseHandler(rollbackQueryObservation, dependentObservations, { time: new Date() })
        
        expect(resp.deploymentGuid).toEqual('bar');
    });

    it('ignores null provider configs', () => {
        const rollbackQuery: ComponentRollbackQuery.DataSchema = {
            ComponentName: 'comp',
            Env: 'test'
        };

        const rollbackQueryObservation = createNewObservation(
            ComponentRollbackQuery.EntityObservation, 
            rollbackQuery,
            generateTraceId()
        );

        const component: Component.DataSchema = {
            DeploymentGuid: 'foo',
            Env: 'test',
            Name: 'comp',
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString()
        };

        const componentObservation = createNewObservation(
            Component.EntityObservation,
            component,
            generateTraceId()
        );

        const component2: Component.DataSchema = {
            DeploymentGuid: 'bar',
            Env: 'test',
            Name: 'comp',
            Status: "DEPLOYED",
            Create: new Date().toISOString(),
            Update: new Date().toISOString()
        };

        const componentObservation2 = createNewObservation(
            Component.EntityObservation,
            component2,
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

        const componentDeployment2: ComponentDeployment.DataSchema = {
            DeploymentGuid: 'bar',
            Env: 'test',
            Name: "comp",
            Provider: {
                Name: 'provider',
                Config: [{
                    Key: 'key',
                    // @ts-ignore
                    Value: null
                }]
            },
        };

        const componentDeploymentObservation2 = createNewObservation(
            ComponentDeployment.EntityObservation,
            componentDeployment2,
            generateTraceId()
        );

        const dependentObservations = [[componentObservation, componentObservation2], [componentDeploymentObservation, componentDeploymentObservation2]];

        const resp: any = ComponentRollbackQueryResponseHandler(rollbackQueryObservation, dependentObservations, { time: new Date() })
        
        expect(resp.deploymentGuid).toEqual('bar');
        expect(resp.provider.config).toEqual([]);
    });
})