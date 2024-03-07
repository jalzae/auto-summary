// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { formatTs, formatDart } from './formatApi'
import { formatTsModel } from './formatModel'
import { generate } from './quicktype'
import { getContent } from './helper'
import { doc } from './types/document';
import { excludeGivenLines, validateGherkinScenario } from './gherkin';
import { htmlTest } from './html/test';
import { htmlDoc } from './html/doc';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
const vsCodePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/'

export async function activate(context: vscode.ExtensionContext) {

	const summaryFilePath = vsCodePath + '.vscode/summary.json';
	const baseUrlFilePath = vsCodePath + '.vscode/baseurl.json';
	const docPath = vsCodePath + '.vscode/document.json';

	const summaryFileExists = fs.existsSync(summaryFilePath);
	const baseUrlFileExists = fs.existsSync(baseUrlFilePath);
	const docFileExist = fs.existsSync(docPath);

	if (!docFileExist) {
		await fs.writeFileSync(docPath, JSON.stringify([], null, 2));
	}

	if (!summaryFileExists) {
		const defaultSummary = {
			usage: 'html content sample',
		};

		await fs.writeFileSync(summaryFilePath, JSON.stringify(defaultSummary, null, 2));
	}

	if (!baseUrlFileExists) {
		const defaultBaseUrl = [
			{ url: 'example.com', description: 'Example Website' },
		];

		await fs.writeFileSync(baseUrlFilePath, JSON.stringify(defaultBaseUrl, null, 2));
	}

	context.subscriptions.push(vscode.commands.registerCommand('document-summary.openFile', (realurl: string, start: number) => {
		vscode.workspace.openTextDocument(realurl).then((doc) => {
			vscode.window.showTextDocument(doc).then((editor) => {
				const position = new vscode.Position(start, 0);
				editor.selection = new vscode.Selection(position, position);
				editor.revealRange(new vscode.Range(position, position));
			});
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('document-summary.generateTsModel', (documentSummary: Document) => {
		try {
			vscode.workspace.findFiles('**/*').then(async (uriArray) => {
				let items = [] as MyItem[]
				// loop through each file
				items = await runner(uriArray);
				formatTsModel(items, "ts")
			});
		} catch (error) {
			vscode.window.showErrorMessage("its error when want to generate it");
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('document-summary.generateTsJsonApi', (documentSummary: Document) => {
		try {
			vscode.workspace.findFiles('**/*').then(async (uriArray) => {
				let items = [] as MyItem[]
				// loop through each file
				items = await runner(uriArray);
				generateTsFunction(items)
			});
		} catch (error) {
			vscode.window.showErrorMessage("its error when want to generate it");
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('document-summary.generateJsJsonApi', (documentSummary: Document) => {
		try {
			vscode.workspace.findFiles('**/*').then(async (uriArray) => {
				let items = [] as MyItem[]
				// loop through each file
				items = await runner(uriArray);
				generateTsFunction(items, 'js')
			});
		} catch (error) {
			vscode.window.showErrorMessage("its error when want to generate it");
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('document-summary.generateDartJsonApi', (documentSummary: Document) => {
		try {
			vscode.workspace.findFiles('**/*').then(async (uriArray) => {
				let items = [] as MyItem[]
				// loop through each file
				items = await runner(uriArray);
				generateTsFunction(items, 'dart')
			});
		} catch (error) {
			vscode.window.showErrorMessage("its error when want to generate it");
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('documentSummary.showTreeView', () => {
		vscode.workspace.findFiles('**/*').then(async (uriArray) => {
			let items = [] as MyItem[]
			// loop through each file
			items = await runner(uriArray);

			const treeDataProvider = new DocumentSummaryProvider(items);

			vscode.window.registerTreeDataProvider('documentSummary', treeDataProvider);
			vscode.commands.executeCommand('setContext', 'documentSummaryTreeViewVisible', true);
			const treeView = vscode.window.createTreeView('documentSummary', {
				treeDataProvider,
				showCollapseAll: true,
			});
		});
	}));


	vscode.commands.registerCommand('document-summary.scanFiles', () => {
		// Read and parse the JSON files
		let summaryData: any;
		let baseUrlData: server[] = [];

		if (summaryFileExists) {
			const summaryFileContent = fs.readFileSync(summaryFilePath, 'utf8');
			try {
				summaryData = summaryFileContent;
			} catch (error) {
				console.error('Error parsing summary.json:', error);
			}
		}

		if (baseUrlFileExists) {
			const baseUrlFileContent = fs.readFileSync(baseUrlFilePath, 'utf8');
			try {
				baseUrlData = JSON.parse(baseUrlFileContent);
			} catch (error) {
				console.error('Error parsing baseurl.json:', error);
			}
		}

		vscode.workspace.findFiles('**/*').then(async (uriArray) => {

			let items = [] as MyItem[]
			items = await runner(uriArray);
			showItemList(items, baseUrlData, summaryData)
			const treeDataProvider = new DocumentSummaryProvider(items);
			vscode.window.registerTreeDataProvider('documentSummary', treeDataProvider);
			vscode.commands.executeCommand('setContext', 'documentSummaryTreeViewVisible', true);
			vscode.window.createTreeView('documentSummary', {
				treeDataProvider,
				showCollapseAll: true,
			});
		});
	});

	context.subscriptions.push(vscode.commands.registerCommand('document-summary.generateTsSchema', () => {
		// get all the files in the workspace
		generate('typescript', 'ts')
	}));
	context.subscriptions.push(vscode.commands.registerCommand('document-summary.generateDartSchema', () => {
		// get all the files in the workspace
		generate('dart', 'dart')
	}));

	vscode.commands.registerCommand('document-summary.generateTest', () => {
		// get all the files in the workspace
		vscode.workspace.findFiles('**/*').then(async (uriArray) => {
			let items = [] as MyItem[]
			// loop through each file
			items = await runner(uriArray);
			try {

				const destructed = [] as any;

				for (const item of items) {
					if (item.route != '' && item.method != '' && item.function != '') {
						destructed.push({
							parent: item.url,
							title: item.function,
							method: item.method,
							url: item.route,
							header: [],
							after: JSON.parse(item.after),
							before: JSON.parse(item.before),
							body: JSON.parse(item.body),
							expected: 200
						})
					}
				}

				const uniquePeople = Array.from(new Set(destructed.map((person: any) => person.parent)));

				const result: any = [];
				uniquePeople.forEach((e: any) => {
					const resultFilter = (destructed.filter((el: any) => el.parent == e)).map(({ parent, ...rest } = destructed) => rest);
					result.push({ title: e, items: resultFilter })
				})
				makeArray(result);
			} catch (e) {

			}

		});
	});

	vscode.commands.registerCommand('document-summary.generateTsGherkin', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const selectedText = editor.document.getText(editor.selection);

		const result = validateGherkinScenario(selectedText)

		if (!result.status) {
			return;
		}

		const filePath = editor.document.uri.fsPath;
		let index = 0
		let content = `
		import assert from "assert";
		import { Given, When, Then } from "@cucumber/cucumber";
		`
		for (const line of result.data) {
			if (index > 0) {
				const trimmedLine = line.trim();
				if (trimmedLine.startsWith('Given')) {
					const resultLine = excludeGivenLines(trimmedLine, 'Given')
					content += `
					Given('${resultLine}', async () => {
					});`
				} else if (trimmedLine.startsWith('When')) {
					const resultLine = excludeGivenLines(trimmedLine, 'When')
					content += `
					When('${resultLine}', async () => {
					});`
				} else if (trimmedLine.startsWith('Then')) {
					const resultLine = excludeGivenLines(trimmedLine, 'Then')
					content += `
					Then('${resultLine}', async () => {
					});`
				}
			}
			index++
		}

		vscode.window.showInputBox({
			prompt: 'Enter filename',
			ignoreFocusOut: true
		}).then(async (title) => {
			if (!title) {
				vscode.window.showErrorMessage('Title cannot be empty. Command rejected.');
				return;
			}
			const outputFilePath = path.dirname(filePath) + '/' + title + '.ts'
			fs.writeFileSync(outputFilePath, content, 'utf-8');
			console.log(`File generated successfully at: ${title}`);
		})

	})

	vscode.commands.registerCommand('document-summary.generateDocument', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const selectedText = editor.document.getText(editor.selection);

		if (!selectedText) {
			return
		}

		const nameFunction = await vscode.window.showInputBox({
			prompt: 'Enter the name function:',
			ignoreFocusOut: true
		})

		if (!nameFunction) {
			return
		}

		const httpMethods = ['GET', 'POST', 'DELETE', 'PATCH'];
		const selectedMethod = await vscode.window.showQuickPick(httpMethods, { placeHolder: 'Select HTTP method' });

		if (!selectedMethod) {
			return
		}

		const nameRoute = await vscode.window.showInputBox({
			prompt: 'Enter the route:',
			ignoreFocusOut: true
		})

		if (!nameRoute) {
			return
		}

		const result = `
		//()SumStart
		//()SumFunc: ${nameFunction}
		//()SumRoute: ${nameRoute}
		//()SumMethod: ${selectedMethod}
		//()code:
		${selectedText}
		//()code:
		//()SumEnd
		`
		// Get the current selection range
		const selection = editor.selection;

		// Create a new TextEdit to replace the selection with the result
		const edit = new vscode.TextEdit(selection, result);

		// Apply the edit
		const workspaceEdit = new vscode.WorkspaceEdit();
		workspaceEdit.set(editor.document.uri, [edit]);

		// Apply the changes and show a message
		vscode.workspace.applyEdit(workspaceEdit).then(success => {
			if (success) {
				vscode.window.showInformationMessage('Text replaced successfully.');
			} else {
				vscode.window.showErrorMessage('Failed to replace text.');
			}
		});

	})

	vscode.commands.registerCommand('documentSummary.refreshEntry', async (selectedText: Document) => {
		vscode.commands.executeCommand('documentSummary.showTreeView');
	})
	vscode.commands.registerCommand('documentSummary.runEntry', async (selectedText: Document) => {
		const panel = htmlTest(selectedText, context)
		context.subscriptions.push(panel);
	})

	vscode.commands.registerCommand('documentSummary.editEntry', async (selectedText: Document) => {
		const panel = htmlDoc(selectedText, context)
		context.subscriptions.push(panel);
	})

	vscode.commands.registerCommand('document-summary.AddToDocument', async () => {

		const fileContents = fs.readFileSync(vsCodePath + '.vscode/document.json', 'utf8');
		const jsonData = JSON.parse(fileContents);
		const documents = jsonData as doc[]

		vscode.window.showInputBox({
			prompt: 'Enter the title for the document:',
			ignoreFocusOut: true
		}).then(async (title) => {
			if (!title) {
				vscode.window.showErrorMessage('Title cannot be empty. Command rejected.');
				return;
			}

			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			const selectedText = editor.document.getText(editor.selection);
			const filePath = editor.document.uri.fsPath;
			const startLine = editor.document.positionAt(editor.selection.start.line).line;
			documents.push({
				title,
				desc: `${selectedText}`,
				index: documents.length,
				realurl: filePath,
				start: startLine,
			})

			if (docFileExist) {
				fs.writeFileSync(docPath, JSON.stringify(documents, null, 2));
			}

			vscode.window.showInformationMessage(`Document Updated`);
		});
	});

	vscode.commands.registerCommand('document-summary.ShowDocument', async () => {
		const fileContents = fs.readFileSync(vsCodePath + '.vscode/document.json', 'utf8');
		const jsonData = JSON.parse(fileContents);
		const documents = jsonData as doc[]
		const treeDataProvider = new DocumentPreviewProvider(documents);
		vscode.window.registerTreeDataProvider('documentSummary', treeDataProvider);
		vscode.commands.executeCommand('setContext', 'documentSummaryTreeViewVisible', true);
		vscode.window.createTreeView('documentSummary', {
			treeDataProvider,
			showCollapseAll: true,
		});

	});

	context.subscriptions.push(vscode.extensions.onDidChange(() => {
		// Check if it's your extension
		const yourExtension = vscode.extensions.getExtension('documentSummary');
		if (yourExtension) {
			vscode.commands.executeCommand('documentSummary.showTreeView');
		}
	}));
	

}

async function generateTsFunction(items: MyItem[], extension: string = 'ts') {
	const destructed = [] as any;

	for (const item of items) {
		if (item.route != '' && item.method != '' && item.function != '') {
			destructed.push({
				parent: item.url,
				title: item.function,
				method: item.method,
				url: item.route,
				name: item.name,
				code: item.code
			})
		}
	}

	const uniquePeople = Array.from(new Set(destructed.map((person: any) => person.parent)));

	const result: any = [];
	uniquePeople.forEach((e: any) => {
		const resultFilter = (destructed.filter((el: any) => el.parent == e)).map(({ parent, ...rest } = destructed) => rest);
		result.push({ title: e, items: resultFilter })
	})
	if (extension == "dart") {
		formatDart(result, extension)
	} else {
		formatTs(result, extension)
	}

}

async function runner(uriArray: any) {
	let items = [] as MyItem[]
	for (const fileUri of uriArray) {
		// read the file content
		const flContent = fs.readFileSync(fileUri.fsPath).toString();
		// search for //()SumStart		

		const pattern = /\/\/\(\)SumStart.*?\/\/\(\)SumEnd/gs;
		const matches = [...flContent.matchAll(pattern)].map(match => match[0].trim());

		let result: string[] = []
		if (matches.length != 0) {
			result = matches
		}

		if (result.length > 0) {
			for (const [index, fileContent] of result.entries()) {
				const startIndex = fileContent.indexOf('()SumStart');
				const endIndex = fileContent.indexOf('()SumEnd');

				const textDocument = await vscode.workspace.openTextDocument(fileUri);
				const content = textDocument.getText();
				const index = content.indexOf(fileContent);
				const startLine = textDocument.positionAt(index).line;
				const endLine = textDocument.positionAt(index + fileContent.length).line;

				if (startIndex !== -1 && endIndex !== -1) {
					let relativePath = ''
					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (workspaceFolders) {
						const rootPath = workspaceFolders[0].uri.fsPath;
						relativePath = path.relative(rootPath, fileUri.fsPath);
					}
					// search for //()SumFunc
					const functionIndex = fileContent.indexOf('()SumFunc:', startIndex);
					const routeIndex = fileContent.indexOf('()SumRoute:', startIndex);
					const methodIndex = fileContent.indexOf('()SumMethod:', startIndex);
					const afterMethodIndex = fileContent.indexOf('()after:', startIndex);
					const beforeMethodIndex = fileContent.indexOf('()before:', startIndex);
					const bodyMethodIndex = fileContent.indexOf('()body:', startIndex);
					const resMethodIndex = fileContent.indexOf('()res:', startIndex);
					const descIndex = fileContent.indexOf('()desc:', startIndex);
					const resCodeIndex = fileContent.indexOf('()resCode:', startIndex);
					const reqBodyIndex = fileContent.indexOf('()reqBody:', startIndex);
					const reqParamIndex = fileContent.indexOf('()reqParam:', startIndex);
					const reqCodeIndex = fileContent.indexOf('()code:', startIndex);


					if (functionIndex !== -1) {
						const functionNameStartIndex = functionIndex + '()SumFunc:'.length;
						const functionNameEndIndex = fileContent.indexOf("\n", functionNameStartIndex);
						const functionName = fileContent.substring(functionNameStartIndex, functionNameEndIndex !== -1 ? functionNameEndIndex : undefined).trim();

						let routeName = ''
						if (routeIndex !== -1) {
							const routeNameStartIndex = routeIndex + '()SumRoute:'.length;
							const routeNameEndIndex = fileContent.indexOf("\n", routeNameStartIndex);
							routeName = fileContent.substring(routeNameStartIndex, routeNameEndIndex !== -1 ? routeNameEndIndex : undefined).trim();
						}

						let descName = ''
						if (descIndex !== -1) {
							const descIndexStart = descIndex + '()desc:'.length;
							const descIndexEnd = fileContent.indexOf("\n", descIndexStart);
							descName = fileContent.substring(descIndexStart, descIndexEnd !== -1 ? descIndexEnd : undefined).trim();
						}

						let resCodeData: any
						if (resCodeIndex != -1) {
							resCodeData = getContent(fileContent, '()resCode:');

						}

						let reqBodyName: any
						if (reqBodyIndex != -1) {
							reqBodyName = getContent(fileContent, '()reqBody:');
						}

						let reqParamName: Parameter[] = []
						if (reqParamIndex != -1) {
							const parameterResult = getContent(fileContent, '()reqParam:')
							isJsonString(parameterResult || '{}')
							reqParamName = JSON.parse(parameterResult || '{}')
						}

						//reqCodeIndex
						let code = ''
						if (reqCodeIndex != -1) {
							code = getContent(fileContent, '()code:') || '';
						}

						let methodName = ''
						if (methodIndex !== -1) {
							const methodNameStartIndex = methodIndex + '()SumMethod:'.length;
							const methodNameEndIndex = fileContent.indexOf("\n", methodNameStartIndex);
							methodName = fileContent.substring(methodNameStartIndex, methodNameEndIndex !== -1 ? methodNameEndIndex : undefined).trim();
						}

						let afterMethod = ''
						if (afterMethodIndex !== -1) {
							const afterMethodStartIndex = afterMethodIndex + '()after:'.length;
							const afterMethodEndIndex = fileContent.indexOf("\n", afterMethodStartIndex);
							afterMethod = fileContent.substring(afterMethodStartIndex, afterMethodEndIndex !== -1 ? afterMethodEndIndex : undefined).trim();
						}

						let beforeMethod = ''
						if (beforeMethodIndex !== -1) {
							const beforeMethodStartIndex = beforeMethodIndex + '()before:'.length;
							const beforeMethodEndIndex = fileContent.indexOf("\n", beforeMethodStartIndex);
							beforeMethod = fileContent.substring(beforeMethodStartIndex, beforeMethodEndIndex !== -1 ? beforeMethodEndIndex : undefined).trim();
						}

						let bodyMethod = ''
						if (bodyMethodIndex !== -1) {
							const bodyMethodStartIndex = bodyMethodIndex + '()body:'.length;
							const bodyMethodEndIndex = fileContent.indexOf("\n", bodyMethodStartIndex);
							bodyMethod = fileContent.substring(bodyMethodStartIndex, bodyMethodEndIndex !== -1 ? bodyMethodEndIndex : undefined).trim();
						}

						let resMethod = ''
						if (resMethodIndex !== -1) {
							const resMethodStartIndex = resMethodIndex + '()res:'.length;
							const resMethodEndIndex = fileContent.indexOf("\n", resMethodStartIndex);
							resMethod = fileContent.substring(resMethodStartIndex, resMethodEndIndex !== -1 ? resMethodEndIndex : undefined).trim();
						}


						const match = code.match(/SumFunc:(.*)/);
						const functionOnCode = match ? match[1].trim() : null;
						const stringWithoutFunctionName = code.replace(functionName, "");
						const lines = stringWithoutFunctionName.split('\n').filter(line => !line.trim().startsWith('//'));
						const resultCode = lines.join('\n');
						if (bodyMethod != '') {
							if (!isJsonString(bodyMethod)) {
								vscode.window.showErrorMessage('Body JSON string!:' + bodyMethod);
								bodyMethod = `{}`
							}
						}

						if (resMethod != '') {
							if (!isJsonString(resMethod)) {
								vscode.window.showErrorMessage('Res JSON string!:' + resMethod);
								resMethod = `{}`
							}
						}
						if (afterMethod != '') {
							if (!isJsonString(afterMethod)) {
								vscode.window.showErrorMessage('Invalid After JSON string!:' + afterMethod + 'on:' + functionName);
								afterMethod = `[]`
							}
						}
						if (beforeMethod != '') {
							if (!isJsonString(beforeMethod)) {
								vscode.window.showErrorMessage('Invalid Before JSON string!:' + afterMethod + 'on:' + functionName);
								beforeMethod = `[]`
							}
						}

						const item: MyItem = {
							realurl: fileUri.fsPath,
							url: relativePath,
							function: functionName,
							name: functionOnCode || '',
							code: resultCode,
							start: startLine,
							end: endLine,
							route: routeName || '',
							method: methodName || '',
							after: afterMethod || '[]',
							before: beforeMethod || '[]',
							body: bodyMethod || '{}',
							res: resMethod || '{}',
						}

						if (descName) item.description = descName

						if (resCodeData) {
							isJsonString(resCodeData)
							item.responseCode = JSON.parse(resCodeData)
						}

						if (reqBodyName) {
							isJsonString(reqBodyName)
							item.requestBody = JSON.parse(reqBodyName)
						}

						if (reqParamName) item.parameter = reqParamName

						items.push(item)

					}
				} else if (startIndex !== -1) {
					console.warn(`File ${fileUri} has a start comment without an end comment. Skipping...`);
				}
			}
		}
	}
	return items;
}

export interface MyItem {
	realurl: string;
	url: string;
	function: string;
	name: string;
	code: string;
	route: string;
	method: string;
	start: number;
	end: number;
	after: string;
	before: string;
	body: string;
	res: string;
	description?: string;
	requestBody?: any;
	responseCode?: any
	parameter?: Parameter[]
}

interface Parameter {
	name: string;
	in: "header" | "query" | "path" | "cookie";
	description?: string;
	required: boolean;
	schema: {
		type: string;
	};
}

interface server {
	url: string,
	description: string
}

export function isJsonString(str: string): boolean {
	try {
		JSON.parse(str);
		return true;
	} catch (error) {
		console.log(error)
		vscode.window.showErrorMessage('Error Format JSON string!:' + str);
		return false;
	}
}

function makeArray(items: any) {
	const vscodePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/.vscode';
	if (!fs.existsSync(vscodePath)) {
		fs.mkdirSync(vscodePath);
	}
	fs.writeFileSync(vscodePath + '/request.json', JSON.stringify(items));
}

function removeFileExtension(filePath: string) {
	if (filePath.includes('.')) {
		return filePath.replace(/\.\w+$/, '');
	} else {
		return filePath;
	}
}

function formatString(inputString: string) {
	return inputString.replace(/\\/g, '-');
}

function showItemList(items: MyItem[], servers: server[], menus: any) {
	let datas: any = {}
	for (let item of items) {
		if (item.route != '' && item.method != '' && item.function != '') {
			datas[item.route] = {
				[item.method.toLowerCase()]: {
					"summary": item.function,
					"operationId": item.function.trim(),
					"tags": [
						formatString(removeFileExtension(item.url))
					],
					"code": `${item.code}`,
					'responses': {
						...item.responseCode,
					}
				},
			}

			if (item.requestBody != null) datas[item.route][item.method.toLowerCase()]['requestBody'] = item.requestBody
			if (item.description != null) datas[item.route][item.method.toLowerCase()]['description'] = item.description
			if (item.responseCode != null) datas[item.route][item.method.toLowerCase()]['responses'] = item.responseCode
			if (item.parameter != null) datas[item.route][item.method.toLowerCase()]['parameters'] = item.parameter
		}
	}
	const vscodePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/.vscode';
	if (!fs.existsSync(vscodePath)) {
		fs.mkdirSync(vscodePath);
	}
	const html = makeSwagger();
	fs.writeFileSync(vscodePath + '/auto-summary.html', html);
	fs.writeFileSync(vscodePath + '/data.js', `const spec={
		"openapi": "3.0.1",
			"info": {
			"version": "1.0.0",
				"title": "API Specification"
		},
		
	 "paths": ${JSON.stringify((datas))},
  "servers": ${JSON.stringify(servers)},
  "menu": ${JSON.stringify(JSON.parse(menus))}
	}
`);

	// Check if the file exists
	const filePath = vscodePath + '/auto-summary.html'
	if (fs.existsSync(filePath)) {
		const fileUri = vscode.Uri.file(filePath);
		const url = fileUri.toString();
		vscode.env.openExternal(vscode.Uri.parse(url));
	} else {
		vscode.window.showErrorMessage(`File ${filePath} does not exist`);
	}
}

function makeSwagger() {
	const baseurl = 'https://api-doc-sample.netlify.app/'
	const html = `
	<!DOCTYPE html>
	<html>
	<head>
	<meta charset="UTF-8" >
		<title>Summary </title>
		 <meta charset="UTF-8">
  <link rel="stylesheet" type="text/css" href="${baseurl}bootstrap.min.css">
  <link rel="stylesheet" type="text/css" href="${baseurl}swagger-ui.css">
  <link rel="stylesheet" type="text/css" href="${baseurl}custom-swagger-ui.css">
  <link rel="stylesheet" href="${baseurl}prism.css">
  <script src="${baseurl}prism.js"></script>
  <link rel="stylesheet" href="${baseurl}style.css">
		
	</head>
	<body>
  <ul class="nav nav-tabs" id="tabMenu">
    <li class="nav-item">
      <a class="nav-link active" id="home-tab" data-toggle="tab" href="#home">Home</a>
    </li>
  </ul>
  <div class="tab-content" id="tabContent" class="col-md-12">
    <div class="tab-pane fade show active" id="home">
      <!-- Home content goes here -->
      <nav class="navbar navbar-expand-md navbar-light bg-light">
        <a style="padding-left: 18px;" class="navbar-brand d-flex align-items-center" href="#">
          <img src="${baseurl}logo.png" style="max-width: 40px; height: auto;" class="logo me-2">
        </a>


        <!-- Search Bar or Burger Menu -->
        <form class="form-inline my-2 my-md-0" style="padding-right:12px;">
          <input id="searchInput" class="form-control" type="search" onkeyup="filterAPI();" placeholder="Search"
            aria-label="Search">
        </form>
      </nav>

      <div class="col-md-12 d-flex">
        <div class="col-md-8">
          <div id="swagger-ui"></div>
        </div>
        <div id="sidebar" class="col-md-4 hidden">
          <div class="content">
            <h2>Details</h2>
            <div class="code-preview">
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

	<button id="flyout-button">X</button>
  <div id="sidebar-flying">
    <div id="sidebar-content">
      <span id="close-button" onclick="closeSidebar()">X</span>
      <input id="searchInputFlying" class="form-control" type="search" onkeyup="filterAPIFlying();" placeholder="Search"
        aria-label="Search">
      <ul id="sidebar-menu">
        
      </ul>
    </div>
  </div>

  <script src="${baseurl}jquery-3.5.1.slim.min.js"></script>
  <script src="${baseurl}bootstrap.min.js"></script>
  <script src="${baseurl}swagger-ui-bundle.js"> </script>
  <script src="${baseurl}swagger-ui-standalone-preset.js"> </script>
  <script src="./data.js"> </script>
  <script src="${baseurl}init.js"> </script>
	</body>
	</html>`;
	return html;
}


// This method is called when your extension is deactivated
export function deactivate() { }
export interface Document {
	realurl: string
	url: string
	function: string
	name: string
	code: string
	route: string
	method: string
	start: number
	end: number
	collapsed?: boolean
}


class DocumentSummaryProvider implements vscode.TreeDataProvider<Document> {
	private _onDidChangeTreeData: vscode.EventEmitter<Document | undefined> = new vscode.EventEmitter<Document | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Document | undefined> = this._onDidChangeTreeData.event;

	constructor(private documents: Document[]) { }

	addDocument(document: Document): void {
		const isDuplicate = this.documents.some((doc) => doc.url === document.url);

		if (!isDuplicate) {
			this.documents.push(document);
			this._onDidChangeTreeData.fire(undefined);
		}
	}

	getTreeItem(element: Document, collapsed: boolean = true): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(element.name, element.collapsed ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
		treeItem.description = `${element.url}`;
		treeItem.command = {
			command: 'document-summary.openFile',
			title: 'Open File',
			arguments: [element.realurl, element.start]
		};


		return treeItem;
	}

	getChildren(element?: Document): Thenable<Document[]> {
		if (element) {
			// If it's a child item (expanded), return the hardcoded children
			const hardcodedChildren: Document[] = this.documents.filter((e: Document) => e.url == element.url);
			for (let e of hardcodedChildren) {
				e.url = e.function
				e.collapsed = false
			}
			return Promise.resolve(hardcodedChildren);
		} else {
			const uniqueDocuments = this.documents.filter((doc, index, self) =>
				index === self.findIndex((d) => d.url === doc.url)
			);
			for (let e of uniqueDocuments) {
				e.collapsed = true
			}
			return Promise.resolve(uniqueDocuments);
		}
	}
}




class DocumentPreviewProvider implements vscode.TreeDataProvider<doc> {
	private _onDidChangeTreeData: vscode.EventEmitter<doc | undefined> = new vscode.EventEmitter<doc | undefined>();
	readonly onDidChangeTreeData: vscode.Event<doc | undefined> = this._onDidChangeTreeData.event;

	constructor(private documents: doc[]) { }

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: doc): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(element.title, vscode.TreeItemCollapsibleState.None);
		treeItem.description = `${element.title}`;
		treeItem.command = {
			command: 'document-summary.openFile',
			title: 'Open File',
			arguments: [element.realurl, element.start]
		};
		return treeItem;
	}

	getChildren(element?: doc): Thenable<doc[]> {
		return Promise.resolve(this.documents);
	}
}




