'use strict';

import { DebugProtocol } from 'vscode-debugprotocol';
import { cantorPairing, reverseCantorPairing } from './cantor';
import { Logger } from './log';

let log = Logger.create('VariablesMap');

export type VariablesReference = number;
export class VariablesContainer {
    public contextId: number;
    public variables: DebugProtocol.Variable[];

    constructor(contextId: number) {
        this.contextId = contextId;
        this.variables = [];
    }
}

export class VariablesMap {
    private variablesMap: Map<VariablesReference, VariablesContainer> = new Map();

    /**
     * Generates a unique reference for a variable based on his contextId, frameId and the hashValue of the variables name.
     * @param {number} contextId - The context id
     * @param {number} frameId - The frame id
     * @param {string} variableName - The name of the variable
     * @returns {VariablesReference} A unique variables reference
     */
    public createReference(contextId: number, frameId: number, variableName: string): VariablesReference {
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
            frameId,
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

    public setVariables(reference: VariablesReference, container: VariablesContainer) {
        this.variablesMap.set(reference, container);
    }

    /**
     * Creates a variable based on the variableValue passed from the debugger.
     * The created variable(s) will be saved in an variables container in the variables map.
     * @param {string} variablesName - The display name of the variable
     * @param {any} variableValue - The value of the variable
     * @param {number} contextId - The context id
     * @param {number} frameId - The frame id
     * @param {string} [evaluateName] - This param is need for evaluate variables that are properties of object or elements of arrays. For this variables we need also the name of their parent to access the value.
     */
    public createVariable(variableName: string, variableValue: any, contextId: number, frameId: number, evaluateName?: string) {
        // The debugger returns every variable which will be declared in the script, also variables which doesn't exists at this time.
        // The value for these variables is '___jsrdbg_undefined___', so we just can skip these ones to display only the relevant variables
        if (variableValue === "___jsrdbg_undefined___") {
            return;
        }

        if (typeof evaluateName === 'undefined') {
            evaluateName = '';
        }

        log.info(`Creating variable ${variableName} with value ${variableValue}`);
        let variablesContainer: VariablesContainer = this.variablesMap.get(frameId) || new VariablesContainer(contextId);

        // If the container already contains a variable with this name => update
        let variable = this._createVariable(variableName, variableValue, contextId, frameId, evaluateName);

        if (variablesContainer.variables.length > 0) {
            let filterResult = variablesContainer.variables.filter((element) => {
                return element.name === variable.name;
            });

            if (filterResult.length > 0) {
                // Update the entry
                let indexOf = variablesContainer.variables.indexOf(filterResult[0]);
                variablesContainer[indexOf] = variable;
            } else {
                variablesContainer.variables.push(variable);
            }
        } else {
            variablesContainer.variables.push(variable);
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
     * @param {string} [evaluateName=variableName] - This param is need for evaluate variables that are properties of object or elements of arrays. For this variables we need also the name of their parent to access the value.
     * @returns {Variable} A full qualified variable object
     */
    private _createVariable(variableName: string, variableValue: any, contextId: number, frameId: number, evaluateName?: string): DebugProtocol.Variable {
        if (typeof evaluateName === 'undefined' || evaluateName === '') {
            evaluateName = variableName;
        }

        // We have do differntiate between primtive types and array, object and function
        switch (typeof variableValue) {
            case 'string':
            case 'number':
            case 'boolean':
            case 'undefined':
                return this.createPrimitiveVariable(variableName, variableValue, evaluateName);

            case 'object':
                if (variableValue === null) {
                    return this.createPrimitiveVariable(variableName, variableValue, evaluateName);
                } else if (variableValue.hasOwnProperty("length")) {
                    return this.createArrayVariable(variableName, variableValue, contextId, frameId, evaluateName);
                } else {
                    return this.createObjectVariable(variableName, variableValue, contextId, frameId, evaluateName);
                }

            default:
                throw new Error(`Unsupported variables type: ${typeof variableValue}`);
        }
    }

    /**
     * Creates a variable object for primtive types.
     * @param {string} variableName - The display name of the variable
     * @param {any} variableValue - The content of the variable
     * @param {string} evaluateName - This param is need for evaluate variables that are properties of object or elements of arrays. For this variables we need also the name of their parent to access the value.
     * @returns {Variable} A full qualified variables object
     */
    private createPrimitiveVariable(variableName: string, variableValue: any, evaluateName: string): DebugProtocol.Variable {
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
            evaluateName,
            value: variableValue,
            type: variableType,
            variablesReference: 0,
        };
    }

    /**
     * Creates a variable object for array types.
     * @param {string} variableName - The display name of the variable
     * @param {Array.<any>} variableValue - The content of the variable
     * @param {string} evaluateName - This param is need for evaluate variables that are properties of object or elements of arrays. For this variables we need also the name of their parent to access the value.
     * @returns {Variable} A full qualified variables object
     */
    private createArrayVariable(variableName: string, variableValue: any[], contextId: number, frameId: number, evaluateName: string): DebugProtocol.Variable {
        if (variableName === '') {
            throw new Error('Variables name cannot be empty.');
        }

        // Variables container for the entries of the array
        let variablesContainer: VariablesContainer = new VariablesContainer(contextId);

        // Arrays are returned as objects because the debugger represents the array elements as object properties.
        // The debugger also adds a length-property which represents the amount of elements inside the array.
        let index = 0;
        for (let key in variableValue) {
            if (variableValue.hasOwnProperty(key)) {
                let _variableName = (key === 'length') ? 'length' : index.toString();
                let _evaluateName = (key === 'length') ? `${evaluateName}.length` : `${evaluateName}[${index.toString()}]`;

                variablesContainer.variables.push(
                    this._createVariable(_variableName, variableValue[key], contextId, frameId, _evaluateName)
                );

                index++;
            }
        }

        // Create a reference for the variables container and insert it into the variables map
        let reference = this.createReference(contextId, frameId, evaluateName);
        this.variablesMap.set(reference, variablesContainer);

        // Return a variable which refers to this container
        return {
            name: variableName,
            evaluateName,
            type: 'array',
            value: '[Array]',
            variablesReference: reference
        };
    }

    /**
     * Creates a variable object for object types.
     * @param {string} variableName - The display name of the variable
     * @param {any} variableValue - The content of the variable
     * @param {string} evaluateName - This param is need for evaluate variables that are properties of object or elements of arrays. For this variables we need also the name of their parent to access the value.
     * @returns {Variable} A full qualified variables object
     */
    private createObjectVariable(variableName: string, variableValue: any, contextId: number, frameId: number, evaluateName: string): DebugProtocol.Variable {
        if (variableName === '') {
            throw new Error('Variables name cannot be empty.');
        }

        let variablesContainer: VariablesContainer = new VariablesContainer(contextId);

        if (variableValue.hasOwnProperty('___jsrdbg_function_desc___')) {
            // Functions will be recognised as objects because of the way the debugger evaluate functions
            let functionParams = variableValue.___jsrdbg_function_desc___.parameterNames;
            functionParams = functionParams.toString().replace(/,/, ', ');

            return this.createPrimitiveVariable(variableName, 'function (' + functionParams + ') { ... }', `${evaluateName}.${variableName}`);
        } else {
            // Create a new variable for each property on this object and chain them together with the reference property
            for (let key in variableValue) {
                if (variableValue.hasOwnProperty(key)) {
                    variablesContainer.variables.push(
                        this._createVariable(key, variableValue[key], contextId, frameId, `${evaluateName}.${key}`)
                    );
                }
            }
        }

        let reference = this.createReference(contextId, frameId, evaluateName);
        this.variablesMap.set(reference, variablesContainer);

        return {
            name: variableName,
            evaluateName,
            type: 'object',
            value: '[Object]',
            variablesReference: reference
        };
    }
}
