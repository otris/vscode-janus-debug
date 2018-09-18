import * as assert from 'assert';
import { Context } from "../src/context";
import { VariablesContainer, VariablesMap } from '../src/variablesMap';

suite('variables map tests', () => {

    suite('createVariable', () => {

        let variablesMap: VariablesMap;

        setup(() => {
            variablesMap = new VariablesMap();
        });

        test('createStringVariable', async () => {
            await variablesMap.createVariable('stringVariable', 'myValue', 1, null as any, 1);
            const variablesContainer: VariablesContainer = variablesMap.getVariables(1);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'stringVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'stringVariable');
            assert.equal(variablesContainer.variables[0].value, 'myValue');
            assert.equal(variablesContainer.variables[0].type, 'string');
            assert.equal(variablesContainer.variables[0].variablesReference, 0);
        });

        test('createIntVariable', async () => {
            await variablesMap.createVariable('intVariable', 666, 1, null as any, 2);
            const variablesContainer: VariablesContainer = variablesMap.getVariables(2);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'intVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'intVariable');
            assert.equal(variablesContainer.variables[0].value, 666);
            assert.equal(variablesContainer.variables[0].type, 'number');
            assert.equal(variablesContainer.variables[0].variablesReference, 0);
        });

        test('createBooleanVariable', async () => {
            await variablesMap.createVariable('booleanVariable', true, 1, null as any, 3);
            const variablesContainer: VariablesContainer = variablesMap.getVariables(3);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'booleanVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'booleanVariable');
            assert.equal(variablesContainer.variables[0].value, 'true');
            assert.equal(variablesContainer.variables[0].type, 'boolean');
            assert.equal(variablesContainer.variables[0].variablesReference, 0);
        });

        test('createUndefinedVariable', async () => {
            await variablesMap.createVariable('undefinedVariable', undefined, 1, null as any, 4);
            const variablesContainer: VariablesContainer = variablesMap.getVariables(4);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'undefinedVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'undefinedVariable');
            assert.equal(variablesContainer.variables[0].value, 'undefined');
            assert.equal(variablesContainer.variables[0].type, 'undefined');
            assert.equal(variablesContainer.variables[0].variablesReference, 0);
        });

    });
});
