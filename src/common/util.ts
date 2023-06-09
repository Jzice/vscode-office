import * as vscode from 'vscode';
import { IImgInfo } from 'picgo/dist/utils/interfaces';
import { IUploadName, IOutputUrl } from './picgo';

enum Confirm {
    YES = "YES", NO = "NO"
}

export class Util {
    public static buildPath(data: string, webview: vscode.Webview, contextPath: string): string {
        return data.replace(/((src|href)=("|')?)(\/\/)/gi, "$1http://")
            .replace(/((src|href)=("|'))((?!(http|#)).+?["'])/gi, "$1" + webview.asWebviewUri(vscode.Uri.file(`${contextPath}`)) + "/$4");
    }

    public static listen(webviewPanel: vscode.WebviewPanel, uri: vscode.Uri, callback: () => void, disposeCallback?: () => void) {
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(callback);
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose()
        });
    }

    public static async confirm(title: string, placeHolder: string, callback?: () => void): Promise<boolean> {
        return this.confirmActual({ title, placeHolder }, callback)
    }

    public static async confirmActual(options: vscode.QuickPickOptions, callback?: () => void): Promise<boolean> {
        const res = await vscode.window.showQuickPick([Confirm.YES, Confirm.NO], options);
        const yes = res == Confirm.YES;
        if (yes && callback) {
            await callback()
            return true;
        }
        return yes;
    }
  
    public static limitTitle(title: string): string {
        return title.length <= 30 ? title : title.substring(0, 25) + '...';
    }
}

export function formatString(tplString: string, data: IUploadName | IOutputUrl) {
  const keys = Object.keys(data);
  const values = keys.map((k) => data[k]);
  return new Function(keys.join(','), 'return `' + tplString + '`').apply(null, values);
}

export function getUploadedName(imgInfo: IImgInfo): string {
    let fullName;
    if (!imgInfo.fileName) {
        fullName = '';
    } else {
        fullName = imgInfo.fileName as string;
    }
    let basename = path.basename(fullName, path.extname(fullName));
    return basename;
}
