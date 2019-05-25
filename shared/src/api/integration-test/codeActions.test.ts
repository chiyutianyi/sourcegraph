import { Range } from '@sourcegraph/extension-api-classes'
import { first } from 'rxjs/operators'
import * as sourcegraph from 'sourcegraph'
import { CodeActionsParams } from '../client/services/codeActions'
import { TextModel } from '../client/services/modelService'
import { integrationTestContext } from './testHelpers'

const FIXTURE_MODEL: TextModel = { uri: 'file:///f2', languageId: 'l1', text: 't1' }

const FIXTURE_PARAMS: CodeActionsParams = {
    textDocument: { uri: FIXTURE_MODEL.uri },
    range: new Range(1, 2, 3, 4),
    context: { diagnostics: [] },
}

const FIXTURE_CODE_ACTION: sourcegraph.CodeAction = {
    title: 'a',
    command: { title: 'c', command: 'c' },
}

const FIXTURE_CODE_ACTIONS: sourcegraph.CodeAction[] = [FIXTURE_CODE_ACTION]

const FIXTURE_CODE_ACTIONS_CONTEXT: sourcegraph.CodeActionContext = { diagnostics: [] }

describe('Code actions (integration)', () => {
    describe('languages.registerCodeActionProvider', () => {
        test('provides', async () => {
            const { services, extensionAPI } = await integrationTestContext()

            const provider: sourcegraph.CodeActionProvider = {
                provideCodeActions: (doc, range, context) => {
                    expect(doc.text).toBe(FIXTURE_MODEL.text)
                    expect(Range.isRange(FIXTURE_PARAMS.range) && range.isEqual(FIXTURE_PARAMS.range)).toBeTruthy()
                    // tslint:disable-next-line: no-object-literal-type-assertion
                    expect(context).toEqual(FIXTURE_CODE_ACTIONS_CONTEXT)
                    return FIXTURE_CODE_ACTIONS
                },
            }

            const subscription = extensionAPI.languages.registerCodeActionProvider(['*'], provider)
            await extensionAPI.internal.sync()

            services.model.addModel(FIXTURE_MODEL)
            await extensionAPI.internal.sync()
            await extensionAPI.internal.sync()
            await extensionAPI.internal.sync()
            await extensionAPI.internal.sync()

            expect(
                await services.codeActions
                    .getCodeActions(FIXTURE_PARAMS)
                    .pipe(first())
                    .toPromise()
            ).toEqual(FIXTURE_CODE_ACTIONS)

            subscription.unsubscribe()
        })
    })
})
