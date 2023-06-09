import { EventEmitter } from 'events';
import { Output } from "./Output";
import * as fs from 'fs';
import * as vscode from 'vscode';

import { PicGo } from 'picgo/dist/core/PicGo';
import { IImgInfo } from 'picgo/dist/utils/interfaces';

import { formatString, getUploadedName } from './util';

export interface IUploadName {
    date: string;
    dateTime: string;
    fileName: string;
    extName: string;
    mdFileName: string;
    [key: string]: string;
}

export interface IOutputUrl {
    uploadedName: string;
    url: string;
    [key: string]: string;
}

export default class VSPicgo extends EventEmitter {
    private picgo: PicGo;

    private webviewPanel: vscode.WebviewPanel;

    constructor(webviewPanel: vscode.WebviewPanel) {
        super();
        this.picgo = new PicGo();
        this.webviewPanel = webviewPanel;
        this.configPicgo();
        this.addFinishListener();
    }

    configPicgo() {
        const picgoConfigPath = vscode.workspace.getConfiguration('vscode-office.picgo').get<string>('configPath');
        if (picgoConfigPath) {
            try {
                this.picgo.setConfig(
                    JSON.parse(
                        fs.readFileSync(picgoConfigPath, {
                            encoding: 'utf-8'
                        })
                    )
                );
            } catch (err) {
                Output.debug('The picgo configuration file could not be found!');
            }
        } else {
            Output.debug('The picgo configuration file could not be found!');
        }
    }

    upload(input: string) {
        this.picgo.upload([input]).then(() => {
            fs.unlinkSync(input);
        });
    }

    addFinishListener() {
        this.picgo.on('finished', async (ctx: PicGo) => {
            let urlText = '';
            const outputFormatTemplate = '![${uploadedName}](${url})';
            urlText = ctx.output.reduce((acc: string, imgInfo: IImgInfo): string => {
                return `${acc}${formatString(outputFormatTemplate, {
                    uploadedName: getUploadedName(imgInfo),
                    url: imgInfo.imgUrl
                })}\n`;
            }, '');

            urlText = urlText.trim();
            this.webviewPanel.webview.postMessage({
                type: 'picgo',
                urlText
            });
        });

        this.picgo.on('notification', (notice) => {
            Output.debug('Upload image failed: ' + notice);
        });
    }

    // async upload(input?: string[]): Promise<string | void | Error> {
    //   // This is necessary, because user may have changed settings
    //   this.configPicgo();
    //   return VSPicgo.picgo.upload(input);
    // }
}
