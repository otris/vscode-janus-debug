import * as assert from 'assert';
import { VariablesContainer, VariablesMap } from '../src/variablesMap';

suite('variables map tests', () => {

    suite('createVariable', () => {

        let variablesMap: VariablesMap;

        setup(() => {
            variablesMap = new VariablesMap();
        });

        test('createStringVariable', () => {
            variablesMap.createVariable('stringVariable', 'myValue', 1, 1);
            const variablesContainer: VariablesContainer = variablesMap.getVariables(1);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'stringVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'stringVariable');
            assert.equal(variablesContainer.variables[0].value, 'myValue');
            assert.equal(variablesContainer.variables[0].type, 'string');
            assert.equal(variablesContainer.variables[0].variablesReference, 0);
        });

        test('createIntVariable', () => {
            variablesMap.createVariable('intVariable', 666, 1, 2);
            const variablesContainer: VariablesContainer = variablesMap.getVariables(2);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'intVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'intVariable');
            assert.equal(variablesContainer.variables[0].value, 666);
            assert.equal(variablesContainer.variables[0].type, 'number');
            assert.equal(variablesContainer.variables[0].variablesReference, 0);
        });

        test('createBooleanVariable', () => {
            variablesMap.createVariable('booleanVariable', true, 1, 3);
            const variablesContainer: VariablesContainer = variablesMap.getVariables(3);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'booleanVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'booleanVariable');
            assert.equal(variablesContainer.variables[0].value, 'true');
            assert.equal(variablesContainer.variables[0].type, 'boolean');
            assert.equal(variablesContainer.variables[0].variablesReference, 0);
        });

        test('createUndefinedVariable', () => {
            variablesMap.createVariable('undefinedVariable', undefined, 1, 4);
            const variablesContainer: VariablesContainer = variablesMap.getVariables(4);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'undefinedVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'undefinedVariable');
            assert.equal(variablesContainer.variables[0].value, 'undefined');
            assert.equal(variablesContainer.variables[0].type, 'undefined');
            assert.equal(variablesContainer.variables[0].variablesReference, 0);
        });

        test('createNullVariable', () => {
            variablesMap.createVariable('nullVariable', null, 1, 5);
            const variablesContainer: VariablesContainer = variablesMap.getVariables(5);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'nullVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'nullVariable');
            assert.equal(variablesContainer.variables[0].value, 'null');
            assert.equal(variablesContainer.variables[0].type, 'object');
            assert.equal(variablesContainer.variables[0].variablesReference, 0);
        });

        test('createArrayVariable', () => {
            const array = [1, 2, "test", true];
            variablesMap.createVariable('arrayVariable', array, 1, 6);
            let variablesContainer: VariablesContainer = variablesMap.getVariables(6);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'arrayVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'arrayVariable');
            assert.equal(variablesContainer.variables[0].value, '[Array]');
            assert.equal(variablesContainer.variables[0].type, 'array');

            const reference = variablesMap.createReference(1, 6, 'arrayVariable');
            variablesContainer = variablesMap.getVariables(reference);

            assert.notEqual(typeof variablesContainer, "undefined");
            assert.equal(variablesContainer.variables.length, array.length);

            const everyArrayEntriesPassed = array.every((element) => {
                return variablesContainer.variables.filter((variable) => {
                    return variable.value === element.toString();
                }).length === 1;
            });
            assert.equal(everyArrayEntriesPassed, true);

            const testEvaluateName = array.every((element, index) => {
                return variablesContainer.variables.filter((variable) => {
                    if (typeof variable.evaluateName !== 'undefined') {
                        return variable.evaluateName === `arrayVariable[${index}]`;
                    } else {
                        return false;
                    }
                }).length === 1;
            });
            assert.equal(testEvaluateName, true, 'Not every evaluate names are correct.');
        });

        test('createObjectVariable', () => {
            const obj: any = {
                stringProp: "stringValue",
                boolProp: false,
                intProp: 666
            };

            variablesMap.createVariable('objectVariable', obj, 1, 7);
            let variablesContainer: VariablesContainer = variablesMap.getVariables(7);

            assert.equal(variablesContainer.variables.length, 1);
            assert.equal(variablesContainer.variables[0].name, 'objectVariable');
            assert.equal(variablesContainer.variables[0].evaluateName, 'objectVariable');
            assert.equal(variablesContainer.variables[0].value, '[Object]');
            assert.equal(variablesContainer.variables[0].type, 'object');

            const reference = variablesMap.createReference(1, 7, 'objectVariable');
            variablesContainer = variablesMap.getVariables(reference);

            assert.notEqual(typeof variablesContainer, 'undefined');
            assert.equal(variablesContainer.variables.length, Object.keys(obj).length);

            const everyPropertyEntriesPassed = variablesContainer.variables.every((variable) => {
                if (obj.hasOwnProperty(variable.name) && obj[variable.name].toString() === variable.value) {
                    return true;
                } else {
                    return false;
                }
            });
            assert.equal(everyPropertyEntriesPassed, true);

            const testEvaluateName = variablesContainer.variables.forEach(variable => {
                assert.equal(
                    variable.evaluateName,
                    `objectVariable.${variable.name}`,
                    `Incorrect evaluate name. Expected "objectVariable.${variable.name}", got "${variable.evaluateName}"`
                );
            });
        });

    });
});
