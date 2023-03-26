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

	console.log('Extension activated!');

	context.subscriptions.push(vscode.commands.registerCommand('document-summary.openFile', (documentSummary: Document) => {
		vscode.workspace.openTextDocument(documentSummary.realurl).then((doc) => {
			vscode.window.showTextDocument(doc).then((editor) => {
				const position = new vscode.Position(documentSummary.start, 0);
				editor.selection = new vscode.Selection(position, position);
				editor.revealRange(new vscode.Range(position, position));
			});
		});
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

			const result = destructed.reduce((acc: any, item: any) => {
				const { parent, ...rest } = item;
				const group = acc.find((g: any) => g.parent === parent);
				if (group) {
					group.destructed.push(rest);
				} else {
					acc.push({ title: parent, items: [rest] });
				}
				return acc;
			}, []);

			makeArray(result);

		});
	});

	context.subscriptions.push(disposable);
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
							const afterMethodStartIndex = afterMethodIndex + '//()SumAfter:'.length;
							const afterMethodEndIndex = fileContent.indexOf("\n", afterMethodStartIndex);
							afterMethod = fileContent.substring(afterMethodStartIndex, afterMethodEndIndex !== -1 ? afterMethodEndIndex : undefined).trim();
						}

						let beforeMethod = ''
						if (beforeMethodIndex !== -1) {
							const beforeMethodStartIndex = beforeMethodIndex + '//()SumAfter:'.length;
							const beforeMethodEndIndex = fileContent.indexOf("\n", beforeMethodStartIndex);
							beforeMethod = fileContent.substring(beforeMethodStartIndex, beforeMethodEndIndex !== -1 ? beforeMethodEndIndex : undefined).trim();
						}

						let bodyMethod = ''
						if (bodyMethodIndex !== -1) {
							const bodyMethodStartIndex = bodyMethodIndex + '//()SumAfter:'.length;
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
	// Create the webview panel
	const webviewPanel = vscode.window.createWebviewPanel(
		'document-summary.itemList',
		'My Documentation List',
		vscode.ViewColumn.Beside,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
		}
	);

	// Create an HTML string to display the list
	let html = `
    <html>
      <body>
        
	<ul>`;
	for (let item of items) {
		html += `<li><div>`
		html += `<p>${item.url} : ${item.start}-${item.end}</p>`;
		html += `<p>${item.function} </p>`;
		html += `<p>Route :${item.route} </p>`;
		html += `<p>Method :${item.method} </p>`;
		html += `<p>${item.code}</p>`;
		html += `</div></li>`
	}
	html += '</ul>';
	html += `</body>
    </html>`
	// Set the HTML content of the webview panel
	webviewPanel.webview.html = html;

	// get the path to the .vscode directory of the current workspace
	const vscodePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath + '/.vscode';

	// create the directory if it doesn't exist
	if (!fs.existsSync(vscodePath)) {
		fs.mkdirSync(vscodePath);
	}

	// write the HTML content to a file in the .vscode directory
	fs.writeFileSync(vscodePath + '/auto-summary.html', html);
}


// This method is called when your extension is deactivated
export function deactivate() { }




