import { peerSocket } from 'messaging'
import * as fs from "fs";
import { inbox } from 'file-transfer';
import document from "document";

class File {
    constructor() {
        peerSocket.addEventListener('message', (evt) => {
            const { destFilename, data, error } = evt.data;
            console.log(JSON.stringify(evt.data));
            if (destFilename) {
                const promise = this.promises[this.now];
                if (error) {
                    promise.reject(error);
                }
                else {
                    this.getInboxFile(destFilename);
                    this.timestamp = Date.now();
                    if(data != "outbox")  {
                        this.file = data;
                        this.writeFile();
                    }
                    promise.resolve(this.fileName ?? destFilename);
                    console.log(`${this.fileName ?? destFilename} is now available`);
                }
                delete this.promises[this.now];
            }
        });
          
        peerSocket.addEventListener('open', (evt) => {
        setTimeout(() => {
            this.requests.forEach(r => this.sendRequest(r));
            this.requests.length = 0;
        }, 500);
        });
        
        peerSocket.addEventListener('error', (err) => {
        console.log("Connection error: " + err.message);
        // I don't know what to do in this case yet... Notify every promises object ?
        });

        inbox.addEventListener("newfile", (evt: Event) => {
        //     console.log(JSON.stringify(evt));
        //     this.getInboxFile();
        //     if(this.daylight1.href != this.fileName) {
        //         this.daylight1.href = this.fileName;
        //         console.log(`Image set to ${this.fileName}`);
        //     }
        });

    }

    fileRequested = false;
    firstRun =  1;

    file = undefined;
    fileName = "";
    timestamp = 0;
    now = Date.now();

    promises = {};
    requests = [];

    daylight1 = document.getElementById("daylight1") as ImageElement;

    searchInbox() {
        var inboxFileName = new String();
        var nextFile = new String();
        while (nextFile = inbox.nextFile()) {
            if(nextFile.indexOf(".jpg") > 0 || nextFile.indexOf(".png") > 0 || nextFile.indexOf(".txi") > 0) {
                inboxFileName = nextFile;
                console.log(`Inbox: /private/data/${inboxFileName} found`);
            }
        }
        return inboxFileName;
    }

    getInboxFile(receivedFileName = undefined) {
        try {
            var inboxFileName;

            inboxFileName = this.searchInbox();
            if(inboxFileName && inboxFileName != "") {
                this.fileName = `/private/data/${inboxFileName}`;
                this.readFile();
                console.log(`${this.fileName} received`);
            }
        }
        catch(ex) {
            console.error(ex.message);
        }
    }

    getLatestFile() {
        var files = fs.listDirSync("/private/data", );
        var fileList = new Array(String);
        var fsFile;

        try {
            while((fsFile = files.next()) && !fsFile.done) {
                fileList.push(fsFile.value);
            }
            fileList.sort();
            var fileName;

            for(var f = 0; f < fileList.length;  f++) {

                var newFileName = new String(fileList[f]);
                if(newFileName.indexOf(".jpg") > 0 || newFileName.indexOf(".png") > 0 || newFileName.indexOf(".txi") > 0) {
                    if(fileName) {
                        try {
                            fs.unlinkSync(`/private/data/${fileName}`);
                            console.log(`/private/data/${fileName} deleted`);
                        }
                        catch (ex) { console.log(ex.message); }
                    }

                    fileName = newFileName;
                    console.log("File is an image");
                    if(fileName) console.log(`Folder: ${this.fileName} found`);
                }
            }
            this.fileName = `/private/data/${fileName}`;
            this.readFile();
            files = null;
            fileList = null;
        }
        catch(ex) { console.log(ex.message); }
    }

    readFile(){
        try {
            console.log("ReadFile");
            var fileContent = fs.readFileSync(this.fileName);
            if(fileContent.byteLength < 1000) this.file = fileContent;
            console.log(fileContent.byteLength);
            fileContent = null;
        } catch (n) {
            this.file = { now : 0 };
        }
    }

    writeFile(){
        try {
            fs.writeFileSync(this.fileName, this.file);
        } catch (n) {
        }
    }

    sendRequest = (r) => {
        if (peerSocket.readyState === peerSocket.OPEN) {
            peerSocket.send(r);
        } else {
            this.requests.push(r);
        }
    }


    fetch = (maximumAge = 0, data) => {
        if (this.file === undefined) {
            this.readFile();
        }

        return new Promise((resolve, reject) => {
            this.now = Date.now()
            if (this.fileName && (this.now - this.timestamp < maximumAge)) {
                this.getInboxFile();
                resolve(this.fileName);
            }
            else {
                this.promises[this.now] = { resolve, reject };
                this.sendRequest(data);
            }
        })
    }

    get = () => {
        if(this.file === undefined) {
            this.readFile();
        }
        return this.file;
    }

    requestFile() {
        try {
            this.fileRequested = true;
            console.log("Request file");

            var data = {
                key: "getDaylightImage",
                value: this.fileRequested
            };
            console.log(JSON.stringify(data));

            this.fetch(this.firstRun * 60 * 1000, data)
            .then(filename => this.setFileName(filename))
            .then(() => this.firstRun = 60)
            .then(() => this.getLatestFile())
            .catch(error => console.log(error));

            console.log("File Updated");
        }
        catch(ex) {
            console.log(ex.message);
        }
    }

    setFileName(filename) {
        if(this.daylight1.href != filename && this.daylight1.href < filename) {
            this.daylight1.href = filename;
            console.log(`Image set to ${filename}`);
        }
    }
}

export default File;