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
		const item = new vscode.TreeItem(element.name);
		item.description = `${element.url} - ${element.function}`;
		return item;
	}

	getChildren(element?: Document): Thenable<Document[]> {
		return Promise.resolve(this.documents);
	}
}


export function activate(context: vscode.ExtensionContext) {

	console.log('Extension activated!');

	const disposable = vscode.commands.registerCommand('document-summary.scanFiles', () => {
		// get all the files in the workspace
		vscode.workspace.findFiles('**/*').then(async (uriArray) => {
			let items = [] as MyItem[]
			// loop through each file
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
								// search for //()SumEnd

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
								}



								items.push(item)

							}
						} else if (startIndex !== -1) {
							console.warn(`File ${fileUri} has a start comment without an end comment. Skipping...`);
						}
					}
				}
			}

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

	context.subscriptions.push(disposable);
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




