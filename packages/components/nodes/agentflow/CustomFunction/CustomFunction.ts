import { DataSource } from 'typeorm'
import {
    ICommonObject,
    IDatabaseEntity,
    INode,
    INodeData,
    INodeOptionsValue,
    INodeParams,
    IServerSideEventStreamer
} from '../../../src/Interface'
import { getVars, createCodeExecutionSandbox, processTemplateVariables } from '../../../src/utils'
import { updateFlowState } from '../utils'

interface ICustomFunctionInputVariables {
    variableName: string
    variableValue: string
}

const exampleFunc = `/*
* You can use any libraries imported in Flowise
* You can use properties specified in Input Variables with the prefix $. For example: $foo
* You can get default flow config: $flow.sessionId, $flow.chatId, $flow.chatflowId, $flow.input, $flow.state
* You can get global variables: $vars.<variable-name>
* Must return a string value at the end of function
*/

const fetch = require('node-fetch');
const url = 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true';
const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};
try {
    const response = await fetch(url, options);
    const text = await response.text();
    return text;
} catch (error) {
    console.error(error);
    return '';
}`

class CustomFunction_Agentflow implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    color: string
    hideOutput: boolean
    hint: string
    baseClasses: string[]
    documentation?: string
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Custom Function'
        this.name = 'customFunctionAgentflow'
        this.version = 1.1
        this.type = 'CustomFunction'
        this.category = 'Agent Flows'
        this.description = 'Execute custom function'
        this.baseClasses = [this.type]
        this.color = '#E4B7FF'
        this.inputs = [
            {
                label: 'Input Variables',
                name: 'customFunctionInputVariables',
                description: 'Input variables can be used in the function with prefix $. For example: $foo',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Variable Name',
                        name: 'variableName',
                        type: 'string'
                    },
                    {
                        label: 'Variable Value',
                        name: 'variableValue',
                        type: 'string',
                        acceptVariable: true
                    }
                ]
            },
            {
                label: 'Javascript Function',
                name: 'customFunctionJavascriptFunction',
                type: 'code',
                codeExample: exampleFunc,
                description: 'The function to execute. Must return a string or an object that can be converted to a string.'
            },
            {
                label: 'Update Flow State',
                name: 'customFunctionUpdateState',
                description: 'Update runtime state during the execution of the workflow',
                type: 'array',
                optional: true,
                acceptVariable: true,
                array: [
                    {
                        label: 'Key',
                        name: 'key',
                        type: 'asyncOptions',
                        loadMethod: 'listRuntimeStateKeys'
                    },
                    {
                        label: 'Value',
                        name: 'value',
                        type: 'string',
                        acceptVariable: true,
                        acceptNodeOutputAsVariable: true
                    }
                ]
            }
        ]
    }

    //@ts-ignore
    loadMethods = {
        async listRuntimeStateKeys(_: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> {
            const previousNodes = options.previousNodes as ICommonObject[]
            const startAgentflowNode = previousNodes.find((node) => node.name === 'startAgentflow')
            const state = startAgentflowNode?.inputs?.startState as ICommonObject[]
            return state.map((item) => ({ label: item.key, name: item.key }))
        }
    }

    async run(nodeData: INodeData, input: string, options: ICommonObject): Promise<any> {
        const javascriptFunction = nodeData.inputs?.customFunctionJavascriptFunction as string
        const functionInputVariables = (nodeData.inputs?.customFunctionInputVariables as ICustomFunctionInputVariables[]) ?? []
        const _customFunctionUpdateState = nodeData.inputs?.customFunctionUpdateState

        const state = options.agentflowRuntime?.state as ICommonObject
        const chatId = options.chatId as string
        const isLastNode = options.isLastNode as boolean
        const isStreamable = isLastNode && options.sseStreamer !== undefined

        const appDataSource = options.appDataSource as DataSource
        const databaseEntities = options.databaseEntities as IDatabaseEntity

        const variables = await getVars(appDataSource, databaseEntities, nodeData, options)
        const flow = {
            input,
            state,
            chatflowId: options.chatflowid,
            sessionId: options.sessionId,
            chatId: options.chatId,
            rawOutput: options.postProcessing?.rawOutput || '',
            chatHistory: options.postProcessing?.chatHistory || [],
            sourceDocuments: options.postProcessing?.sourceDocuments,
            usedTools: options.postProcessing?.usedTools,
            artifacts: options.postProcessing?.artifacts,
            fileAnnotations: options.postProcessing?.fileAnnotations
        }

        // Create additional sandbox variables for custom function inputs
        const additionalSandbox: ICommonObject = {}
        for (const item of functionInputVariables) {
            const variableName = item.variableName
            const variableValue = item.variableValue
            additionalSandbox[`$${variableName}`] = variableValue
        }

        const sandbox = createCodeExecutionSandbox(input, variables, flow, additionalSandbox)

        // Setup streaming function if needed
        const streamOutput = isStreamable
            ? (output: string) => {
                  const sseStreamer: IServerSideEventStreamer = options.sseStreamer
                  sseStreamer.streamTokenEvent(chatId, output)
              }
            : undefined

        try {
            // IMPORTANT: We execute user code directly with new Function instead of
            // executeJavaScriptCode (which uses vm2/NodeVM) because NodeVM deep-clones
            // the sandbox object. This means $flow.state mutations made inside the VM
            // are lost when execution completes. By using new Function with the sandbox
            // variables passed as arguments, we execute in the same V8 context so
            // $flow.state modifications propagate back to the original state object.
            const sandboxKeys = Object.keys(sandbox)
            const sandboxValues = Object.values(sandbox)
            const asyncUserFunction = new Function(...sandboxKeys, `return (async () => {\n${javascriptFunction}\n})()`)
            const response = await asyncUserFunction(...sandboxValues)

            let finalOutput = typeof response === 'object' ? JSON.stringify(response, null, 2) : response

            // 🔍 DEBUG: Track state right after user code execution
            console.log(
                `[TRACE-CF] After user code: state.simulation_id = "${state?.simulation_id}", state keys: [${Object.keys(state || {}).join(
                    ', '
                )}]`
            )

            let newState = JSON.parse(JSON.stringify(state))

            // 🔍 DEBUG: Track state after deep clone
            console.log(`[TRACE-CF] After JSON deep clone: newState.simulation_id = "${newState?.simulation_id}"`)

            if (_customFunctionUpdateState && Array.isArray(_customFunctionUpdateState) && _customFunctionUpdateState.length > 0) {
                console.log(`[TRACE-CF] _customFunctionUpdateState BEFORE updateFlowState: ${JSON.stringify(_customFunctionUpdateState)}`)
                newState = updateFlowState(newState, _customFunctionUpdateState)
                console.log(`[TRACE-CF] After updateFlowState: newState.simulation_id = "${newState?.simulation_id}"`)
            }

            newState = processTemplateVariables(newState, finalOutput)

            // 🔍 DEBUG: Track state before return
            console.log(`[TRACE-CF] After processTemplateVariables: newState.simulation_id = "${newState?.simulation_id}"`)

            const returnOutput = {
                id: nodeData.id,
                name: this.name,
                input: {
                    inputVariables: functionInputVariables,
                    code: javascriptFunction
                },
                output: {
                    content: finalOutput
                },
                state: newState
            }

            // 🔍 DEBUG: Verify what we're returning
            console.log(
                `[TRACE-CF] RETURNING state keys: [${Object.keys(returnOutput.state || {}).join(', ')}], simulation_id = "${
                    returnOutput.state?.simulation_id
                }"`
            )
            console.log(`[TRACE-CF] returnOutput.state === state original? ${returnOutput.state === state}`)
            console.log(`[TRACE-CF] returnOutput.state === newState? ${returnOutput.state === newState}`)

            return returnOutput
        } catch (e) {
            throw new Error(e)
        }
    }
}

module.exports = { nodeClass: CustomFunction_Agentflow }
