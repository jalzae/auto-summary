// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { match } from 'assert';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed


interface Document {
	realurl: string;
	url: string;
	function: string;
	name: string;
	code: string;
	route: string;
	method: string;
	start: number;
	end: number;
}

class DocumentSummaryProvider implements vscode.TreeDataProvider<Document> {
	private _onDidChangeTreeData: vscode.EventEmitter<Document | undefined> = new vscode.EventEmitter<Document | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Document | undefined> = this._onDidChangeTreeData.event;

	constructor(private documents: Document[]) { }

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: Document): vscode.TreeItem {
		const treeItem = new vscode.TreeItem(element.name, vscode.TreeItemCollapsibleState.None);
		treeItem.description = `${element.url} - @${element.function}`;
		treeItem.command = {
			command: 'document-summary.openFile',
			title: 'Open File',
			arguments: [element] // pass the element as an argument to the command
		};
		return treeItem;


	}

	getChildren(element?: Document): Thenable<Document[]> {
		return Promise.resolve(this.documents);
	}
}




export function activate(context: vscode.ExtensionContext) {

	console.log('Auto Summary Extension activated!');

	context.subscriptions.push(vscode.commands.registerCommand('document-summary.openFile', (documentSummary: Document) => {
		vscode.workspace.openTextDocument(documentSummary.realurl).then((doc) => {
			vscode.window.showTextDocument(doc).then((editor) => {
				const position = new vscode.Position(documentSummary.start, 0);
				editor.selection = new vscode.Selection(position, position);
				editor.revealRange(new vscode.Range(position, position));
			});
		});
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

	const disposable = vscode.commands.registerCommand('documentSummary.showTreeView', () => {
		vscode.workspace.findFiles('**/*').then(async (uriArray) => {
			let items = [] as MyItem[]
			// loop through each file
			items = await runner(uriArray);
			const treeDataProvider = new DocumentSummaryProvider(items);
			vscode.window.registerTreeDataProvider('documentSummary', treeDataProvider);
			vscode.commands.executeCommand('setContext', 'documentSummaryTreeViewVisible', true);
			vscode.window.createTreeView('documentSummary', {
				treeDataProvider,
				showCollapseAll: true,
			});
		});
	});

	vscode.commands.registerCommand('document-summary.scanFiles', () => {
		// get all the files in the workspace
		vscode.workspace.findFiles('**/*').then(async (uriArray) => {
			let items = [] as MyItem[]
			// loop through each file
			items = await runner(uriArray);
			showItemList(items)
			const treeDataProvider = new DocumentSummaryProvider(items);
			vscode.window.registerTreeDataProvider('documentSummary', treeDataProvider);
			vscode.commands.executeCommand('setContext', 'documentSummaryTreeViewVisible', true);
			vscode.window.createTreeView('documentSummary', {
				treeDataProvider,
				showCollapseAll: true,
			});
		});
	});

	vscode.commands.registerCommand('document-summary.generateTest', () => {
		// get all the files in the workspace
		vscode.workspace.findFiles('**/*').then(async (uriArray) => {
			let items = [] as MyItem[]
			// loop through each file
			items = await runner(uriArray);

			const destructed = [] as any;

			for (const item of items) {
				if (item.route != '' && item.method != '' && item.function != '') {

					destructed.push({
						parent: item.url,
						title: item.function,
						method: item.method,
						url: item.route,
						header: [],
						after: item.after != '' ? JSON.parse(item.after) : [],
						before: item.before != '' ? JSON.parse(item.before) : [],
						body: item.body != '' ? JSON.parse(item.body) : {},
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

		});
	});

	context.subscriptions.push(disposable);
}

async function generateTsFunction(items: MyItem[]) {
	const vscodePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/.vscode/ts';
	// create the directory if it doesn't exist
	if (!fs.existsSync(vscodePath)) {
		fs.mkdirSync(vscodePath);
	}

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

	for (const item of result) {
		const fileName = item.title.split('\\').pop(); // get the file name with extension
		const name = fileName.split('.').shift(); // remove the extension and get the name
		const formatname = name.toLowerCase()
		let content = `export default {`
		for (const i of item.items) {
			content += `${formatname}${getLastFunction(i.url)}(`
			//cek :id 
			if (checkIdExist(i.url)) {
				content += `id:any,`
			}
			//cek post or put 
			if (i.method == "POST" || i.method == "PUT") content += `data:any`
			content += `){ return {`
			content += `method:"${i.method}",`
			//cek post or put
			if (i.method == "GET" || i.method == "PUT" || i.method == "POST" || i.method == "DELETE") {
				if (checkIdExist(i.url)) {
					const replacedStr = i.url.replace("/:id", `"+id`);
					content += `url:"${replacedStr}`
				} else {
					content += `url:"${i.url}"`
				}
			} else {
				content += `url:"${i.url}"`
			}
			if (i.method == "POST" || i.method == "PUT") content += `,data`
			content += `}`
			content += `},`
		}
		content += `}`
	
		fs.writeFileSync(vscodePath + `/${formatname}.ts`, content);
	}

}

function checkIdExist(route: string): boolean {
	const idPattern = /\/:id/;
	return idPattern.test(route);
}

function getLastFunction(route: string) {

	let lastFunction = "";
	const parts = route.split('/');
	const lastPart = parts[parts.length - 1];

	if (lastPart.startsWith(':')) {
		lastFunction = parts[parts.length - 2];
	} else {
		lastFunction = parts[parts.length - 1];
	}
	return lastFunction;
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
				const startIndex = fileContent.indexOf('//()SumStart');
				const endIndex = fileContent.indexOf('//()SumEnd');

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
					const functionIndex = fileContent.indexOf('//()SumFunc:', startIndex);
					const routeIndex = fileContent.indexOf('//()SumRoute:', startIndex);
					const methodIndex = fileContent.indexOf('//()SumMethod:', startIndex);
					const afterMethodIndex = fileContent.indexOf('//()after:', startIndex);
					const beforeMethodIndex = fileContent.indexOf('//()before:', startIndex);
					const bodyMethodIndex = fileContent.indexOf('//()body:', startIndex);

					if (functionIndex !== -1) {
						const functionNameStartIndex = functionIndex + '//()SumFunc:'.length;
						const functionNameEndIndex = fileContent.indexOf("\n", functionNameStartIndex);
						const functionName = fileContent.substring(functionNameStartIndex, functionNameEndIndex !== -1 ? functionNameEndIndex : undefined).trim();

						let routeName = ''
						if (routeIndex !== -1) {
							const routeNameStartIndex = routeIndex + '//()SumRoute:'.length;
							const routeNameEndIndex = fileContent.indexOf("\n", routeNameStartIndex);
							routeName = fileContent.substring(routeNameStartIndex, routeNameEndIndex !== -1 ? routeNameEndIndex : undefined).trim();
						}

						let methodName = ''
						if (methodIndex !== -1) {
							const methodNameStartIndex = methodIndex + '//()SumMethod:'.length;
							const methodNameEndIndex = fileContent.indexOf("\n", methodNameStartIndex);
							methodName = fileContent.substring(methodNameStartIndex, methodNameEndIndex !== -1 ? methodNameEndIndex : undefined).trim();
						}

						let afterMethod = ''
						if (afterMethodIndex !== -1) {
							const afterMethodStartIndex = afterMethodIndex + '//()after:'.length;
							const afterMethodEndIndex = fileContent.indexOf("\n", afterMethodStartIndex);
							afterMethod = fileContent.substring(afterMethodStartIndex, afterMethodEndIndex !== -1 ? afterMethodEndIndex : undefined).trim();
						}

						let beforeMethod = ''
						if (beforeMethodIndex !== -1) {
							const beforeMethodStartIndex = beforeMethodIndex + '//()before:'.length;
							const beforeMethodEndIndex = fileContent.indexOf("\n", beforeMethodStartIndex);
							beforeMethod = fileContent.substring(beforeMethodStartIndex, beforeMethodEndIndex !== -1 ? beforeMethodEndIndex : undefined).trim();
						}

						let bodyMethod = ''
						if (bodyMethodIndex !== -1) {
							const bodyMethodStartIndex = bodyMethodIndex + '//()body:'.length;
							const bodyMethodEndIndex = fileContent.indexOf("\n", bodyMethodStartIndex);
							bodyMethod = fileContent.substring(bodyMethodStartIndex, bodyMethodEndIndex !== -1 ? bodyMethodEndIndex : undefined).trim();
						}

						const code = fileContent.substring(functionIndex + 12, endIndex).trim()
						const match = code.match(/SumFunc:(.*)/);
						const functionOnCode = match ? match[1].trim() : null;
						const stringWithoutFunctionName = code.replace(functionName, "");
						const lines = stringWithoutFunctionName.split('\n').filter(line => !line.trim().startsWith('//'));
						const resultCode = lines.join('\n');

						const item = {
							realurl: fileUri.fsPath,
							url: relativePath,
							function: functionName,
							name: functionOnCode || '',
							code: resultCode,
							start: startLine,
							end: endLine,
							route: routeName || '',
							method: methodName || '',
							after: afterMethod || '',
							before: beforeMethod || '',
							body: bodyMethod || '',
						}

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

interface MyItem {
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
}

function makeArray(items: any) {

	const vscodePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/.vscode';

	// create the directory if it doesn't exist
	if (!fs.existsSync(vscodePath)) {
		fs.mkdirSync(vscodePath);
	}

	// write the HTML content to a file in the .vscode directory
	fs.writeFileSync(vscodePath + '/request.json', JSON.stringify(items));
}

function showItemList(items: MyItem[]) {

	let datas: any = {}

	for (let item of items) {
		if (item.route != '' && item.method != '' && item.function != '') {
			datas[item.route] = {
				[item.method.toLowerCase()]: {
					"summary": item.function,
					"operationId": item.function.trim(),
					"tags": [
						item.url
					],
					responses: {
						"body": { description: item.body },
						"code": { description: item.code },
					}
				},
			}
		}
	}


	// get the path to the .vscode directory of the current workspace
	const vscodePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/.vscode';

	// create the directory if it doesn't exist
	if (!fs.existsSync(vscodePath)) {
		fs.mkdirSync(vscodePath);
	}

	// write the HTML content to a file in the .vscode directory
	const html = makeSwagger();
	fs.writeFileSync(vscodePath + '/auto-summary.html', html);
	fs.writeFileSync(vscodePath + '/data.js', `var spec={
		"openapi": "3.0.1",
			"info": {
			"version": "1.0.0",
				"title": "API Specification"
		},
		"paths":${JSON.stringify(datas)}}`);

	// Check if the file exists
	const filePath = vscodePath + '/auto-summary.html'
	if (fs.existsSync(filePath)) {
		// Get the URI of the file
		const fileUri = vscode.Uri.file(filePath);

		// Convert the URI to a URL
		const url = fileUri.toString();

		// Open the URL in the user's default web browser
		vscode.env.openExternal(vscode.Uri.parse(url));
	} else {
		vscode.window.showErrorMessage(`File ${filePath} does not exist`);
	}
}

function makeSwagger() {
	var html = `<html>

<head>
  <meta charset="UTF-8">
	<title>Summary</title>
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/3.19.5/swagger-ui.css">
  <style>
    .topbar {
      display: none;
    }
  </style>
</head>

<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/3.19.5/swagger-ui-bundle.js"> </script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/3.19.5/swagger-ui-standalone-preset.js"> </script>
  <script src="./data.js"> </script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      })
      window.ui = ui
    }
  </script>
</body>

</html>`;

	return html;
}


// This method is called when your extension is deactivated
export function deactivate() { }




