import * as vscode from 'vscode';
export function validateGherkinScenario(gherkinScenario: string): any {
  const lines = gherkinScenario.split('\n');

  let isInScenarioOutline = false;
  let hasGiven = false;
  let hasWhen = false;
  let hasThen = false;

  const searchGiven = lines.filter((e: string) => e.trim().startsWith('Given'))
  if (searchGiven.length == 0) hasGiven = true
  const searchWhen = lines.filter((e: string) => e.trim().startsWith('When'))
  if (searchWhen.length == 0) hasWhen = true
  const searchThen = lines.filter((e: string) => e.trim().startsWith('Then'))
  if (searchThen.length == 0) hasThen = true

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('Scenario:') || trimmedLine.startsWith('Scenario Outline:')) {
      isInScenarioOutline = true;
    } else if (trimmedLine.startsWith('Given')) {
      hasGiven = true;
    } else if (trimmedLine.startsWith('When')) {
      hasWhen = true;
    } else if (trimmedLine.startsWith('Then')) {
      hasThen = true;
    }
  }

  if (!isInScenarioOutline) {
    vscode.window.showErrorMessage('Validation error: Scenario does not match the expected structure :' + gherkinScenario);
    return { data: [], status: false };
  }

  console.log('Validation successful!');
  return { data: lines, status: true };
}

export function excludeGivenLines(gherkinScenario: string, situation: string): string {
  const lines = gherkinScenario.split(' ');
  const filteredLines = lines.filter(line => !line.includes(situation));
  return filteredLines.join(' ');
}