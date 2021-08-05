import { peerSocket } from 'messaging'
import * as fs from "fs";
import { inbox } from 'file-transfer';

class File {
    constructor() {
        peerSocket.addEventListener('message', (evt) => {
            const { destFilename, data, error } = evt.data;
            console.log(JSON.stringify(evt.data));
            if (destFilename) {
                const promise = this.promises[destFilename];
                if (error) {
                    promise.reject(error);
                }
                else {
                    this.fileName = destFilename;
                    this.timestamp = Date.now();
                    if(data == "outbox")  {
                        this.getInboxFile();
                    }
                    else {
                        this.file = data;
                        this.writeFile();
                    }
                    promise.resolve(this.file);
                    console.log(`/private/data/${this.fileName} is now available`);
                }
                delete this.promises[destFilename];
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
            console.log(JSON.stringify(evt));
            this.getInboxFile();
        });

    }

    file = undefined;
    fileName = "";
    timestamp = 0;

    promises = {};
    requests = [];

    getInboxFile() {
        this.getLatestFile();

        var newFileName;
        while (newFileName = inbox.nextFile()) {
            console.log(`/private/data/${newFileName} found in Inbox`);
        }
        try {
            this.file = fs.readFileSync(`/private/data/${newFileName}`)
            this.fileName = newFileName;
        }
        finally {
            this.file = fs.readFileSync(`/private/data/${this.fileName}`);
            return this.fileName;
        }
    }

    getLatestFile() {
        var files = fs.listDirSync("/private/data");
        var oldFile;
        var previousFile;
        while((oldFile = files.next()) && !oldFile.done) {
            try {
                fs.unlinkSync(previousFile);
                console.log(`${previousFile} deleted`);
            }
            catch (ex) { console.log(ex.message); }

            previousFile = this.fileName;

            var currentFileName = oldFile.value;
            if(currentFileName.indexOf(".jpg") > 0 || currentFileName.indexOf(".png") > 0) this.fileName = currentFileName;
            console.log(`/private/data/${this.fileName} found`);
        }
        return this.fileName;
    }

    readFile = () => {
        try {
            this.file = fs.readFileSync(this.fileName);
        } catch (n) {
            this.file = { now : 0 };
        }
    }

    writeFile = () => {
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


    fetch = (maximumAge = 0, location) => {
        if (this.file === undefined) {
            this.readFile();
        }

        return new Promise((resolve, reject) => {
            const now = Date.now()
            if (this.file && (now - this.timestamp < maximumAge)) {
                resolve(this.file);
            }
            else {
                this.promises[now] = { resolve, reject };
                this.sendRequest(location);
            }
        })
    }

    get = () => {
        if(this.file === undefined) {
            this.readFile();
        }
        return this.file;
    }
}

export default File;