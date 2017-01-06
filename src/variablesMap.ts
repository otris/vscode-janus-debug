'use strict';

import { DebugProtocol } from 'vscode-debugprotocol';
import { cantorPairing, reverseCantorPairing } from './cantor';
import { Logger } from './log';

let log = Logger.create('VariablesMap');

export type VariablesReference = number;
export type VariablesContainer = DebugProtocol.Variable[];

export class VariablesMap {
    private variablesMap: Map<VariablesReference, VariablesContainer> = new Map();

    /**
     * Generates a unique reference for a variable based on his contextId, frameId and the hashValue of the variables name.
     * @param {number} contextId - The context id
     * @param {number} frameId - The frame id
     * @param {string} variableName - The name of the variable
     * @returns {VariablesReference} A unique variables reference
     */
    public createReference(contextId: number, frameId: number, variableName: string): VariablesReference{
        if (variableName === '') {
            throw new Error('Variables name cannot be empty.');
        }

        let hash;
        for (let i = 0; i < variableName.length; i++) {
            let chr = variableName.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }

        return cantorPairing(
            cantorPairing(contextId, frameId),
            hash,
        );
    }

    /**
     * Returns all variables with the passed references.
     * @param {VariablesReference} reference - Variables reference.
     * @returns {VariablesContainer} The variables container for the given reference.
     */
    public getVariables(reference: VariablesReference): VariablesContainer {
        let variables = this.variablesMap.get(reference);

        if (variables === undefined) {
            throw new Error(`Unable to get variables: No variable with reference ${reference}`);
        } else {
            return variables;
        }
    }

    /**
     * Creates a variable based on the variableValue passed from the debugger.
     * The created variable(s) will be saved in an variables container in the variables map.
     * @param {string} variablesName - The display name of the variable
     * @param {any} variableValue - The value of the variable
     * @param {number} contextId - The context id
     * @param {number} frameId - The frame id
     */
    public createVariable(variableName: string, variableValue: any, contextId: number, frameId: number) {
        // The debugger returns every variable which will be declared in the script, also variables which doesn't exists at this time.
        // The value for these variables is '___jsrdbg_undefined___', so we just can skip these ones to display only the relevant variables
        if (variableValue === "___jsrdbg_undefined___") {
            return;
        }

        log.info(`Creating variable ${variableName} with value ${variableValue}`);
        let variablesContainer: VariablesContainer = this.variablesMap.get(frameId) || [];

        // If the container already contains a variable with this name => update
        let variable = this._createVariable(variableName, variableValue, contextId, frameId);

        if (variablesContainer.length > 0) {
            let filterResult = variablesContainer.filter((element) => {
                return element.name === variable.name;
            });

            if (filterResult.length > 0) {
                // Update the entry
                let indexOf = variablesContainer.indexOf(filterResult[0]);
                variablesContainer[indexOf] = variable;
            } else {
                variablesContainer.push(variable);
            }
        } else {
            variablesContainer.push(variable);
        }

        this.variablesMap.set(frameId, variablesContainer);
    }

    /**
     * The main logic for variables creation.
     * This function creates based on the variables type one or more variables and chains them together with the variablesReference-property.
     * @param {string} variablesName - The display name of the variable
     * @param {any} variableValue - The value of the variable
     * @param {number} contextId - The context id
     * @param {number} frameId - The frame id
     * @returns {Variable} A full qualified variable object
     */
    private _createVariable(variableName: string, variableValue: any, contextId: number, frameId: number): DebugProtocol.Variable {
        // We have do differntiate between primtive types and array, object and function
        switch (typeof variableValue) {
            case 'string':
            case 'number':
            case 'boolean':
            case 'undefined':
                return this.createPrimitiveVariable(variableName, variableValue);

            case 'object':
                if (variableValue === null) {
                    return this.createPrimitiveVariable(variableName, variableValue);
                } else if (Array.isArray(variableValue)) {
                    return this.createArrayVariable(variableName, variableValue, contextId, frameId);
                } else {
                    return this.createObjectVariable(variableName, variableValue, contextId, frameId);
                }

            default:
                throw new Error(`Unsupported variables type: ${typeof variableValue}`);
        }
    }

    /**
     * Creates a variable object for primtive types.
     * @param {string} variableName - The display name of the variable
     * @param {any} variableValue - The content of the variable
     * @returns {Variable} A full qualified variables object
     */
    private createPrimitiveVariable(variableName: string, variableValue: any): DebugProtocol.Variable {
        if (variableName === '') {
            throw new Error('Variables name cannot be empty.');
        }

        let variableType = typeof variableValue;
        if (variableValue === undefined) {
            variableValue = 'undefined';
            variableType = 'undefined';
        } else if (variableValue === null) {
            variableValue = 'null';
            variableType = 'object';
        } else {
            variableValue = variableValue.toString();
        }

        return {
            name: variableName,
            value: variableValue,
            type: variableType,
            variablesReference: 0,
        };
    }

    /**
     * Creates a variable object for array types.
     * @param {string} variableName - The display name of the variable
     * @param {Array.<any>} variableValue - The content of the variable
     * @returns {Variable} A full qualified variables object
     */
    private createArrayVariable(variableName: string, variableValue: any[], contextId: number, frameId: number): DebugProtocol.Variable {
        if (variableName === '') {
            throw new Error('Variables name cannot be empty.');
        }

        // Variables container for the entries of the array
        let variablesContainer: VariablesContainer = [];

        variableValue.forEach((element, index) => {
            variablesContainer.push(this._createVariable(index.toString(), element, contextId, frameId));
        });

        // Create a reference for the variables container and insert it into the variables map
        let reference = this.createReference(contextId, frameId, variableName);
        this.variablesMap.set(reference, variablesContainer);

        // Return a variable which refers to this container
        return {
            name: variableName,
            type: 'array',
            value: '[Array]',
            variablesReference: reference
        };
    }

    /**
     * Creates a variable object for object types.
     * @param {string} variableName - The display name of the variable
     * @param {any} variableValue - The content of the variable
     * @returns {Variable} A full qualified variables object
     */
    private createObjectVariable(variableName: string, variableValue: any, contextId: number, frameId: number): DebugProtocol.Variable {
        if (variableName === '') {
            throw new Error('Variables name cannot be empty.');
        }

        let variablesContainer: VariablesContainer = [];

        if (variableValue.hasOwnProperty('___jsrdbg_function_desc___')) {
            // Functions will be recognised as objects because of the way the debugger evaluate functions
            let functionParams = variableValue.___jsrdbg_function_desc___.parameterNames;
            functionParams = functionParams.toString().replace(/,/, ', ');

            return this.createPrimitiveVariable(variableName, 'function (' + functionParams + ') { ... }');
        } else {
            // Create a new variable for each property on this object and chain them together with the reference property
            for (let key in variableValue) {
                if (variableValue.hasOwnProperty(key)) {
                    variablesContainer = variablesContainer.concat(this._createVariable(key, variableValue[key], contextId, frameId));
                }
            }
        }

        let reference = this.createReference(contextId, frameId, variableName);
        this.variablesMap.set(reference, variablesContainer);

        return {
            name: variableName,
            type: 'object',
            value: '[Object]',
            variablesReference: reference
        };
    }
}
